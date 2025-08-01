import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { localStorage } from "./localStorage";
import { setupAuth as setupSupabaseAuth, isAuthenticated as isSupabaseAuthenticated } from "./supabaseAuth";
import { setupAuth as setupLocalAuth, isAuthenticated as isLocalAuthenticated } from "./localAuth";
import { validateStartupIdea, generateMatchingInsights } from "./services/gemini";
import { performComprehensiveValidation } from "./services/enhanced-validation";
import { insertIdeaSchema, insertSubmissionSchema, insertMessageSchema } from "@shared/validation";
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Use local auth in development, Supabase in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    await setupSupabaseAuth(app);
  } else {
    await setupLocalAuth(app);
  }

  // Helper function to get the appropriate authentication middleware
  const getAuthMiddleware = () => isProduction ? isSupabaseAuthenticated : isLocalAuthenticated;
  
  // Helper function to get the appropriate storage
  const getStorage = () => isProduction ? storage : localStorage;

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
  app.post('/api/ideas/validate', getAuthMiddleware(), async (req: any, res) => {
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
  app.post('/api/ideas/:id/generate-pro-report', getAuthMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ideaId = req.params.id;
      
      // Check if user is Pro subscriber
      const user = await getStorage().getUser(userId);
      if (!user || user.subscriptionTier !== 'pro') {
        return res.status(403).json({ message: "Pro subscription required" });
      }
      
      // Get the idea
      const idea = await getStorage().getIdea(ideaId);
      if (!idea || idea.userId !== userId) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Generate enhanced Pro report
      const proReport = await generateProValidationReport(
        idea.title,
        idea.marketCategory,
        idea.problemDescription,
        idea.solutionDescription,
        idea.targetAudience
      );
      
      // Update idea with Pro report
      const currentAnalysis = idea.analysisReport as any || {};
      const updatedAnalysis = {
        ...currentAnalysis,
        proReport,
        lastUpdated: new Date().toISOString()
      };
      
      await getStorage().updateIdeaValidation(ideaId, idea.validationScore || 0, updatedAnalysis);
      
      res.json({ success: true, proReport });
    } catch (error) {
      console.error("Error generating Pro report:", error);
      res.status(500).json({ message: "Failed to generate Pro report" });
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
  app.post('/api/submissions', [getAuthMiddleware(), upload.array('files', 5)], async (req: any, res) => {
    try {
              const userId = req.user.id;
      const fileUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];
      
      const validatedData = insertSubmissionSchema.parse({
        ...req.body,
        userId,
        fileUrls
      });
      
      const submission = await getStorage().createSubmission(validatedData);
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
      
      const fileUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : submission.fileUrls;
      
      const updatedSubmission = await getStorage().updateSubmission(req.params.id, {
        ...req.body,
        fileUrls
      });
      
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  // Matching routes
  app.get('/api/matches/potential', getAuthMiddleware(), async (req: any, res) => {
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

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
