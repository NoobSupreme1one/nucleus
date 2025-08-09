# Deployment Guide

This project supports a new Cloudflare + Clerk deployment path, while retaining the legacy AWS App Runner option.

## Cloudflare Pages + Clerk (Preferred)

Prerequisites
- Cloudflare account with Pages enabled.
- Clerk application and keys.

Environment Variables
- VITE_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- FRONTEND_URL (e.g., your Pages URL)
- CLOUDFLARE_PAGES_URL (optional)

Client Deployment (Pages)
- Build: `npm run build` (outputs to `client/dist`)
- Connect repo in Cloudflare Pages.
- Build command: `npm run build`
- Output directory: `client/dist`
- Set the env vars above in the Pages project.

Server Notes
- The Express API now supports Clerk for auth when `CLERK_SECRET_KEY` is set.
- During migration, you can continue running the API as a Node service; place it behind Cloudflare as needed.

Wrangler Config
- `wrangler.toml` is included with `pages_build_output_dir = "client/dist"`.

## AWS App Runner Deployment Guide (Legacy)

This guide will help you deploy your nucleus application to AWS App Runner with your custom domain `foundrcheck.com`.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```

2. **Route53 hosted zone for foundrcheck.com**
   - Ensure you have a hosted zone in Route53 for `foundrcheck.com`
   - The domain should be registered and pointing to AWS nameservers

3. **GitHub repository**
   - Your code should be in a GitHub repository
   - App Runner will pull from this repository

## Step 1: Update Configuration Files

### 1.1 Update apprunner-config.json
Replace the placeholders in `apprunner-config.json`:

```json
{
  "ServiceName": "nucleus-app",
  "SourceConfiguration": {
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/NucleusAppRunnerExecutionRole"
    },
    "CodeRepository": {
      "CodeConfiguration": {
        "ConfigurationSource": "API",
        "ConfigurationValues": {
          "Runtime": "NODEJS_18",
          "BuildCommand": "npm ci && npm run build",
          "StartCommand": "npm start",
          "Port": "8080",
          "RuntimeEnvironmentVariables": [
            {
              "Name": "NODE_ENV",
              "Value": "production"
            },
            {
              "Name": "PORT",
              "Value": "8080"
            }
          ]
        }
      },
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "RepositoryUrl": "https://github.com/YOUR_USERNAME/nucleus.git"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1 vCPU",
    "Memory": "2 GB",
    "InstanceRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/NucleusAppRunnerServiceRole"
  },
  "NetworkConfiguration": {
    "EgressConfiguration": {
      "EgressType": "VPC",
      "VpcConnectorArn": "arn:aws:apprunner:YOUR_REGION:YOUR_ACCOUNT_ID:vpcconnector/nucleus-vpc-connector"
    }
  }
}
```

### 1.2 Get your AWS Account ID and Region
```bash
aws sts get-caller-identity --query Account --output text
aws configure get region
```

## Step 2: Deploy Infrastructure with CDK

### 2.1 Install CDK dependencies
```bash
cd infrastructure
npm install
```

### 2.2 Deploy the infrastructure
```bash
npm run cdk deploy
```

This will create:
- VPC and networking resources
- RDS PostgreSQL database
- S3 bucket for uploads
- Cognito User Pool
- IAM roles for App Runner
- Route53 hosted zone configuration
- SSL certificate

## Step 3: Create AWS Secrets

Create the following secrets in AWS Secrets Manager:

### 3.1 Database URL
```bash
aws secretsmanager create-secret \
  --name "nucleus-database-url" \
  --description "Database connection string for nucleus app" \
  --secret-string "postgresql://nucleus:PASSWORD@HOST:5432/nucleus"
```

### 3.2 API Keys
```bash
aws secretsmanager create-secret \
  --name "nucleus-perplexity-api-key" \
  --description "Perplexity API key" \
  --secret-string "YOUR_PERPLEXITY_API_KEY"

aws secretsmanager create-secret \
  --name "nucleus-stripe-secret-key" \
  --description "Stripe secret key" \
  --secret-string "YOUR_STRIPE_SECRET_KEY"

aws secretsmanager create-secret \
  --name "nucleus-stripe-webhook-secret" \
  --description "Stripe webhook secret" \
  --secret-string "YOUR_STRIPE_WEBHOOK_SECRET"
```

## Step 4: Create VPC Connector (if needed)

If your App Runner service needs to access VPC resources (like RDS):

```bash
aws apprunner create-vpc-connector \
  --vpc-connector-name "nucleus-vpc-connector" \
  --subnets "subnet-12345678,subnet-87654321" \
  --security-groups "sg-12345678"
```

## Step 5: Deploy to App Runner

### 5.1 Using the deployment script
```bash
./deploy-apprunner.sh
```

### 5.2 Manual deployment
```bash
aws apprunner create-service --cli-input-json file://apprunner-config.json
```

## Step 6: Configure Custom Domain

### 6.1 Add custom domain in App Runner console
1. Go to AWS App Runner console
2. Select your service
3. Go to "Custom domains" tab
4. Click "Add domain"
5. Enter `foundrcheck.com`
6. Choose the SSL certificate created by CDK

### 6.2 Update Route53 records
The CDK deployment should have created the necessary Route53 records. Verify they exist:

```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --query "ResourceRecordSets[?Name=='foundrcheck.com.']"
```

## Step 7: Environment Variables

Set the following environment variables in your App Runner service:

1. Go to App Runner console
2. Select your service
3. Go to "Configuration" tab
4. Add environment variables:

```
NODE_ENV=production
PORT=8080
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=<from CDK output>
AWS_COGNITO_CLIENT_ID=<from CDK output>
AWS_S3_BUCKET_NAME=<from CDK output>
AWS_BEDROCK_REGION=us-east-1
```

5. Add secrets:
```
DATABASE_URL=<secret ARN>
PERPLEXITY_API_KEY=<secret ARN>
STRIPE_SECRET_KEY=<secret ARN>
STRIPE_WEBHOOK_SECRET=<secret ARN>
```

## Step 8: Test the Deployment

### 8.1 Check service status
```bash
aws apprunner describe-service --service-name nucleus-app
```

### 8.2 Test the application
Visit `https://foundrcheck.com` to verify the deployment.

## Troubleshooting

### Common Issues

1. **Build failures**
   - Check the build logs in App Runner console
   - Ensure all dependencies are in package.json
   - Verify the build command works locally

2. **Database connection issues**
   - Ensure VPC connector is configured correctly
   - Check security group rules
   - Verify database credentials

3. **Custom domain not working**
   - Check DNS propagation (can take up to 48 hours)
   - Verify SSL certificate is valid
   - Check Route53 record configuration

4. **Environment variables not set**
   - Ensure all required environment variables are configured
   - Check secret ARNs are correct
   - Verify IAM permissions for accessing secrets

### Useful Commands

```bash
# Check service logs
aws apprunner describe-service --service-name nucleus-app

# List all services
aws apprunner list-services

# Delete service (if needed)
aws apprunner delete-service --service-arn <service-arn>

# Check custom domain status
aws apprunner describe-custom-domain-association \
  --service-arn <service-arn> \
  --domain-name foundrcheck.com
```

## Monitoring

1. **CloudWatch Logs**: App Runner automatically sends logs to CloudWatch
2. **Metrics**: Monitor CPU, memory, and request metrics
3. **Alarms**: Set up CloudWatch alarms for error rates and performance

## Cost Optimization

- Use the smallest instance size that meets your needs
- Enable auto-scaling based on traffic patterns
- Monitor usage and adjust resources accordingly

## Security Best Practices

1. Use IAM roles with minimal required permissions
2. Store sensitive data in AWS Secrets Manager
3. Enable VPC access only when necessary
4. Use HTTPS for all communications
5. Regularly update dependencies

## Next Steps

1. Set up CI/CD pipeline for automatic deployments
2. Configure monitoring and alerting
3. Set up backup and disaster recovery
4. Implement performance optimization
5. Add security scanning and compliance checks 
