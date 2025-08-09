import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { localStorage } from "./localStorage";
import { setupAuth, getAuthMiddleware } from "./auth/auth-factory";
import { validateStartupIdea, generateMatchingInsights } from "./services/perplexity";
import { performComprehensiveValidation } from "./services/enhanced-validation";
import { ProReportGeneratorService } from "./services/pro-report-generator";
import { PrivacyManagerService } from "./services/privacy-manager";
import { AnalyticsService, createPerformanceMiddleware } from "./services/analytics";
import { StripeService } from "./services/stripe";
import { requireProSubscription, addSubscriptionInfo, rateLimitFreeUsers, requireFeature } from "./middleware/subscription";
import { insertIdeaSchema, insertSubmissionSchema, insertMessageSchema } from "@shared/validation";
import { upload, getFileUrl, CloudStorageService } from './services/s3-storage';
import { ErrorTracker, addUserContextMiddleware, isSentryConfigured } from './services/sentry';
import { rateLimiters, slowDownLimiters, ddosProtection, conditionalRateLimit, createUserBasedRateLimit } from './services/rate-limit';
import path from 'path';
import { AvatarOverride } from './services/avatar';
import fs from 'fs';

// Import route modules
import { ideasRouter } from "./routes/ideas";
import { submissionsRouter } from "./routes/submissions";
import { matchingRouter } from "./routes/matching";
import { subscriptionRouter } from "./routes/subscription";
import { privacyRouter } from "./routes/privacy";
import { systemRouter } from "./routes/system";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup unified authentication system
  await setupAuth(app);

  // Add DDoS protection (very strict)
  app.use(conditionalRateLimit(ddosProtection));
  
  // Add general API rate limiting
  app.use('/api', conditionalRateLimit(rateLimiters.general));

  // Register route modules
  app.use('/api/ideas', ideasRouter);
  app.use('/api/submissions', submissionsRouter);
  app.use('/api/matches', matchingRouter);
  app.use('/api/subscription', subscriptionRouter);
  app.use('/api/users', privacyRouter);
  app.use('/api', systemRouter);

  // Serve uploaded files (for local fallback)
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
