import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { localStorage } from "./localStorage";
import { setupAuth, getAuthMiddleware } from "./auth/auth-factory";
import { validateStartupIdea, generateMatchingInsights } from "./services/gemini";
import { performComprehensiveValidation } from "./services/enhanced-validation";
import { ProReportGeneratorService } from "./services/pro-report-generator";
import { PrivacyManagerService } from "./services/privacy-manager";
import { AnalyticsService, createPerformanceMiddleware } from "./services/analytics";
import { StripeService } from "./services/stripe";
import { requireProSubscription, addSubscriptionInfo, rateLimitFreeUsers, requireFeature } from "./middleware/subscription";
import { insertIdeaSchema, insertSubmissionSchema, insertMessageSchema } from "@shared/validation";
import { upload, getFileUrl, CloudStorageService } from './services/cloud-storage';
import { ErrorTracker, addUserContextMiddleware, isSentryConfigured } from './services/sentry';
import { rateLimiters, slowDownLimiters, ddosProtection, conditionalRateLimit, createUserBasedRateLimit } from './services/rate-limit';
import path from 'path';

// File upload is now handled by cloud-storage service

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup unified authentication system
  const authService = await setupAuth(app);

  // Helper function to get the appropriate authentication middleware
  const getAuthMiddleware = () => authService.createAuthMiddleware();

  // Helper function to get the appropriate storage
  const getStorage = () => process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? storage : localStorage;

  // Initialize analytics service
  const storageInstance = getStorage();
  const prisma = (storageInstance as any).prisma;
  // const analytics = new AnalyticsService(prisma); // Temporarily disabled
  const analytics = {
    trackEvent: () => {},
    trackProReportGeneration: () => {},
    trackError: () => {},
  } as any; // Mock analytics for now

  // Initialize Stripe service
  const stripeService = new StripeService(prisma);

  // Add performance monitoring middleware
  // app.use(createPerformanceMiddleware(analytics)); // Temporarily disabled

  // Add DDoS protection (very strict)
  app.use(conditionalRateLimit(ddosProtection));
  
  // Add general API rate limiting
  app.use('/api', conditionalRateLimit(rateLimiters.general));

  // Add Sentry user context middleware for authenticated routes
  if (isSentryConfigured()) {
    app.use(addUserContextMiddleware());
  }

  // Stripe webhook endpoint (must be before JSON parsing middleware)
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const event = stripeService.verifyWebhookSignature(req.body, signature);

      console.log('Received Stripe webhook:', event.type);

      // Handle subscription events
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as any;
          await stripeService.updateSubscriptionFromWebhook(subscription, event.type);

          // Log subscription event for audit trail
          if (subscription.customer) {
            const user = await prisma.user.findFirst({
              where: { stripeCustomerId: subscription.customer },
            });

            if (user) {
              await prisma.subscriptionEvent.create({
                data: {
                  userId: user.id,
                  stripeEventId: event.id,
                  eventType: event.type,
                  subscriptionId: subscription.id,
                  eventData: event.data.object,
                },
              });
            }
          }
          break;

        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          console.log(`Payment ${event.type} for invoice:`, event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      
      // Track payment errors with Sentry
      ErrorTracker.trackPaymentError(error as Error, {
        stripeEventType: req.body?.type,
      });
      
      res.status(400).json({ error: 'Webhook error' });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await getStorage().getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Idea validation routes
  app.post('/api/ideas/validate',
    getAuthMiddleware(),
    conditionalRateLimit(rateLimiters.aiFeatures),
    conditionalRateLimit(slowDownLimiters.ai),
    rateLimitFreeUsers(prisma, 5, 60 * 60 * 1000), // 5 validations per hour for free users
    async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertIdeaSchema.parse({ ...req.body, userId });
      
      // Create the idea first
      const idea = await getStorage().createIdea(validatedData);
      
      // Perform comprehensive validation with enhanced analysis
      const validation = await performComprehensiveValidation(
        validatedData.title,
        validatedData.marketCategory,
        validatedData.problemDescription,
        validatedData.solutionDescription,
        validatedData.targetAudience
      );
      
      // Update idea with validation results
      await getStorage().updateIdeaValidation(idea.id, validation.overallScore, validation);
      
      // Update user's total idea score (use highest score)
      const userIdeas = await getStorage().getUserIdeas(userId);
      const highestScore = Math.max(...userIdeas.map(i => i.validationScore || 0), validation.overallScore);
      await getStorage().updateUserIdeaScore(userId, highestScore);
      
      res.json({ ideaId: idea.id, validation });
    } catch (error) {
      console.error("Error validating idea:", error);
      res.status(500).json({ message: "Failed to validate idea" });
    }
  });

  app.get('/api/ideas/:id', getAuthMiddleware(), async (req: any, res) => {
    try {
      const idea = await getStorage().getIdea(req.params.id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Check if user owns this idea
      const userId = req.user.id;
      if (idea.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(idea);
    } catch (error) {
      console.error("Error fetching idea:", error);
      res.status(500).json({ message: "Failed to fetch idea" });
    }
  });

  // Pro Report Generation
  app.post('/api/ideas/:id/generate-pro-report',
    getAuthMiddleware(),
    conditionalRateLimit(rateLimiters.proReports),
    conditionalRateLimit(slowDownLimiters.ai),
    requireProSubscription(prisma),
    async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ideaId = req.params.id;

      // Get the idea
      const idea = await getStorage().getIdea(ideaId);
      if (!idea) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'IDEA_NOT_FOUND',
            message: 'Idea not found'
          }
        });
      }

      if (idea.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only generate reports for your own ideas'
          }
        });
      }

      // Initialize Pro Report Generator
      const storage = getStorage();
      const prisma = (storage as any).prisma; // Access prisma from storage
      const proReportGenerator = new ProReportGeneratorService(prisma);

      // Track pro report generation start
      const startTime = Date.now();
      analytics.trackEvent(userId, 'pro_report_generation_started', {
        ideaId,
        ideaTitle: idea.title,
        marketCategory: idea.marketCategory,
      });

      // Generate comprehensive Pro report
      const proReport = await proReportGenerator.generateProReport(
        userId,
        idea.title,
        idea.marketCategory,
        idea.problemDescription,
        idea.solutionDescription,
        idea.targetAudience
      );

      // Track successful generation
      const duration = Date.now() - startTime;
      analytics.trackProReportGeneration(userId, ideaId, true, duration);

      // Update idea with Pro report
      const currentAnalysis = idea.analysisReport as any || {};
      const updatedAnalysis = {
        ...currentAnalysis,
        proReport,
        lastUpdated: new Date().toISOString()
      };

      await storage.updateIdeaValidation(ideaId, idea.validationScore || 0, updatedAnalysis);

      res.json({
        success: true,
        proReport,
        message: 'Pro business report generated successfully'
      });
    } catch (error) {
      console.error("Error generating Pro report:", error);

      // Determine error type and provide appropriate response
      let errorCode = 'GENERATION_FAILED';
      let errorMessage = 'Failed to generate Pro report';

      if (error instanceof Error) {
        if (error.message.includes('API')) {
          errorCode = 'API_ERROR';
          errorMessage = 'External service temporarily unavailable';
        } else if (error.message.includes('database') || error.message.includes('prisma')) {
          errorCode = 'DATABASE_ERROR';
          errorMessage = 'Database error occurred';
        }
      }

      // Track failed generation
      const duration = Date.now() - (req as any).startTime || 0;
      analytics.trackProReportGeneration(userId, ideaId, false, duration);
      analytics.trackError(
        req.path,
        req.method,
        errorCode,
        errorMessage,
        userId
      );

      res.status(500).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  });

  // Privacy Settings API Endpoints
  app.get('/api/users/privacy-settings', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const storage = getStorage();
      const prisma = (storage as any).prisma;
      const privacyManager = new PrivacyManagerService(prisma);

      const privacySettings = await privacyManager.getUserPrivacySettings(userId);

      if (!privacySettings) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Track privacy settings access
      analytics.trackEvent(userId, 'privacy_settings_viewed', {});

      res.json({
        success: true,
        privacySettings
      });
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch privacy settings'
        }
      });
    }
  });

  app.put('/api/users/privacy-settings', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const storage = getStorage();
      const prisma = (storage as any).prisma;
      const privacyManager = new PrivacyManagerService(prisma);

      // Validate input data
      if (!privacyManager.validatePrivacySettings(req.body)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid privacy settings data. All values must be boolean.'
          }
        });
      }

      const updatedSettings = await privacyManager.updatePrivacySettings(userId, req.body);

      // Track privacy settings update
      analytics.trackEvent(userId, 'privacy_settings_updated', {
        settings: req.body,
      });

      res.json({
        success: true,
        privacySettings: updatedSettings,
        message: 'Privacy settings updated successfully'
      });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update privacy settings'
        }
      });
    }
  });

  app.get('/api/ideas', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ideas = await getStorage().getUserIdeas(userId);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching user ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  // Submission routes
  app.post('/api/submissions', [
    getAuthMiddleware(), 
    conditionalRateLimit(rateLimiters.fileUpload),
    upload.array('files', 5)
  ], async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Handle file URLs from cloud storage or local storage
      const fileUrls = req.files ? req.files.map((file: any) => getFileUrl(file)) : [];
      
      const validatedData = insertSubmissionSchema.parse({
        ...req.body,
        userId,
        fileUrls
      });
      
      const submission = await getStorage().createSubmission(validatedData);
      
      // Log storage type for monitoring
      console.log(`Submission created with ${CloudStorageService.isConfigured() ? 'cloud' : 'local'} storage`);
      
      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get('/api/submissions', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const submissions = await getStorage().getUserSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.put('/api/submissions/:id', [getAuthMiddleware(), upload.array('files', 5)], async (req: any, res) => {
    try {
      const submission = await getStorage().getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const userId = req.user.id;
      if (submission.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Handle new file uploads or keep existing files
      const fileUrls = req.files && req.files.length > 0 
        ? req.files.map((file: any) => getFileUrl(file))
        : submission.fileUrls;
      
      const updatedSubmission = await getStorage().updateSubmission(req.params.id, {
        ...req.body,
        fileUrls
      });
      
      console.log(`Submission updated with ${CloudStorageService.isConfigured() ? 'cloud' : 'local'} storage`);
      
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  // Matching routes
  app.get('/api/matches/potential', [
    getAuthMiddleware(),
    conditionalRateLimit(rateLimiters.search)
  ], async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const potentialMatches = await getStorage().findPotentialMatches(userId, limit);
      res.json(potentialMatches);
    } catch (error) {
      console.error("Error fetching potential matches:", error);
      res.status(500).json({ message: "Failed to fetch potential matches" });
    }
  });

  app.post('/api/matches', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { targetUserId, interested } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
      }
      
      // Check if match already exists
      const existingMatches = await getStorage().getUserMatches(userId);
      const existingMatch = existingMatches.find(m => 
        (m.user1Id === userId && m.user2Id === targetUserId) ||
        (m.user1Id === targetUserId && m.user2Id === userId)
      );
      
      if (existingMatch) {
        // Update existing match
        const updatedMatch = await getStorage().updateMatchInterest(existingMatch.id, userId, interested);
        return res.json(updatedMatch);
      }
      
      // Create new match
      const currentUser = await getStorage().getUser(userId);
      const targetUser = await getStorage().getUser(targetUserId);
      
      if (!currentUser || !targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate compatibility score
      const insights = await generateMatchingInsights(currentUser, targetUser);
      
      const match = await getStorage().createMatch({
        user1Id: userId,
        user2Id: targetUserId,
        compatibilityScore: insights.compatibilityScore,
        user1Interested: interested,
        user2Interested: false,
      });
      
      res.json(match);
    } catch (error) {
      console.error("Error creating match:", error);
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  app.get('/api/matches', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const matches = await getStorage().getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get('/api/matches/mutual', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const mutualMatches = await getStorage().getMutualMatches(userId);
      res.json(mutualMatches);
    } catch (error) {
      console.error("Error fetching mutual matches:", error);
      res.status(500).json({ message: "Failed to fetch mutual matches" });
    }
  });

  // Message routes
  app.post('/api/matches/:matchId/messages', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      const { content } = req.body;
      
      // Verify user is part of this match
      const match = await getStorage().getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertMessageSchema.parse({
        matchId,
        senderId: userId,
        content
      });
      
      const message = await getStorage().createMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/matches/:matchId/messages', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      
      // Verify user is part of this match
      const match = await getStorage().getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await getStorage().getMatchMessages(matchId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Subscription management routes
  app.post('/api/subscription/create-checkout-session', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const session = await stripeService.createCheckoutSession(
        userId,
        priceId,
        `${req.headers.origin}/dashboard?subscription=success`,
        `${req.headers.origin}/pricing?subscription=cancelled`
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post('/api/subscription/create-portal-session', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const session = await stripeService.createCustomerPortalSession(
        userId,
        `${req.headers.origin}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  app.get('/api/subscription/status', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await stripeService.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error('Error getting subscription status:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        cloudStorage: CloudStorageService.isConfigured() ? 'configured' : 'local_fallback',
        auth: isProduction ? 'supabase' : 'local',
      }
    };
    
    res.json(health);
  });

  // Serve uploaded files (for local fallback)
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
