import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth/auth-factory";
import { addUserContextMiddleware, isSentryConfigured } from './services/sentry';
import { rateLimiters, slowDownLimiters, ddosProtection, conditionalRateLimit } from './services/rate-limit';

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

  // Add Sentry user context middleware for authenticated routes
  if (isSentryConfigured()) {
    app.use(addUserContextMiddleware());
  }

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
