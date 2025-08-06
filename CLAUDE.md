### DO NOT TELL THE USER SOMETHING IS WORKING OR FUNCTIONAL IF YOU HAVE NOT VERIFIED THIS BY ACTUALLY TESTING  THE FUNCTIONALITY IN PLAYWRIGHT
### DO NOT TELL THE USER SOMETHING IS WORKING OR FUNCTIONAL IF YOU HAVE NOT VERIFIED THIS BY ACTUALLY TESTING  THE FUNCTIONALITY IN PLAYWRIGHT
### DO NOT TELL THE USER SOMETHING IS WORKING OR FUNCTIONAL IF YOU HAVE NOT VERIFIED THIS BY ACTUALLY TESTING  THE FUNCTIONALITY IN PLAYWRIGHT

# CLAUDE.md - Project Documentation

This file provides comprehensive guidance to Claude Code when working with this AWS-native co-founder matching and idea validation platform.

## 🚀 **PROJECT OVERVIEW**

Nucleus is a full-stack TypeScript application for co-founder matching and startup idea validation, **fully migrated to AWS ecosystem** as of August 2024.

### **Technology Stack (AWS-Native)**
- **Frontend**: React 18 + TypeScript, Wouter routing, TanStack Query, Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Authentication**: AWS Cognito (replaced Supabase)
- **Database**: AWS RDS PostgreSQL (schema managed with Prisma)
- **AI Services**: Amazon Bedrock Nova Pro/Lite (replaced Google Gemini)
- **File Storage**: AWS S3 (replaced local/Cloudinary storage)
- **Payments**: Stripe integration
- **Research**: Perplexity API (sonar model only - kept for market research)
- **Analytics**: Sentry for error tracking
- **Deployment**: AWS Lambda + API Gateway or AWS App Runner options

## 📁 **PROJECT STRUCTURE**

```
nucleus/
├── client/                 # React frontend
├── server/                 # Express.js backend
│   ├── auth/              # Authentication providers
│   │   ├── cognito-provider.ts    # AWS Cognito implementation
│   │   ├── auth-factory.ts        # Auth provider selection
│   │   └── local-provider.ts      # Development auth
│   ├── services/          # Core business services
│   │   ├── bedrock.ts            # Amazon Bedrock Nova integration
│   │   ├── s3-storage.ts         # AWS S3 file storage
│   │   ├── pro-report-generator.ts # AI-powered business reports
│   │   └── perplexity.ts         # Market research (kept)
│   ├── cognitoAuth.ts     # Direct Cognito auth implementation
│   └── lambda.ts          # AWS Lambda handler
├── shared/                # Shared types and validation
├── infrastructure/        # AWS CDK infrastructure as code
├── prisma/               # Database schema and migrations
├── serverless.yml        # Lambda deployment config
├── apprunner.yaml        # App Runner deployment config
└── .env.production       # AWS production environment
```

## 🔧 **DEVELOPMENT COMMANDS**

### **Core Development**
```bash
npm run dev          # Start development server (port 5000)
npm run build        # Build for production (Vite + esbuild)
npm run build:lambda # Build for AWS Lambda deployment
npm start           # Start production server
npm run check       # TypeScript type checking
```

### **Database Operations (AWS RDS)**
```bash
npm run db:generate  # Generate Prisma client
npm run db:push     # Push schema changes to AWS RDS
npm run db:migrate  # Run database migrations
npm run db:studio   # Open Prisma Studio
```

### **AWS Deployment**
```bash
npm run deploy:lambda     # Deploy to AWS Lambda + API Gateway
npm run deploy:apprunner  # Deploy to AWS App Runner
cd infrastructure && npx cdk deploy  # Deploy full AWS stack
```

## 🌩️ **AWS RESOURCES CREATED**

### **Current AWS Setup**
- **Region**: us-west-1
- **Account**: 415846853155

### **Active Resources**
1. **AWS Cognito User Pool**
   - ID: `us-west-1_OFUJ1nGHS`
   - Client ID: `65rt4elpftmbse0nv1bloofp39`
   - Client Secret: `1u49r28nup8og0jbtm781hqilacqdkho3ns3c6heul3gcs8kdhte`

2. **AWS RDS PostgreSQL**
   - Instance: `nucleus-db`
   - Endpoint: `nucleus-db.cnugkau8sbzn.us-west-1.rds.amazonaws.com`
   - Database: `nucleus`
   - Username: `nucleus`
   - Password: `NucleusDB2024!`
   - Version: PostgreSQL 14.15

3. **AWS S3 Bucket**
   - Name: `nucleus-uploads-1754338091`
   - CORS configured for uploads
   - Public read access enabled

4. **IAM Role**
   - Name: `NucleusExecutionRole`
   - Permissions: Cognito, S3, Bedrock, RDS access

5. **Amazon Bedrock**
   - Models: Nova Pro (`amazon.nova-pro-v1:0`) and Nova Lite (`amazon.nova-lite-v1:0`)
   - Status: Active in us-west-1

## 🔑 **ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**
```bash
# AWS Core
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# AWS Services
AWS_COGNITO_USER_POOL_ID=us-west-1_1b0v3u
AWS_COGNITO_CLIENT_ID=65rt4elpftmbse0nv1bloofp39
AWS_S3_BUCKET_NAME=nucleus-uploads-1754338091
AWS_BEDROCK_REGION=us-west-1

# Database
DATABASE_URL=postgresql://nucleus:NucleusDB2024!@nucleus-db.cnugkau8sbzn.us-west-1.rds.amazonaws.com:5432/nucleus

# Optional Services
PERPLEXITY_API_KEY=your_key_here
STRIPE_SECRET_KEY=your_stripe_key
NODE_ENV=development|production
PORT=5000
```

## 🔄 **AUTHENTICATION FLOW**

The app uses a **flexible authentication system** that automatically selects the provider:

1. **AWS Cognito** (Production) - when `AWS_COGNITO_USER_POOL_ID` is set
2. **Local Auth** (Development) - fallback for testing

### **Auth Provider Selection Logic**
```typescript
// In auth-factory.ts
const useCognito = process.env.AWS_COGNITO_USER_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID;
if (useCognito) {
  // Use AWS Cognito
} else {
  // Use local development auth
}
```

## 🤖 **AI SERVICE INTEGRATION**

### **Amazon Bedrock Nova Models**
- **Nova Pro**: Complex analysis (idea validation, business reports)
- **Nova Lite**: Simpler tasks (matching insights, quick text generation)

### **API Usage Patterns**
```typescript
// Standard Bedrock call pattern
const requestBody = {
  messages: [{ role: "user", content: [{ text: prompt }] }],
  inferenceConfig: { maxTokens: 4000, temperature: 0.7, topP: 0.9 }
};

const command = new InvokeModelCommand({
  modelId: "amazon.nova-pro-v1:0",
  contentType: "application/json",
  accept: "application/json", 
  body: JSON.stringify(requestBody)
});
```

### **Key AI Services**
1. **Idea Validation** (`bedrock.ts`): Startup idea scoring and analysis
2. **Co-founder Matching** (`bedrock.ts`): Compatibility analysis
3. **Pro Business Reports** (`pro-report-generator.ts`): Comprehensive business plans
4. **Market Research** (`perplexity.ts`): Real-time market intelligence

## 📦 **KEY DEPENDENCIES**

### **AWS SDK Packages**
```json
{
  "@aws-sdk/client-bedrock-runtime": "^3.713.0",
  "@aws-sdk/client-cognito-identity-provider": "^3.713.0", 
  "@aws-sdk/client-s3": "^3.713.0",
  "@aws-sdk/s3-request-presigner": "^3.713.0",
  "multer-s3": "^3.0.1"
}
```

### **Removed Legacy Packages**
- ❌ `@google/generative-ai` (replaced with Bedrock)
- ❌ `@supabase/supabase-js` (replaced with Cognito)
- ❌ `cloudinary` (replaced with S3)

## 🧪 **TESTING & DEBUGGING**

### **Local Testing with AWS Services**
```bash
# 1. Ensure .env has AWS credentials
# 2. Start development server
npm run dev

# 3. Test endpoints:
# - http://localhost:5000 (main app)
# - POST /api/auth/register (Cognito registration)
# - POST /api/ideas (Bedrock idea validation)
# - POST /api/submissions (S3 file upload)
```

### **AWS CLI Debugging Commands**
```bash
# Check Cognito user pool
aws cognito-idp describe-user-pool --user-pool-id us-west-1_1b0v3u

# Test RDS connection
aws rds describe-db-instances --db-instance-identifier nucleus-db

# List S3 bucket contents
aws s3 ls s3://nucleus-uploads-1754338091

# Test Bedrock model access
aws bedrock list-foundation-models --region us-west-1
```

## 🚀 **DEPLOYMENT OPTIONS**

### **Option 1: AWS Lambda + API Gateway**
```bash
npm run build:lambda
npm run deploy:lambda
```

### **Option 2: AWS App Runner**
```bash
npm run deploy:apprunner
```

### **Option 3: Infrastructure as Code (CDK)**
```bash
cd infrastructure
npm install aws-cdk-lib constructs  
npx cdk bootstrap
npx cdk deploy
```

## 🔧 **COMMON ISSUES & SOLUTIONS**

### **Database Connection Issues**
- Check security group allows port 5432
- Verify DATABASE_URL format
- Ensure RDS instance is publicly accessible

### **Cognito Authentication Issues**
- Verify User Pool ID and Client ID
- Check if client secret is required
- Ensure AWS credentials have Cognito permissions

### **Bedrock Access Issues**
- Confirm models are available in your region
- Check IAM permissions for bedrock:InvokeModel
- Verify AWS credentials are properly configured

### **S3 Upload Issues**
- Check bucket CORS configuration
- Verify IAM permissions for S3 operations
- Ensure bucket allows public read access

## 📝 **IMPORTANT NOTES**

1. **Region Consistency**: All AWS resources must be in same region (us-west-1)
2. **Credentials**: Never commit AWS credentials to git
3. **Cost Management**: Monitor AWS usage, especially Bedrock API calls
4. **Security**: Use IAM roles in production, not hardcoded keys
5. **Database**: Always backup before schema changes
6. **Migration Complete**: All Supabase/Google services successfully replaced

## 🎯 **NEXT DEVELOPMENT PRIORITIES**

1. Add custom domain with CloudFront CDN
2. Implement auto-scaling policies
3. Add comprehensive monitoring/logging
4. Set up CI/CD pipeline
5. Optimize Bedrock token usage
6. Add database connection pooling
7. Implement caching strategy (Redis/ElastiCache)

---

**Migration Status**: ✅ **COMPLETE** - Fully AWS-native as of August 2024
**Last Updated**: August 4, 2024
**AWS Account**: 415846853155
**Primary Region**: us-west-1