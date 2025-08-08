# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
```bash
npm run dev              # Start development server with hot reload (tsx server/index.ts)
npm run build           # Build for production (vite + esbuild bundle)
npm start               # Start production server
npm run check           # TypeScript type checking
```

### Testing
```bash
npm test                # Run all tests (unit + integration)
npm run test:unit       # Run Vitest unit tests (client/src)
npm run test:integration # Run Jest integration tests
npm run test:e2e        # Run Playwright e2e tests
npm run test:watch      # Watch mode for unit tests
npm run test:coverage   # Generate coverage reports
npm run test:ci         # CI test suite with coverage + e2e
```

### Database Operations
```bash
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio
```

### AWS Deployment
```bash
npm run build:lambda    # Build for Lambda deployment
npm run deploy:lambda   # Deploy to AWS Lambda via Serverless
npm run deploy:apprunner # Deploy to AWS App Runner
```

## Architecture Overview

### Full-Stack Structure
- **Client**: React SPA with Vite build system
- **Server**: Express.js API with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Dual-provider system (AWS Cognito + Local)
- **Cloud Services**: AWS (Bedrock AI, S3, App Runner)
- **Payment**: Stripe integration

### Key Directories
```
client/src/          # React frontend
  pages/             # Route components (wouter routing)
  components/        # Shared React components + shadcn/ui
  lib/              # Client utilities, API client, auth
server/             # Express backend
  routes.ts         # Main API routes
  services/         # Business logic services
  auth/             # Authentication providers
  middleware/       # Express middleware
shared/             # Type definitions shared between client/server
prisma/             # Database schema
infrastructure/     # AWS CDK deployment code
```

### Authentication System
The app uses a factory pattern for authentication with two providers:
- **Production**: AWS Cognito (when `AWS_COGNITO_USER_POOL_ID` is set)
- **Development**: Local authentication with in-memory storage

Authentication middleware is dynamically selected based on environment configuration.

### Core Services
- **Bedrock AI**: Startup idea validation using AWS Bedrock
- **Pro Report Generator**: Comprehensive business report generation
- **Founder Matching**: User matching based on skills/interests
- **Privacy Manager**: User privacy settings management
- **Stripe Integration**: Subscription management and payments

### Database Schema
Uses Prisma with PostgreSQL. Key entities:
- `User` (with roles: engineer/designer/marketer)
- `Idea` (startup ideas with validation scores)
- `Match` (founder matching system)
- `Submission` (user submissions)
- Subscription tiers (free/pro)

### Frontend Architecture
- **Routing**: wouter for client-side routing
- **State**: React Query for server state, React Context for auth
- **Styling**: Tailwind CSS with shadcn/ui components
- **Themes**: Dark/light theme support via next-themes

### Testing Strategy
- **Unit**: Vitest for client-side testing
- **Integration**: Jest for server-side API testing
- **E2E**: Playwright for full user journey testing
- **Coverage**: Combined coverage reporting

### Rate Limiting & Security
Implements multiple layers:
- DDoS protection
- User-based rate limiting
- Feature-specific rate limits for free vs pro users
- Input sanitization and security headers

### Deployment Options
1. **AWS App Runner**: Production deployment with custom domain
2. **AWS Lambda**: Serverless deployment via Serverless Framework
3. **Local**: Development with file-based storage fallback

## Environment Configuration

### Required for Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=...
AWS_COGNITO_CLIENT_ID=...
AWS_S3_BUCKET_NAME=...
PERPLEXITY_API_KEY=...
STRIPE_SECRET_KEY=...
```

### Development Fallbacks
The system gracefully falls back to local authentication and file storage when AWS credentials are not configured, making local development straightforward.

## Important Notes

- Always run `npm run check` before committing to ensure TypeScript compliance
- The authentication system automatically selects providers based on environment
- Database migrations should be run with `npm run db:migrate` in production
- Use `npm run test:ci` to run the full test suite before deployment
- The app supports both AWS-based and local development without configuration changes