#!/bin/bash

# Deploy to AWS App Runner
# This script helps deploy the nucleus application to AWS App Runner

set -e

echo "🚀 Starting App Runner deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not authenticated. Please run 'aws configure' first."
    exit 1
fi

# Get account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)

echo "📋 Account ID: $ACCOUNT_ID"
echo "🌍 Region: $REGION"

# Check if the service already exists
SERVICE_EXISTS=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='nucleus-app'].ServiceName" --output text)

if [ "$SERVICE_EXISTS" = "nucleus-app" ]; then
    echo "🔄 Service 'nucleus-app' already exists. Updating..."
    
    # Get the service ARN
    SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='nucleus-app'].ServiceArn" --output text)
    
    # Update the service
    aws apprunner update-service \
        --service-arn "$SERVICE_ARN" \
        --source-configuration file://apprunner-config.json
    
    echo "✅ Service updated successfully!"
else
    echo "🆕 Creating new App Runner service..."
    
    # Create the service
    aws apprunner create-service \
        --cli-input-json file://apprunner-config.json
    
    echo "✅ Service created successfully!"
fi

# Wait for the service to be ready
echo "⏳ Waiting for service to be ready..."
aws apprunner wait service-running --service-name nucleus-app

# Get the service URL
SERVICE_URL=$(aws apprunner describe-service --service-name nucleus-app --query "Service.ServiceUrl" --output text)
echo "🌐 Service URL: $SERVICE_URL"

# Check if custom domain is configured
echo "🔗 Checking custom domain configuration..."
DOMAIN_STATUS=$(aws apprunner describe-service --service-name nucleus-app --query "Service.CustomDomains[0].Status" --output text 2>/dev/null || echo "NOT_CONFIGURED")

if [ "$DOMAIN_STATUS" = "ACTIVE" ]; then
    echo "✅ Custom domain is active!"
elif [ "$DOMAIN_STATUS" = "PENDING_CERTIFICATE_DNS_VALIDATION" ]; then
    echo "⏳ Custom domain is pending DNS validation..."
    echo "Please complete the DNS validation in your Route53 console."
else
    echo "⚠️  Custom domain not configured. You can configure it manually in the AWS Console."
fi

echo "🎉 Deployment completed!"
echo "📊 Monitor your service at: https://console.aws.amazon.com/apprunner/home?region=$REGION#/services" 