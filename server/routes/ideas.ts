import { Router, Response } from "express";
import { insertIdeaSchema } from "@shared/validation";
import { validateStartupIdea } from "../services/bedrock";
import { performComprehensiveValidation } from "../services/enhanced-validation";
import { ProReportGeneratorService } from "../services/pro-report-generator";
import { requireProSubscription, rateLimitFreeUsers } from "../middleware/subscription";
import { rateLimiters, slowDownLimiters, conditionalRateLimit } from "../services/rate-limit";
import { getAuthMiddleware } from "../auth/auth-factory";
import { 
  AuthenticatedRequest, 
  asyncHandler, 
  handleRouteError, 
  sendErrorResponse, 
  sendSuccessResponse,
  getStorage,
  getAnalytics
} from "./shared";

export const ideasRouter = Router();

// Get authenticated middleware
const getAuth = () => getAuthMiddleware();

// Idea validation endpoint
ideasRouter.post('/validate',
  getAuth(),
  conditionalRateLimit(rateLimiters.aiFeatures),
  conditionalRateLimit(slowDownLimiters.ai),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storage = await getStorage();
    const prisma = (storage as any).prisma;
    
    await rateLimitFreeUsers(prisma, 5, 60 * 60 * 1000)(req, res, async () => {
      try {
        const userId = req.user.id;
        const validatedData = insertIdeaSchema.parse({ ...req.body, userId });
        
        // Create the idea first
        const idea = await storage.createIdea(validatedData);
        
        // Perform comprehensive validation with enhanced analysis
        const validation = await performComprehensiveValidation(
          validatedData.title,
          validatedData.marketCategory,
          validatedData.problemDescription,
          validatedData.solutionDescription,
          validatedData.targetAudience
        );
        
        // Update idea with validation results
        await storage.updateIdeaValidation(idea.id, validation.overallScore, validation);
        
        // Update user's total idea score (use highest score)
        const userIdeas = await storage.getUserIdeas(userId);
        const highestScore = Math.max(...userIdeas.map((i: any) => i.validationScore || 0), validation.overallScore);
        await storage.updateUserIdeaScore(userId, highestScore);
        
        sendSuccessResponse(res, { ideaId: idea.id, validation });
      } catch (error) {
        handleRouteError(error as Error, req, res, "Failed to validate idea");
      }
    });
  })
);

// Get single idea
ideasRouter.get('/:id', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const storage = await getStorage();
      const idea = await storage.getIdea(req.params.id);
      
      if (!idea) {
        return sendErrorResponse(res, 404, {
          code: 'IDEA_NOT_FOUND',
          message: "Idea not found"
        });
      }
      
      // Check if user owns this idea
      const userId = req.user.id;
      if (idea.userId !== userId) {
        return sendErrorResponse(res, 403, {
          code: 'ACCESS_DENIED',
          message: "Access denied"
        });
      }
      
      res.json(idea);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to fetch idea");
    }
  })
);

// Get user's ideas
ideasRouter.get('/', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const storage = await getStorage();
      const ideas = await storage.getUserIdeas(userId);
      res.json(ideas);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to fetch ideas");
    }
  })
);

// Pro Report Generation
ideasRouter.post('/:id/generate-pro-report',
  getAuth(),
  conditionalRateLimit(rateLimiters.proReports),
  conditionalRateLimit(slowDownLimiters.ai),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storage = await getStorage();
    const prisma = (storage as any).prisma;
    const analytics = getAnalytics();
    
    await requireProSubscription(prisma)(req, res, async () => {
      try {
        const userId = req.user.id;
        const ideaId = req.params.id;

        // Get the idea
        const idea = await storage.getIdea(ideaId);
        if (!idea) {
          return sendErrorResponse(res, 404, {
            code: 'IDEA_NOT_FOUND',
            message: 'Idea not found'
          });
        }

        if (idea.userId !== userId) {
          return sendErrorResponse(res, 403, {
            code: 'ACCESS_DENIED',
            message: 'You can only generate reports for your own ideas'
          });
        }

        // Initialize Pro Report Generator
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

        sendSuccessResponse(res, { proReport }, 'Pro business report generated successfully');
      } catch (error) {
        // Track failed generation
        const duration = Date.now() - ((req as any).startTime || 0);
        const userId = req.user?.id;
        const ideaId = req.params.id;
        
        if (userId) {
          analytics.trackProReportGeneration(userId, ideaId, false, duration);
          analytics.trackError(
            req.path,
            req.method,
            'GENERATION_FAILED',
            'Failed to generate Pro report',
            userId
          );
        }

        handleRouteError(error as Error, req, res, "Failed to generate Pro report");
      }
    });
  })
);