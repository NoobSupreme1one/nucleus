import { Router, Response } from "express";
import { insertMessageSchema } from "@shared/validation";
import { generateMatchingInsights } from "../services/bedrock";
import { rateLimiters, conditionalRateLimit } from "../services/rate-limit";
import { getAuthMiddleware } from "../auth/auth-factory";
import { 
  AuthenticatedRequest, 
  asyncHandler, 
  handleRouteError, 
  sendErrorResponse, 
  getStorage
} from "./shared";

export const matchingRouter = Router();

// Get authenticated middleware
const getAuth = () => getAuthMiddleware();

// Get potential matches
matchingRouter.get('/potential', [
  getAuth(),
  conditionalRateLimit(rateLimiters.search)
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const storage = getStorage();
    const potentialMatches = await storage.findPotentialMatches(userId, limit);
    res.json(potentialMatches);
  } catch (error) {
    handleRouteError(error as Error, req, res, "Failed to fetch potential matches");
  }
}));

// Create or update match
matchingRouter.post('/', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { targetUserId, interested } = req.body;
      const storage = getStorage();
      
      if (!targetUserId) {
        return sendErrorResponse(res, 400, {
          code: 'MISSING_TARGET_USER',
          message: "Target user ID is required"
        });
      }
      
      // Check if match already exists
      const existingMatches = await storage.getUserMatches(userId);
      const existingMatch = existingMatches.find((m: any) => 
        (m.user1Id === userId && m.user2Id === targetUserId) ||
        (m.user1Id === targetUserId && m.user2Id === userId)
      );
      
      if (existingMatch) {
        // Update existing match
        const updatedMatch = await storage.updateMatchInterest(existingMatch.id, userId, interested);
        return res.json(updatedMatch);
      }
      
      // Create new match
      const currentUser = await storage.getUser(userId);
      const targetUser = await storage.getUser(targetUserId);
      
      if (!currentUser || !targetUser) {
        return sendErrorResponse(res, 404, {
          code: 'USER_NOT_FOUND',
          message: "User not found"
        });
      }
      
      // Generate compatibility score
      const insights = await generateMatchingInsights(currentUser, targetUser);
      
      const match = await storage.createMatch({
        user1Id: userId,
        user2Id: targetUserId,
        status: 'pending',
        compatibilityScore: insights.compatibilityScore,
        user1Interested: interested,
        user2Interested: false,
      });
      
      res.json(match);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to create match");
    }
  })
);

// Get user matches
matchingRouter.get('/', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const storage = getStorage();
      const matches = await storage.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to fetch matches");
    }
  })
);

// Get mutual matches
matchingRouter.get('/mutual', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const storage = getStorage();
      const mutualMatches = await storage.getMutualMatches(userId);
      res.json(mutualMatches);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to fetch mutual matches");
    }
  })
);

// Send message in match
matchingRouter.post('/:matchId/messages', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      const { content } = req.body;
      const storage = getStorage();
      
      // Verify user is part of this match
      const match = await storage.getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return sendErrorResponse(res, 403, {
          code: 'ACCESS_DENIED',
          message: "Access denied"
        });
      }
      
      const validatedData = insertMessageSchema.parse({
        matchId,
        senderId: userId,
        content
      });
      
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to send message");
    }
  })
);

// Get messages for match
matchingRouter.get('/:matchId/messages', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      const storage = getStorage();
      
      // Verify user is part of this match
      const match = await storage.getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return sendErrorResponse(res, 403, {
          code: 'ACCESS_DENIED',
          message: "Access denied"
        });
      }
      
      const messages = await storage.getMatchMessages(matchId);
      res.json(messages);
    } catch (error) {
      handleRouteError(error as Error, req, res, "Failed to fetch messages");
    }
  })
);