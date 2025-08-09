import { prisma } from "./prisma";
import { LocalStorage } from './localStorage';
import type {
  User,
  InsertUser,
  Idea,
  InsertIdea,
  InsertSubmission,
  Submission,
  InsertMatch,
  Match,
  InsertMessage,
  Message,
  MatchWithUsers,
  MessageWithSender,
} from "@shared/types";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  updateUserIdeaScore(userId: string, score: number): Promise<void>;
  getLeaderboard(limit?: number): Promise<User[]>;
  
  // Idea operations
  createIdea(idea: InsertIdea): Promise<Idea>;
  getIdea(id: string): Promise<Idea | undefined>;
  getUserIdeas(userId: string): Promise<Idea[]>;
  updateIdeaValidation(ideaId: string, score: number, report: any): Promise<void>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getUserSubmissions(userId: string): Promise<Submission[]>;
  getSubmission(id: string): Promise<Submission | undefined>;
  updateSubmission(id: string, submission: Partial<InsertSubmission>): Promise<Submission>;
  
  // Match operations
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: string): Promise<Match | undefined>;
  getUserMatches(userId: string): Promise<MatchWithUsers[]>;
  getMutualMatches(userId: string): Promise<MatchWithUsers[]>;
  updateMatchInterest(matchId: string, userId: string, interested: boolean): Promise<Match>;
  findPotentialMatches(userId: string, limit?: number): Promise<User[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMatchMessages(matchId: string): Promise<MessageWithSender[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user || undefined;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    // If an ID is provided, try to find by ID first, otherwise by email
    let existingUser = null;
    
    if (userData.id) {
      existingUser = await prisma.user.findUnique({
        where: { id: userData.id }
      });
    }
    
    if (!existingUser && userData.email) {
      existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
    }
    
    if (existingUser) {
      return await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ...userData,
          updatedAt: new Date(),
        },
      });
    } else {
      return await prisma.user.create({
        data: {
          ...userData,
          id: userData.id, // Use provided ID or let Prisma generate one
        },
      });
    }
  }

  async updateUserIdeaScore(userId: string, score: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { totalIdeaScore: score }
    });
  }

  async getLeaderboard(limit = 100): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        totalIdeaScore: {
          not: 0
        }
      },
      orderBy: {
        totalIdeaScore: 'desc'
      },
      take: limit
    });
  }

  // Idea operations
  async createIdea(idea: InsertIdea): Promise<Idea> {
    return await prisma.idea.create({
      data: idea
    });
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    const idea = await prisma.idea.findUnique({
      where: { id }
    });
    return idea || undefined;
  }

  async getUserIdeas(userId: string): Promise<Idea[]> {
    return await prisma.idea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateIdeaValidation(ideaId: string, score: number, report: any): Promise<void> {
    await prisma.idea.update({
      where: { id: ideaId },
      data: { 
        validationScore: score, 
        analysisReport: report 
      }
    });
  }

  // Submission operations
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    return await prisma.submission.create({
      data: submission
    });
  }

  async getUserSubmissions(userId: string): Promise<Submission[]> {
    return await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    const submission = await prisma.submission.findUnique({
      where: { id }
    });
    return submission || undefined;
  }

  async updateSubmission(id: string, submission: Partial<InsertSubmission>): Promise<Submission> {
    return await prisma.submission.update({
      where: { id },
      data: submission
    });
  }

  // Match operations
  async createMatch(match: InsertMatch): Promise<Match> {
    return await prisma.match.create({
      data: match
    });
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const match = await prisma.match.findUnique({
      where: { id }
    });
    return match || undefined;
  }

  async getUserMatches(userId: string): Promise<MatchWithUsers[]> {
    return await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: true,
        user2: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getMutualMatches(userId: string): Promise<MatchWithUsers[]> {
    return await prisma.match.findMany({
      where: {
        AND: [
          {
            OR: [
              { user1Id: userId },
              { user2Id: userId }
            ]
          },
          { status: 'mutual' }
        ]
      },
      include: {
        user1: true,
        user2: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateMatchInterest(matchId: string, userId: string, interested: boolean): Promise<Match> {
    // First get the match to determine which user field to update
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });
    if (!match) throw new Error('Match not found');

    const isUser1 = match.user1Id === userId;
    const updateData = isUser1 
      ? { user1Interested: interested }
      : { user2Interested: interested };

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      }
    });

    // Check if both users are interested to update status
    if (updatedMatch.user1Interested && updatedMatch.user2Interested) {
      return await prisma.match.update({
        where: { id: matchId },
        data: { status: 'mutual' }
      });
    }

    return updatedMatch;
  }

  async findPotentialMatches(userId: string, limit = 10): Promise<User[]> {
    // Get user's role to find complementary roles
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!currentUser) return [];

    // Get users already matched with
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      select: {
        user1Id: true,
        user2Id: true
      }
    });

    const excludeUserIds = [
      userId, 
      ...existingMatches.map(m => m.user1Id === userId ? m.user2Id : m.user1Id)
    ];

    // Find users with complementary roles
    return await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: excludeUserIds } },
          {
            OR: [
              { role: null },
              { role: { not: currentUser.role } }
            ]
          }
        ]
      },
      orderBy: { totalIdeaScore: 'desc' },
      take: limit
    });
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    return await prisma.message.create({
      data: message
    });
  }

  async getMatchMessages(matchId: string): Promise<MessageWithSender[]> {
    return await prisma.message.findMany({
      where: { matchId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' }
    });
  }
}

// Switch to local storage for development when database is unavailable
export const storage = process.env.NODE_ENV === 'development' ? new LocalStorage() : new DatabaseStorage();
