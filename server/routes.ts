import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { validateStartupIdea, generateMatchingInsights } from "./services/gemini";
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
  // Auth middleware
  await setupAuth(app);

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Idea validation routes
  app.post('/api/ideas/validate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertIdeaSchema.parse({ ...req.body, userId });
      
      // Create the idea first
      const idea = await storage.createIdea(validatedData);
      
      // Validate with Perplexity
      const validation = await validateStartupIdea({
        title: validatedData.title,
        marketCategory: validatedData.marketCategory,
        problemDescription: validatedData.problemDescription,
        solutionDescription: validatedData.solutionDescription,
        targetAudience: validatedData.targetAudience
      });
      
      // Update idea with validation results
      await storage.updateIdeaValidation(idea.id, validation.score, validation.analysisReport);
      
      // Update user's total idea score (use highest score)
      const userIdeas = await storage.getUserIdeas(userId);
      const highestScore = Math.max(...userIdeas.map(i => i.validationScore || 0), validation.score);
      await storage.updateUserIdeaScore(userId, highestScore);
      
      res.json({ ideaId: idea.id, validation });
    } catch (error) {
      console.error("Error validating idea:", error);
      res.status(500).json({ message: "Failed to validate idea" });
    }
  });

  app.get('/api/ideas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const idea = await storage.getIdea(req.params.id);
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

  app.get('/api/ideas', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ideas = await storage.getUserIdeas(userId);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching user ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  // Submission routes
  app.post('/api/submissions', [isAuthenticated, upload.array('files', 5)], async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fileUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];
      
      const validatedData = insertSubmissionSchema.parse({
        ...req.body,
        userId,
        fileUrls
      });
      
      const submission = await storage.createSubmission(validatedData);
      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get('/api/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const submissions = await storage.getUserSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.put('/api/submissions/:id', [isAuthenticated, upload.array('files', 5)], async (req: any, res) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const userId = req.user.id;
      if (submission.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const fileUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : submission.fileUrls;
      
      const updatedSubmission = await storage.updateSubmission(req.params.id, {
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
  app.get('/api/matches/potential', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const potentialMatches = await storage.findPotentialMatches(userId, limit);
      res.json(potentialMatches);
    } catch (error) {
      console.error("Error fetching potential matches:", error);
      res.status(500).json({ message: "Failed to fetch potential matches" });
    }
  });

  app.post('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { targetUserId, interested } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
      }
      
      // Check if match already exists
      const existingMatches = await storage.getUserMatches(userId);
      const existingMatch = existingMatches.find(m => 
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
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate compatibility score
      const insights = await generateMatchingInsights(currentUser, targetUser);
      
      const match = await storage.createMatch({
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

  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const matches = await storage.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get('/api/matches/mutual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const mutualMatches = await storage.getMutualMatches(userId);
      res.json(mutualMatches);
    } catch (error) {
      console.error("Error fetching mutual matches:", error);
      res.status(500).json({ message: "Failed to fetch mutual matches" });
    }
  });

  // Message routes
  app.post('/api/matches/:matchId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      const { content } = req.body;
      
      // Verify user is part of this match
      const match = await storage.getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertMessageSchema.parse({
        matchId,
        senderId: userId,
        content
      });
      
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/matches/:matchId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      
      // Verify user is part of this match
      const match = await storage.getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getMatchMessages(matchId);
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
