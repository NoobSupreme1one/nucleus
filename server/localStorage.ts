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
import type { IStorage } from "./storage";

// Simple in-memory storage for development
class LocalStorage implements IStorage {
  private users = new Map<string, User>();
  private ideas = new Map<string, Idea>();
  private submissions = new Map<string, Submission>();
  private matches = new Map<string, Match>();
  private messages = new Map<string, Message>();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const userId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
    
    const user: User = {
      id: existingUser?.id || userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      role: userData.role,
      location: userData.location,
      bio: userData.bio,
      subscriptionTier: userData.subscriptionTier,
      totalIdeaScore: userData.totalIdeaScore,
      profileViews: userData.profileViews,
      profilePublic: userData.profilePublic,
      ideasPublic: userData.ideasPublic,
      allowFounderMatching: userData.allowFounderMatching,
      allowDirectContact: userData.allowDirectContact,
      stripeCustomerId: userData.stripeCustomerId,
      stripeSubscriptionId: userData.stripeSubscriptionId,
      subscriptionStatus: userData.subscriptionStatus,
      subscriptionPeriodEnd: userData.subscriptionPeriodEnd,
      subscriptionCancelAtPeriodEnd: userData.subscriptionCancelAtPeriodEnd,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async updateUserIdeaScore(userId: string, score: number): Promise<void> {
    console.log(`[LocalStorage] Updating user score: userId=${userId}, score=${score}`);
    console.log(`[LocalStorage] Available users:`, Array.from(this.users.keys()));
    const user = this.users.get(userId);
    if (user) {
      console.log(`[LocalStorage] Found user, updating score from ${user.totalIdeaScore} to ${score}`);
      user.totalIdeaScore = score;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    } else {
      console.log(`[LocalStorage] User not found: ${userId}`);
    }
  }

  async getLeaderboard(limit = 100): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.totalIdeaScore > 0)
      .sort((a, b) => b.totalIdeaScore - a.totalIdeaScore)
      .slice(0, limit);
  }

  // Idea operations
  async createIdea(ideaData: InsertIdea): Promise<Idea> {
    const id = `idea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const idea: Idea = {
      id,
      ...ideaData,
      validationScore: 0,
      analysisReport: null,
      createdAt: now,
    };
    
    this.ideas.set(id, idea);
    return idea;
  }

  async getIdea(id: string): Promise<Idea | undefined> {
    return this.ideas.get(id);
  }

  async getUserIdeas(userId: string): Promise<Idea[]> {
    console.log(`[LocalStorage] Getting user ideas for userId: ${userId}`);
    const allIdeas = Array.from(this.ideas.values());
    console.log(`[LocalStorage] Total ideas in storage: ${allIdeas.length}`);
    const userIdeas = allIdeas.filter(idea => idea.userId === userId);
    console.log(`[LocalStorage] User ideas found: ${userIdeas.length}`, userIdeas.map(i => ({ id: i.id, score: i.validationScore })));
    return userIdeas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateIdeaValidation(ideaId: string, score: number, report: any): Promise<void> {
    console.log(`[LocalStorage] Updating idea validation: ideaId=${ideaId}, score=${score}`);
    const idea = this.ideas.get(ideaId);
    if (idea) {
      console.log(`[LocalStorage] Found idea, updating score from ${idea.validationScore} to ${score}`);
      idea.validationScore = score;
      idea.analysisReport = report;
      idea.updatedAt = new Date();
      this.ideas.set(ideaId, idea);
    } else {
      console.log(`[LocalStorage] Idea not found: ${ideaId}`);
    }
  }

  // Submission operations (basic implementation)
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const id = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newSubmission: Submission = {
      id,
      ...submission,
      createdAt: now,
      updatedAt: now,
    };
    
    this.submissions.set(id, newSubmission);
    return newSubmission;
  }

  async getUserSubmissions(userId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s => s.userId === userId);
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async updateSubmission(id: string, submission: Partial<InsertSubmission>): Promise<Submission> {
    const existing = this.submissions.get(id);
    if (!existing) throw new Error('Submission not found');
    
    const updated = { ...existing, ...submission, updatedAt: new Date() };
    this.submissions.set(id, updated);
    return updated;
  }

  // Match operations (basic implementation)
  async createMatch(match: InsertMatch): Promise<Match> {
    const id = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newMatch: Match = {
      id,
      ...match,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    
    this.matches.set(id, newMatch);
    return newMatch;
  }

  async getMatch(id: string): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getUserMatches(userId: string): Promise<MatchWithUsers[]> {
    const userMatches = Array.from(this.matches.values())
      .filter(match => match.user1Id === userId || match.user2Id === userId);
    
    return userMatches.map(match => ({
      ...match,
      user1: this.users.get(match.user1Id)!,
      user2: this.users.get(match.user2Id)!,
    }));
  }

  async getMutualMatches(userId: string): Promise<MatchWithUsers[]> {
    const matches = await this.getUserMatches(userId);
    return matches.filter(match => match.status === 'mutual');
  }

  async updateMatchInterest(matchId: string, userId: string, interested: boolean): Promise<Match> {
    const match = this.matches.get(matchId);
    if (!match) throw new Error('Match not found');

    const isUser1 = match.user1Id === userId;
    if (isUser1) {
      match.user1Interested = interested;
    } else {
      match.user2Interested = interested;
    }

    match.updatedAt = new Date();
    
    if (match.user1Interested && match.user2Interested) {
      match.status = 'mutual';
    }
    
    this.matches.set(matchId, match);
    return match;
  }

  async findPotentialMatches(userId: string, limit = 10): Promise<User[]> {
    const currentUser = this.users.get(userId);
    if (!currentUser) return [];

    const existingMatchUserIds = Array.from(this.matches.values())
      .filter(match => match.user1Id === userId || match.user2Id === userId)
      .map(match => match.user1Id === userId ? match.user2Id : match.user1Id);

    return Array.from(this.users.values())
      .filter(user => 
        user.id !== userId && 
        !existingMatchUserIds.includes(user.id) &&
        (!user.role || user.role !== currentUser.role)
      )
      .sort((a, b) => b.totalIdeaScore - a.totalIdeaScore)
      .slice(0, limit);
  }

  // Message operations (basic implementation)
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newMessage: Message = {
      id,
      ...message,
      createdAt: now,
      updatedAt: now,
    };
    
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMatchMessages(matchId: string): Promise<MessageWithSender[]> {
    const matchMessages = Array.from(this.messages.values())
      .filter(message => message.matchId === matchId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return matchMessages.map(message => ({
      ...message,
      sender: this.users.get(message.senderId)!,
    }));
  }
}

export const localStorage = new LocalStorage();