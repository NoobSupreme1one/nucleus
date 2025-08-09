# Documentation Index

Welcome to the Nucleus project documentation. This index provides a comprehensive guide to all available documentation and resources.

## 📋 Quick Navigation

### Core Documentation
- [**Project Documentation**](PROJECT_DOCUMENTATION.md) - Comprehensive project overview and architecture
- [**API Reference**](API_REFERENCE.md) - Complete API documentation with endpoints and examples  
- [**Component Index**](COMPONENT_INDEX.md) - React component catalog and usage guide
- [**Deployment Guide**](DEPLOYMENT_GUIDE.md) - AWS App Runner and Cloudflare Pages deployment instructions

### Development Resources
- [**Repository Guidelines**](AGENTS.md) - Development standards and project structure
- [**Claude Instructions**](CLAUDE.md) - AI assistant workflow and coding guidelines

### Quick References
- [**Environment Setup**](#environment-setup)
- [**Command Reference**](#command-reference)
- [**Architecture Overview**](#architecture-overview)
- [**Technology Stack**](#technology-stack)

## 🚀 Getting Started

### New to the Project?
1. Start with [Project Documentation](PROJECT_DOCUMENTATION.md) for the complete overview
2. Review [Repository Guidelines](AGENTS.md) for development standards
3. Follow [Environment Setup](#environment-setup) instructions
4. Explore [Component Index](COMPONENT_INDEX.md) for UI components

### Need API Information?
1. Check [API Reference](API_REFERENCE.md) for endpoint documentation
2. Review authentication requirements
3. Test with provided SDK examples

### Ready to Deploy?
1. Review [Deployment Guide](DEPLOYMENT_GUIDE.md)
2. Choose between AWS App Runner or Cloudflare Pages
3. Configure environment variables
4. Follow deployment checklist

## 🏗️ Architecture Overview

```mermaid
graph TB
    A[Client - React/Vite] --> B[Server - Express.js]
    B --> C[Database - PostgreSQL]
    B --> D[Auth - Clerk/Cognito]
    B --> E[AI - Bedrock/Perplexity]
    B --> F[Storage - AWS S3]
    A --> G[CDN - Cloudflare]
    B --> H[Monitoring - Sentry]
```

### Core Components
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (primary) + AWS Cognito (legacy)
- **AI Services**: AWS Bedrock + Perplexity API
- **Storage**: AWS S3 + CloudFront
- **Deployment**: AWS App Runner + Cloudflare Pages

## 💻 Technology Stack

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.6.3 | Type Safety |
| Vite | 7.0.6 | Build Tool |
| Tailwind CSS | 3.4.17 | Styling |
| Radix UI | Latest | Component Library |
| React Query | 5.60.5 | Server State |
| Wouter | 3.3.5 | Routing |
| Framer Motion | 11.13.1 | Animations |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.21.2 | Web Framework |
| TypeScript | 5.6.3 | Type Safety |
| Prisma | 6.13.0 | Database ORM |
| PostgreSQL | 14+ | Database |
| Clerk SDK | 5.1.6 | Authentication |
| AWS SDK | 3.713.0 | Cloud Services |

## ⚙️ Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- AWS CLI (for AWS features)
- Git

### Installation Steps
```bash
# 1. Clone repository
git clone <repository-url>
cd nucleus

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Database setup
npm run db:generate
npm run db:push

# 5. Start development
npm run dev
```

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nucleus"

# Authentication
CLERK_SECRET_KEY="your-clerk-secret"
VITE_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"

# AWS Services (optional)
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-s3-bucket"

# AI Services
PERPLEXITY_API_KEY="your-perplexity-key"
```

## 🎯 Command Reference

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run check       # TypeScript type checking
```

### Database Commands
```bash
npm run db:generate  # Generate Prisma client
npm run db:push     # Push schema changes
npm run db:migrate  # Run migrations
npm run db:studio   # Open Prisma Studio
```

### Testing Commands
```bash
npm test            # Run all tests
npm run test:unit   # Run unit tests only
npm run test:e2e    # Run E2E tests
npm run test:watch  # Watch mode
npm run test:coverage # Generate coverage
```

### Deployment Commands
```bash
npm run build:lambda     # Build for AWS Lambda
npm run deploy:apprunner # Deploy to AWS App Runner
npm run cdk             # CDK infrastructure commands
```

## 📊 Project Statistics

### Codebase Metrics
- **Total Files**: 200+ TypeScript/TSX files
- **Components**: 50+ React components
- **API Endpoints**: 25+ REST endpoints
- **Test Coverage**: 80%+ target
- **Dependencies**: 100+ npm packages

### Component Breakdown
- **Pages**: 12 route components
- **UI Components**: 35+ Radix UI components
- **Business Components**: 15+ domain-specific components
- **Hooks**: 5+ custom React hooks
- **Services**: 15+ backend services

## 🔧 Development Workflow

### Branch Strategy
```
main              # Production-ready code
develop          # Integration branch
feature/*        # Feature development
hotfix/*         # Production fixes
release/*        # Release preparation
```

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes with tests
3. Run `npm run check` and `npm test`
4. Create PR with description and screenshots
5. Code review and approval
6. Merge to `develop`

## 📚 Learning Resources

### React/TypeScript
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)

### UI/Styling
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Shadcn/UI](https://ui.shadcn.com)

### Backend/Database
- [Express.js](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

### Deployment/Cloud
- [AWS App Runner](https://docs.aws.amazon.com/apprunner)
- [Cloudflare Pages](https://developers.cloudflare.com/pages)
- [AWS CDK](https://docs.aws.amazon.com/cdk)

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite
npm run build
```

#### Database Issues
```bash
# Reset database
npm run db:push --force-reset
npm run db:generate
```

#### Type Errors
```bash
# Run type checker
npm run check

# Restart TypeScript server in VS Code
Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### Getting Help
1. Check existing documentation
2. Search GitHub issues
3. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Expected vs actual behavior

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run check`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security review completed

### AWS App Runner Deployment
- [ ] CDK infrastructure deployed
- [ ] Secrets configured in AWS Secrets Manager
- [ ] Domain configured in Route53
- [ ] SSL certificate issued
- [ ] Health checks configured

### Cloudflare Pages Deployment
- [ ] Build configuration set
- [ ] Environment variables configured
- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] CDN cache configured

### Post-Deployment
- [ ] Application health verified
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Backup systems operational
- [ ] Team notifications set up

## 📈 Performance Monitoring

### Key Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Error Rate**: < 1%
- **Uptime**: > 99.9%

### Monitoring Tools
- **Sentry**: Error tracking and performance monitoring
- **CloudWatch**: AWS infrastructure monitoring
- **Cloudflare Analytics**: CDN and traffic analytics

## 🔐 Security Guidelines

### Authentication
- Use Clerk for user authentication
- Implement proper session management
- Validate all user inputs
- Use HTTPS everywhere

### Data Protection
- Encrypt sensitive data
- Use secure headers (Helmet.js)
- Implement rate limiting
- Regular security audits

### API Security
- Validate all requests
- Use proper error handling
- Implement CORS correctly
- Monitor for suspicious activity

---

## 📞 Support & Contact

### Documentation Issues
- File issue: [GitHub Issues](https://github.com/your-repo/nucleus/issues)
- Documentation requests: Use "documentation" label

### Development Support
- Technical questions: Create GitHub discussion
- Bug reports: File GitHub issue
- Feature requests: Create GitHub issue with "enhancement" label

### Emergency Contacts
- Production issues: Check runbooks in DEPLOYMENT_GUIDE.md
- Security issues: Follow security reporting guidelines

---

**Last Updated**: August 2025  
**Documentation Version**: 1.0.0  
**Next Review**: September 2025