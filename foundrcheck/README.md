# FoundrCheck MVP 🚀

A startup idea validation platform powered by AI. Get market analysis, competition insights, and validation scores for your startup ideas in minutes.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: PocketBase (auth + database)
- **AI**: Perplexity API for market research
- **Testing**: Vitest (unit), Playwright (e2e)
- **Deployment**: Docker + Oracle Cloud Free Tier

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Server-side API routes
│   └── (pages)/           # UI pages
├── components/            # Reusable UI components  
├── lib/                   # Core business logic
│   ├── auth-validation.ts # Authentication & security
│   ├── pocketbase.ts      # Database layer
│   ├── perplexity.ts      # AI integration
│   ├── scoring.ts         # Validation algorithm
│   ├── config.ts          # Environment configuration
│   └── logger.ts          # Structured logging
tests/
├── unit/                  # Vitest unit tests
└── e2e/                   # Playwright e2e tests
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PocketBase binary
- Perplexity API key

### Installation

```bash
# Clone and install dependencies
git clone <repository>
cd foundrcheck
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
PERPLEXITY_API_KEY=your_api_key_here

# Optional (with defaults)
PERPLEXITY_MODEL=sonar-pro
APP_TIMEZONE=America/Los_Angeles
RATE_LIMIT_DAILY=3
```

### Development

```bash
# Start PocketBase (in separate terminal)
./pocketbase serve

# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Testing

```bash
# Unit tests
npm test
npm run test:ui
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui
```

## 🎯 Core Features

### Completed ✅

- **Project Setup**: Next.js 15 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Authentication**: PocketBase integration with security validation
- **API Routes**: Ideas, leaderboard, best-of-day endpoints
- **AI Integration**: Perplexity API with error handling and retries
- **Scoring Algorithm**: Deterministic validation scoring (0-100)
- **Background Jobs**: Async idea processing
- **Security**: Input sanitization, token validation, structured logging
- **Configuration**: Environment management and validation
- **Testing Setup**: Vitest + Playwright configurations

### In Progress 🚧

- Authentication UI pages (signin/signup)
- Submit idea form page
- Leaderboard and profile pages
- Idea details page

### Planned 📋

- Docker configuration
- GitHub Actions CI/CD
- Production deployment scripts
- PocketBase schema setup

## 🔒 Security Features

- **JWT Token Validation**: Proper authentication with PocketBase
- **Input Sanitization**: XSS prevention and length validation
- **Rate Limiting**: 3 ideas per user per day
- **Structured Logging**: Security event tracking
- **Environment Validation**: Required config verification

## 🧪 Testing Strategy

- **Unit Tests**: Business logic (scoring, sanitization, utilities)
- **Integration Tests**: API routes and database operations
- **E2E Tests**: Complete user workflows and UI interactions
- **Security Tests**: Authentication and authorization flows

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/ideas` | POST | Submit new idea (auth required) |
| `/api/ideas/:id` | GET | Get idea details (public/owner view) |
| `/api/leaderboard` | GET | Top 100 ideas by score |
| `/api/best-of-day` | GET | Highest scoring idea today |
| `/api/me/ideas` | GET | User's submitted ideas (auth required) |
| `/api/health` | GET | Service health check |

## 🏆 Scoring Algorithm

Ideas are scored 0-100 based on:

- **Market Size** (30%): Target market potential
- **Novelty** (20%): Innovation and uniqueness
- **Monetization Clarity** (20%): Revenue model clarity
- **Competition Intensity** (15%): Competitive landscape (inverted)
- **Execution Complexity** (15%): Implementation difficulty (inverted)

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Planned)
```bash
docker-compose up -d
```

## 📝 Scripts

- `dev`: Start development server
- `build`: Build for production
- `start`: Start production server
- `lint`: Run ESLint
- `type-check`: TypeScript type checking
- `test`: Run unit tests
- `test:e2e`: Run E2E tests
- `clean`: Remove build artifacts

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all security checks pass

## 📄 License

MIT License - see LICENSE file for details
