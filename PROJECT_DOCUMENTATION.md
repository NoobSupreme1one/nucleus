# Nucleus Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Development Setup](#development-setup)
6. [API Documentation](#api-documentation)
7. [Component Structure](#component-structure)
8. [Authentication & Security](#authentication--security)
9. [Database Schema](#database-schema)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Performance Optimizations](#performance-optimizations)
13. [Contributing](#contributing)

## Project Overview

Nucleus is a comprehensive startup validation and matching platform that helps entrepreneurs:
- Validate business ideas with AI-powered analysis
- Generate professional reports with market insights
- Match with potential co-founders and funding opportunities
- Access domain suggestions and branding resources
- Track performance on leaderboards

The platform combines React frontend with Express.js backend, featuring modern authentication, AI integrations, and cloud deployment capabilities.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express Server  │────│   AWS Services  │
│   (Vite + TS)   │    │   (Node.js/TS)   │    │ (Bedrock/S3/RDS)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │  Authentication  │
                    │ (Clerk/Cognito)  │
                    └──────────────────┘
```

### Data Flow
1. **User Interaction**: Frontend components handle user input
2. **API Communication**: React Query manages server state
3. **Authentication**: Clerk/Cognito provides secure auth
4. **Data Processing**: Express server processes business logic
5. **AI Integration**: Bedrock/Perplexity for analysis
6. **Storage**: S3 for files, PostgreSQL for structured data

## Project Structure

```
nucleus/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Shadcn/UI components
│   │   │   ├── pro-report/  # Professional report sections
│   │   │   └── __tests__/   # Component tests
│   │   ├── pages/           # Route components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   ├── contexts/        # React contexts
│   │   ├── assets/          # Static assets
│   │   └── mockup/          # Mock components/data
│   ├── index.html           # Entry HTML template
│   └── dist/                # Build output
├── server/                   # Express backend application
│   ├── auth/                # Authentication providers
│   ├── middleware/          # Express middleware
│   ├── services/            # Business logic services
│   ├── tests/               # Server-side tests
│   ├── index.ts            # Main server entry point
│   ├── routes.ts           # API route definitions
│   └── lambda.ts           # AWS Lambda handler
├── shared/                  # Shared TypeScript utilities
│   ├── types.ts            # Common type definitions
│   ├── schema.ts           # Validation schemas
│   └── validation.ts       # Validation utilities
├── infrastructure/         # AWS CDK infrastructure code
│   ├── bin/                # CDK entry points
│   ├── cdk-stack.ts       # Infrastructure definitions
│   └── cdk.out/           # CDK output artifacts
├── tests/e2e/             # End-to-end Playwright tests
├── prisma/                # Database schema and migrations
└── mockup/                # Design mockups and prototypes
```

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 7.0.6
- **Router**: Wouter 3.3.5
- **State Management**: Tanstack Query 5.60.5
- **UI Library**: Radix UI + Tailwind CSS
- **Animations**: Framer Motion 11.13.1
- **Forms**: React Hook Form 7.55.0 + Zod validation

### Backend  
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.21.2
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk SDK + AWS Cognito
- **File Storage**: AWS S3
- **AI Services**: AWS Bedrock + Perplexity API
- **Testing**: Jest + Vitest + Playwright

### Infrastructure
- **Deployment**: AWS App Runner + Cloudflare Pages
- **CDK**: AWS CDK 2.132.0
- **Containerization**: Docker
- **Monitoring**: Sentry integration
- **CI/CD**: GitHub Actions ready

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- AWS CLI configured (for AWS features)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd nucleus

# Install dependencies
npm install

# Install infrastructure dependencies
cd infrastructure && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run db:generate
npm run db:push

# Start development
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nucleus"

# Authentication
CLERK_SECRET_KEY="your-clerk-secret"
VITE_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"

# AWS Services
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-s3-bucket"
AWS_COGNITO_USER_POOL_ID="your-cognito-pool-id"

# AI Services
PERPLEXITY_API_KEY="your-perplexity-key"
BEDROCK_MODEL_ID="anthropic.claude-3-haiku"

# Payment
STRIPE_SECRET_KEY="your-stripe-secret"
STRIPE_WEBHOOK_SECRET="your-webhook-secret"
```

## API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout  
- `GET /auth/user` - Get current user

### Core Business Endpoints
- `POST /api/validate-idea` - Validate business idea
- `POST /api/generate-pro-report` - Generate professional report
- `GET /api/matches` - Get founder/funding matches
- `POST /api/upload` - File upload to S3

### Data Endpoints
- `GET /api/leaderboard` - Get user rankings
- `GET /api/portfolio` - Get user's validated ideas
- `GET /api/analytics` - Performance analytics

## Component Structure

### Core Components
- **App.tsx** - Main application router and providers
- **ErrorBoundary.tsx** - Global error handling
- **ThemeProvider** - Dark/light theme management

### UI Components (`client/src/components/ui/`)
- Comprehensive Shadcn/UI component library
- Fully customized with Tailwind CSS
- Accessible and responsive design

### Pro Report Components (`client/src/components/pro-report/`)
- **ExecutiveSummarySection** - Business overview
- **MarketAnalysisSection** - Market research data
- **FinancialProjectionsSection** - Financial modeling
- **FounderMatchingSection** - Co-founder suggestions
- **FundingOpportunitiesSection** - Investment options

### Custom Hooks
- **useAuth** - Authentication state management
- **useToast** - Toast notification system
- **useMobile** - Mobile responsive utilities

## Authentication & Security

### Authentication Providers
The system supports multiple authentication providers through a factory pattern:

1. **Clerk** (Primary) - `server/auth/clerkAuth.ts`
2. **AWS Cognito** - `server/auth/cognitoAuth.ts`  
3. **Local Auth** - `server/auth/localAuth.ts`

### Security Middleware
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers protection
- **Rate Limiting**: API rate limiting and slow-down
- **Input Sanitization**: XSS and injection protection
- **HTTPS**: SSL/TLS encryption enforced

### Security Features
```typescript
// Security middleware stack
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(slowDown);
app.use(express.json({ limit: '10mb' }));
```

## Database Schema

### Core Tables
- **users** - User profiles and preferences
- **ideas** - Business idea submissions
- **validations** - Validation reports and scores
- **matches** - Founder and funding matches
- **reports** - Generated professional reports

### Relationships
- Users have many Ideas
- Ideas have many Validations
- Users have many Matches
- Validations generate Reports

## Deployment

### Cloudflare Pages (Recommended)
```bash
# Build for production
npm run build

# Deploy with Wrangler
wrangler pages publish client/dist
```

### AWS App Runner (Legacy)
```bash
# Deploy infrastructure
cd infrastructure && npm run cdk deploy

# Deploy application
npm run deploy:apprunner
```

### Environment-Specific Configurations
- **Development**: Local PostgreSQL + local auth
- **Staging**: AWS RDS + Cognito
- **Production**: Full AWS stack + monitoring

## Testing

### Testing Strategy
- **Unit Tests**: Vitest for client components
- **Integration Tests**: Jest for server endpoints
- **E2E Tests**: Playwright for user workflows
- **Coverage**: Minimum 80% code coverage

### Test Commands
```bash
# Run all tests
npm test

# Unit tests with watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Coverage reports
npm run test:coverage
```

### Test Structure
- Client tests: `client/src/**/*.test.tsx`
- Server tests: `server/tests/**/*.test.ts`
- E2E tests: `tests/e2e/**/*.spec.ts`

## Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Bundle Analysis**: Vendor chunk separation
- **Image Optimization**: WebP format with lazy loading
- **Caching**: React Query for server state caching

### Backend Optimizations
- **Memory Caching**: In-memory caching for frequent queries
- **Database Indexing**: Optimized query performance
- **API Response Caching**: HTTP caching headers
- **CDN Integration**: Static asset delivery

### Build Optimizations
```typescript
// Vite bundle optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run test suite: `npm test`
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting (when configured)
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Pull Request Guidelines
- Include clear description of changes
- Link related issues
- Ensure all tests pass
- Add screenshots for UI changes
- Update documentation as needed

---

**Last Updated**: August 2025
**Version**: 1.0.0
**Maintainers**: Development Team