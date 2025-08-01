import type { 
  User, 
  Idea, 
  Submission, 
  Match, 
  Message,
  Role,
  SubscriptionTier,
  MatchStatus,
  MarketCategory
} from '@prisma/client';

// Export Prisma types
export type { 
  User, 
  Idea, 
  Submission, 
  Match, 
  Message,
  Role,
  SubscriptionTier,
  MatchStatus,
  MarketCategory
};

// Insert types (for creating new records)
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertIdea = Omit<Idea, 'id' | 'createdAt' | 'validationScore' | 'analysisReport'>;
export type InsertSubmission = Omit<Submission, 'id' | 'createdAt' | 'qualityScore'>;
export type InsertMatch = Omit<Match, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertMessage = Omit<Message, 'id' | 'createdAt'>;

// Update types (for partial updates)
export type UpdateUser = Partial<InsertUser>;
export type UpdateIdea = Partial<InsertIdea>;
export type UpdateSubmission = Partial<InsertSubmission>;
export type UpdateMatch = Partial<InsertMatch>;
export type UpdateMessage = Partial<InsertMessage>;

// Extended types with relations
export type UserWithIdeas = User & {
  ideas: Idea[];
};

export type UserWithSubmissions = User & {
  submissions: Submission[];
};

export type MatchWithUsers = Match & {
  user1: User;
  user2: User;
};

export type MatchWithMessages = Match & {
  messages: Message[];
};

export type MessageWithSender = Message & {
  sender: User;
};

export type IdeaWithUser = Idea & {
  user: User;
};

export type SubmissionWithUser = Submission & {
  user: User;
}; 