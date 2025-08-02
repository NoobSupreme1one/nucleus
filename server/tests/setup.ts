import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nucleus_test';
process.env.AUTH_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.GEMINI_API_KEY = 'test-key';

// Global test database instance
let prisma: PrismaClient;

beforeAll(async () => {
  // Initialize test database
  prisma = new PrismaClient();
  
  // Run migrations
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  } catch (error) {
    // Extension might already exist
  }
});

afterAll(async () => {
  // Cleanup
  if (prisma) {
    await prisma.$disconnect();
  }
});

beforeEach(async () => {
  // Clean database before each test
  if (prisma) {
    // Delete in reverse order of dependencies
    await prisma.subscriptionEvent.deleteMany();
    await prisma.message.deleteMany();
    await prisma.match.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.idea.deleteMany();
    await prisma.user.deleteMany();
  }
});

afterEach(async () => {
  // Additional cleanup if needed
});

// Export for use in tests
export { prisma };

// Mock external services
jest.mock('../services/gemini', () => ({
  validateStartupIdea: jest.fn().mockResolvedValue({
    validationScore: 85,
    analysisReport: {
      marketSize: 'Large',
      competitionLevel: 'Medium',
      feasibilityScore: 8,
      marketDemand: 'High',
      recommendations: ['Test recommendation'],
    },
  }),
  generateMatchingInsights: jest.fn().mockResolvedValue({
    insights: ['Test insight'],
    score: 85,
  }),
}));

jest.mock('../services/stripe', () => ({
  StripeService: jest.fn().mockImplementation(() => ({
    createCheckoutSession: jest.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    }),
    createCustomerPortalSession: jest.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/test',
    }),
    verifyWebhookSignature: jest.fn().mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_test_123' } },
    }),
    hasActiveSubscription: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../services/cloud-storage', () => ({
  CloudStorageService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn().mockResolvedValue({
      url: 'https://test.cloudinary.com/test.jpg',
      publicId: 'test-public-id',
    }),
    deleteFile: jest.fn().mockResolvedValue(true),
  })),
  upload: {
    array: jest.fn().mockImplementation(() => (req: any, res: any, next: any) => {
      req.files = [
        {
          filename: 'test.jpg',
          path: 'https://test.cloudinary.com/test.jpg',
          mimetype: 'image/jpeg',
        },
      ];
      next();
    }),
  },
}));

// Mock Sentry
jest.mock('../services/sentry', () => ({
  ErrorTracker: {
    trackError: jest.fn(),
    trackBusinessError: jest.fn(),
  },
  initializeSentry: jest.fn().mockReturnValue(false),
  sentryRequestHandler: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
  sentryErrorHandler: jest.fn().mockReturnValue((err: any, req: any, res: any, next: any) => next(err)),
  addUserContextMiddleware: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
  isSentryConfigured: jest.fn().mockReturnValue(false),
}));

// Console override for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
