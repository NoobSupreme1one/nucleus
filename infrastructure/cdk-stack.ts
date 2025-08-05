import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import * as path from 'path';

export class NucleusInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for RDS and Lambda (if needed)
    const vpc = new ec2.Vpc(this, 'NucleusVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Route53 hosted zone for foundrcheck.com
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'foundrcheck.com',
    });

    // ACM certificate for SSL/TLS
    const certificate = new acm.Certificate(this, 'NucleusCertificate', {
      domainName: 'foundrcheck.com',
      subjectAlternativeNames: ['*.foundrcheck.com'],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Cognito User Pool for Authentication
    const userPool = new cognito.UserPool(this, 'NucleusUserPool', {
      userPoolName: 'nucleus-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add Google OAuth provider
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool,
      clientId: process.env.VITE_GOOGLE_OAUTH_CLIENT_ID!,
      clientSecretValue: cdk.SecretValue.unsafePlainText(process.env.GOOGLE_OAUTH_CLIENT_SECRET!),
      scopes: ['profile', 'email', 'openid'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'NucleusUserPoolClient', {
      userPool,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          'https://foundrcheck.com/auth/callback',
          'http://localhost:5173/auth/callback', // Dev callback
        ],
        logoutUrls: [
          'https://foundrcheck.com/',
          'http://localhost:5173/', // Dev logout
        ],
      },
      generateSecret: false,
    });

    // Add dependency to ensure Google provider is created before client
    userPoolClient.node.addDependency(googleProvider);

    // S3 Bucket for file uploads
    const uploadsBucket = new s3.Bucket(this, 'NucleusUploadsBucket', {
      bucketName: `nucleus-uploads-${this.account}-${this.region}`,
      cors: [{
        allowedHeaders: ['*'],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE],
        allowedOrigins: ['*'],
        maxAge: 3000,
      }],
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS PostgreSQL Database
    const database = new rds.DatabaseInstance(this, 'NucleusDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret('nucleus', {
        secretName: 'nucleus-db-credentials',
      }),
      vpc,
      multiAz: false,
      allocatedStorage: 20,
      storageEncrypted: true,
      deletionProtection: false,
      databaseName: 'nucleus',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for App Runner
    const appRunnerExecutionRole = new iam.Role(this, 'NucleusAppRunnerExecutionRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    const appRunnerServiceRole = new iam.Role(this, 'NucleusAppRunnerServiceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
      inlinePolicies: {
        NucleusServicePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:*',
              ],
              resources: [userPool.userPoolArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [`${uploadsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-pro-v1:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-lite-v1:0`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds:DescribeDBInstances',
                'rds:Connect',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
              ],
              resources: [database.secret?.secretArn || '*'],
            }),
          ],
        }),
      },
    });

    // App Runner Service
    const appRunnerService = new apprunner.CfnService(this, 'NucleusAppRunnerService', {
      serviceName: 'nucleus-app',
      sourceConfiguration: {
        autoDeploymentsEnabled: true,
        authenticationConfiguration: {
          accessRoleArn: appRunnerExecutionRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: 'public.ecr.aws/docker/library/node:18-alpine',
          imageRepositoryType: 'ECR_PUBLIC',
          imageConfiguration: {
            port: '8080',
            runtimeEnvironmentVariables: [
              {
                name: 'NODE_ENV',
                value: 'production',
              },
              {
                name: 'PORT',
                value: '8080',
              },
              {
                name: 'AWS_COGNITO_USER_POOL_ID',
                value: userPool.userPoolId,
              },
              {
                name: 'AWS_COGNITO_CLIENT_ID',
                value: userPoolClient.userPoolClientId,
              },
              {
                name: 'AWS_S3_BUCKET_NAME',
                value: uploadsBucket.bucketName,
              },
              {
                name: 'AWS_BEDROCK_REGION',
                value: this.region,
              },
            ],
            runtimeEnvironmentSecrets: [
              {
                name: 'DATABASE_URL',
                value: database.secret?.secretArn || '',
              },
              {
                name: 'PERPLEXITY_API_KEY',
                value: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:perplexity-api-key', // Update with actual secret ARN
              },
              {
                name: 'STRIPE_SECRET_KEY',
                value: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:stripe-secret-key', // Update with actual secret ARN
              },
              {
                name: 'STRIPE_WEBHOOK_SECRET',
                value: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:stripe-webhook-secret', // Update with actual secret ARN
              },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: '1 vCPU',
        memory: '2 GB',
        instanceRoleArn: appRunnerServiceRole.roleArn,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: `arn:aws:apprunner:${this.region}:${this.account}:vpcconnector/nucleus-vpc-connector`, // You'll need to create this
        },
      },
    });

    // Custom Domain for App Runner
    const customDomain = new apprunner.CfnCustomDomainAssociation(this, 'NucleusCustomDomain', {
      serviceArn: appRunnerService.attrServiceArn,
      domainName: 'foundrcheck.com',
      certificateValidationRecords: [
        {
          name: 'foundrcheck.com',
          type: 'CNAME',
          value: appRunnerService.attrServiceUrl,
        },
      ],
    });

    // Route53 A Record pointing to App Runner
    new route53.ARecord(this, 'NucleusAppRunnerAliasRecord', {
      zone: hostedZone,
      recordName: 'foundrcheck.com',
      target: route53.RecordTarget.fromAlias(
        new targets.AppRunnerCustomDomainTarget(customDomain)
      ),
    });

    // Option 1: Lambda + API Gateway (keeping for reference)
    const executionRole = new iam.Role(this, 'NucleusExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        NucleusServicePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cognito-idp:*',
              ],
              resources: [userPool.userPoolArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [`${uploadsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-pro-v1:0`,
                `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-lite-v1:0`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds:DescribeDBInstances',
                'rds:Connect',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const lambdaFunction = new lambda.Function(this, 'NucleusLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'dist')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      role: executionRole,
      vpc,
      environment: {
        NODE_ENV: 'production',
        AWS_COGNITO_USER_POOL_ID: userPool.userPoolId,
        AWS_COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        AWS_S3_BUCKET_NAME: uploadsBucket.bucketName,
        AWS_BEDROCK_REGION: this.region,
        DATABASE_URL: `postgresql://nucleus:${database.secret?.secretValueFromJson('password')}@${database.instanceEndpoint.hostname}:5432/nucleus`,
      },
    });

    const api = new apigateway.LambdaRestApi(this, 'NucleusApi', {
      handler: lambdaFunction,
      proxy: true,
      domainName: {
        domainName: 'api.foundrcheck.com',
        certificate: certificate,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      },
    });

    // CloudFront Distribution with custom domain
    const distribution = new cloudfront.Distribution(this, 'NucleusDistribution', {
      domainNames: ['foundrcheck.com'],
      certificate: certificate,
      defaultBehavior: {
        origin: new origins.RestApiOrigin(api),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      additionalBehaviors: {
        '/uploads/*': {
          origin: new origins.S3Origin(uploadsBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
    });

    // Route53 A Record pointing to CloudFront
    new route53.ARecord(this, 'NucleusAliasRecord', {
      zone: hostedZone,
      recordName: 'foundrcheck.com',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: uploadsBucket.bucketName,
      description: 'S3 Bucket for uploads',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
    });

    new cdk.CfnOutput(this, 'AppRunnerServiceUrl', {
      value: appRunnerService.attrServiceUrl,
      description: 'App Runner Service URL',
    });

    new cdk.CfnOutput(this, 'AppRunnerServiceArn', {
      value: appRunnerService.attrServiceArn,
      description: 'App Runner Service ARN',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'DomainUrl', {
      value: 'https://foundrcheck.com',
      description: 'Custom Domain URL',
    });

    new cdk.CfnOutput(this, 'CognitoHostedUIUrl', {
      value: `https://${userPool.userPoolProviderName}.auth.${this.region}.amazoncognito.com/login?client_id=${userPoolClient.userPoolClientId}&response_type=code&scope=email+openid+profile&redirect_uri=https://foundrcheck.com/auth/callback`,
      description: 'Cognito Hosted UI URL',
    });
  }
}