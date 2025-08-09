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

// File upload is now handled by S3 storage service

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup unified authentication system
  await setupAuth(app);

  // Helper function to get the appropriate authentication middleware  
  const { getAuthMiddleware: getAuth } = await import('./auth/auth-factory.js');
  const getAuthMiddleware = () => getAuth();

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

  // Profile image upload (stores URL and applies override without requiring DB)
  app.post('/api/users/profile-image', [
    getAuthMiddleware(),
    conditionalRateLimit(rateLimiters.fileUpload),
    upload.single('avatar')
  ], async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const userId = req.user.id;
      const url = getFileUrl(req.file);
      // Remember override so /api/auth/user reflects the new avatar immediately
      AvatarOverride.set(userId, url);
      res.json({ profileImageUrl: url });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: 'Failed to upload profile image' });
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

  // Dev-only: seed mock users from images in /mockup
  app.post('/api/dev/seed-mock-users', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: 'Not available in production' });
      }

      const root = path.resolve(import.meta.dirname, '..');
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const profiles = [
        { firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen+mock@local.dev', file: 'mockup/Sarah_Chen.png', location: 'San Francisco, CA' },
        { firstName: 'Marcus', lastName: 'Rodriguez', email: 'marcus.rodriguez+mock@local.dev', file: 'mockup/Marcus_Rodriguez.png', location: 'Austin, TX' },
        { firstName: 'Aisha', lastName: 'Patel', email: 'aisha.patel+mock@local.dev', file: 'mockup/Aisha_Patel.png', location: 'Toronto, ON' },
        { firstName: 'David', lastName: 'Kim', email: 'david.kim+mock@local.dev', file: 'mockup/david_kim.png', location: 'Seattle, WA' },
        { firstName: 'Emma', lastName: 'Thompson', email: 'emma.thompson+mock@local.dev', file: 'mockup/Emma_Thompson.png', location: 'London, UK' },
        { firstName: 'James', lastName: 'Wilson', email: 'james.wilson+mock@local.dev', file: 'mockup/james_wilson.png', location: 'Boston, MA' },
      ];

      const storageInstance = getStorage();

      const results: any[] = [];
      for (const p of profiles) {
        const src = path.resolve(root, '..', p.file);
        if (!fs.existsSync(src)) {
          results.push({ email: p.email, status: 'skipped', reason: `missing file ${p.file}` });
          continue;
        }

        const ext = path.extname(src).toLowerCase();
        const base = `${p.firstName.toLowerCase()}_${p.lastName.toLowerCase()}_${Date.now()}${ext}`;
        const dest = path.resolve(uploadsDir, base);
        fs.copyFileSync(src, dest);
        const url = `/uploads/${base}`;

        // Upsert user
        const user = await (storageInstance as any).upsertUser({
          email: p.email,
          firstName: p.firstName,
          lastName: p.lastName,
          profileImageUrl: url,
          role: null,
          location: p.location,
          bio: '',
          subscriptionTier: 'free',
          totalIdeaScore: 0,
          profileViews: 0,
          profilePublic: true,
          ideasPublic: true,
          allowFounderMatching: true,
          allowDirectContact: true,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
          subscriptionPeriodEnd: null,
          subscriptionCancelAtPeriodEnd: false,
        });

        // Ensure immediate override is visible even with Clerk auth
        AvatarOverride.set(user.id, url);
        results.push({ email: p.email, id: user.id, profileImageUrl: url, status: 'created' });
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error('Seed users error:', error);
      res.status(500).json({ message: 'Failed to seed mock users' });
    }
  });

  // Dev-only: create real Clerk users and upload their profile pictures
  app.post('/api/dev/seed-clerk-users', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: 'Not available in production' });
      }
      if (!process.env.CLERK_SECRET_KEY) {
        return res.status(400).json({ message: 'CLERK_SECRET_KEY is not configured' });
      }

      const { createClerkClient } = await import('@clerk/express');
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

      const root = path.resolve(import.meta.dirname, '..');
      const profiles = [
        { firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen+mock@local.dev', file: 'mockup/Sarah_Chen.png', location: 'San Francisco, CA' },
        { firstName: 'Marcus', lastName: 'Rodriguez', email: 'marcus.rodriguez+mock@local.dev', file: 'mockup/Marcus_Rodriguez.png', location: 'Austin, TX' },
        { firstName: 'Aisha', lastName: 'Patel', email: 'aisha.patel+mock@local.dev', file: 'mockup/Aisha_Patel.png', location: 'Toronto, ON' },
        { firstName: 'David', lastName: 'Kim', email: 'david.kim+mock@local.dev', file: 'mockup/david_kim.png', location: 'Seattle, WA' },
        { firstName: 'Emma', lastName: 'Thompson', email: 'emma.thompson+mock@local.dev', file: 'mockup/Emma_Thompson.png', location: 'London, UK' },
        { firstName: 'James', lastName: 'Wilson', email: 'james.wilson+mock@local.dev', file: 'mockup/james_wilson.png', location: 'Boston, MA' },
      ];

      const seeded: any[] = [];
      for (const p of profiles) {
        // ensure image exists
        const src = path.resolve(root, '..', p.file);
        if (!fs.existsSync(src)) {
          seeded.push({ email: p.email, status: 'skipped', reason: `missing file ${p.file}` });
          continue;
        }

        // find existing Clerk user by email
        const existing = await clerk.users.getUserList({ emailAddress: [p.email] });
        const user = existing?.data?.[0] || await clerk.users.createUser({
          emailAddress: [p.email],
          firstName: p.firstName,
          lastName: p.lastName,
          password: Math.random().toString(36).slice(2) + '!Aa9',
          publicMetadata: { seeded: true, source: 'dev-seed' },
        });

        // upload profile image to Clerk
        const buffer = fs.readFileSync(src);
        const ext = path.extname(src).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
        const blob = new Blob([buffer], { type: mime });
        const fd = new FormData();
        fd.append('file', blob, path.basename(src));

        const resp = await fetch(`https://api.clerk.com/v1/users/${user.id}/profile_image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` },
          body: fd as any,
        });
        if (!resp.ok) {
          const txt = await resp.text();
          seeded.push({ email: p.email, id: user.id, status: 'image_failed', error: txt });
          continue;
        }

        // Optionally persist in our storage for local features
        try {
          const details = await clerk.users.getUser(user.id);
          await storageInstance.upsertUser({
            email: p.email,
            firstName: p.firstName,
            lastName: p.lastName,
            profileImageUrl: details.imageUrl || null,
            role: null,
            location: p.location,
            bio: '',
            subscriptionTier: 'free',
            totalIdeaScore: 0,
            profileViews: 0,
            profilePublic: true,
            ideasPublic: true,
            allowFounderMatching: true,
            allowDirectContact: true,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionStatus: null,
            subscriptionPeriodEnd: null,
            subscriptionCancelAtPeriodEnd: false,
          });
          AvatarOverride.set(user.id, details.imageUrl || '');
        } catch {}

        seeded.push({ email: p.email, id: user.id, status: 'created' });
      }

      res.json({ success: true, seeded });
    } catch (error) {
      console.error('Seed Clerk users error:', error);
      res.status(500).json({ message: 'Failed to seed Clerk users' });
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
