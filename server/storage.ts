import {
  users,
  ideas,
  submissions,
  matches,
  messages,
  type User,
  type UpsertUser,
  type InsertIdea,
  type Idea,
  type InsertSubmission,
  type Submission,
  type InsertMatch,
  type Match,
  type InsertMessage,
  type Message,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ne, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
  getUserMatches(userId: string): Promise<(Match & { user1: User; user2: User })[]>;
  getMutualMatches(userId: string): Promise<(Match & { user1: User; user2: User })[]>;
  updateMatchInterest(matchId: string, userId: string, interested: boolean): Promise<Match>;
  findPotentialMatches(userId: string, limit?: number): Promise<User[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMatchMessages(matchId: string): Promise<(Message & { sender: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserIdeaScore(userId: string, score: number): Promise<void> {
    await db
      .update(users)
      .set({ totalIdeaScore: score })
      .where(eq(users.id, userId));
  }

  async getLeaderboard(limit = 100): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(ne(users.totalIdeaScore, 0))
      .orderBy(desc(users.totalIdeaScore))
      .limit(limit);
  }

  // Idea operations
  async createIdea(idea: InsertIdea): Promise<Idea> {
    const [newIdea] = await db.insert(ideas).values(idea).returning();
    return newIdea;
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
    return idea;
  }

  async getUserIdeas(userId: string): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.userId, userId))
      .orderBy(desc(ideas.createdAt));
  }

  async updateIdeaValidation(ideaId: string, score: number, report: any): Promise<void> {
    await db
      .update(ideas)
      .set({ validationScore: score, analysisReport: report })
      .where(eq(ideas.id, ideaId));
  }

  // Submission operations
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async getUserSubmissions(userId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt));
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async updateSubmission(id: string, submission: Partial<InsertSubmission>): Promise<Submission> {
    const [updated] = await db
      .update(submissions)
      .set(submission)
      .where(eq(submissions.id, id))
      .returning();
    return updated;
  }

  // Match operations
  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getUserMatches(userId: string): Promise<(Match & { user1: User; user2: User })[]> {
    return await db
      .select({
        matches,
        user1: users,
        user2: sql<User>`NULL`
      })
      .from(matches)
      .innerJoin(users, eq(matches.user1Id, users.id))
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
      .orderBy(desc(matches.updatedAt)) as any;
  }

  async getMutualMatches(userId: string): Promise<(Match & { user1: User; user2: User })[]> {
    return await db
      .select({
        matches,
        user1: users,
        user2: sql<User>`NULL`
      })
      .from(matches)
      .innerJoin(users, eq(matches.user1Id, users.id))
      .where(
        and(
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
          eq(matches.status, 'mutual')
        )
      )
      .orderBy(desc(matches.updatedAt)) as any;
  }

  async updateMatchInterest(matchId: string, userId: string, interested: boolean): Promise<Match> {
    // First get the match to determine which user field to update
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) throw new Error('Match not found');

    const isUser1 = match.user1Id === userId;
    const updateField = isUser1 ? { user1Interested: interested } : { user2Interested: interested };

    const [updatedMatch] = await db
      .update(matches)
      .set({
        ...updateField,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId))
      .returning();

    // Check if both users are interested to update status
    if (updatedMatch.user1Interested && updatedMatch.user2Interested) {
      const [finalMatch] = await db
        .update(matches)
        .set({ status: 'mutual' })
        .where(eq(matches.id, matchId))
        .returning();
      return finalMatch;
    }

    return updatedMatch;
  }

  async findPotentialMatches(userId: string, limit = 10): Promise<User[]> {
    // Get user's role to find complementary roles
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!currentUser) return [];

    // Get users already matched with
    const existingMatches = await db
      .select({ userId: sql<string>`CASE WHEN ${matches.user1Id} = ${userId} THEN ${matches.user2Id} ELSE ${matches.user1Id} END` })
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    const excludeUserIds = [userId, ...existingMatches.map(m => m.userId)];

    // Find users with complementary roles
    return await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, userId),
          isNull(users.role).or(ne(users.role, currentUser.role))
        )
      )
      .orderBy(desc(users.totalIdeaScore))
      .limit(limit);
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMatchMessages(matchId: string): Promise<(Message & { sender: User })[]> {
    return await db
      .select({
        messages,
        sender: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt) as any;
  }
}

export const storage = new DatabaseStorage();
