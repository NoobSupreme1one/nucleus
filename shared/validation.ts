import { z } from "zod";
import { Role, SubscriptionTier, MatchStatus, MarketCategory } from '@prisma/client';

// Enum schemas
export const roleSchema = z.nativeEnum(Role);
export const subscriptionTierSchema = z.nativeEnum(SubscriptionTier);
export const matchStatusSchema = z.nativeEnum(MatchStatus);
export const marketCategorySchema = z.nativeEnum(MarketCategory);

// Insert schemas
export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  role: roleSchema.optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  subscriptionTier: subscriptionTierSchema.optional(),
  totalIdeaScore: z.number().optional(),
  profileViews: z.number().optional(),
});

export const insertIdeaSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  marketCategory: marketCategorySchema,
  problemDescription: z.string().min(1),
  solutionDescription: z.string().min(1),
  targetAudience: z.string().min(1),
});

export const insertSubmissionSchema = z.object({
  userId: z.string(),
  role: roleSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  portfolioUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  fileUrls: z.array(z.string()).optional(),
});

export const insertMatchSchema = z.object({
  user1Id: z.string(),
  user2Id: z.string(),
  status: matchStatusSchema.optional(),
  compatibilityScore: z.number().optional(),
  user1Interested: z.boolean().optional(),
  user2Interested: z.boolean().optional(),
});

export const insertMessageSchema = z.object({
  matchId: z.string(),
  senderId: z.string(),
  content: z.string().min(1),
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial().omit({ id: true });
export const updateIdeaSchema = insertIdeaSchema.partial().omit({ userId: true });
export const updateSubmissionSchema = insertSubmissionSchema.partial().omit({ userId: true });
export const updateMatchSchema = insertMatchSchema.partial().omit({ user1Id: true, user2Id: true });
export const updateMessageSchema = insertMessageSchema.partial().omit({ matchId: true, senderId: true }); 