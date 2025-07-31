import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const roleEnum = pgEnum('role', ['engineer', 'designer', 'marketer']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'mutual', 'declined']);
export const marketCategoryEnum = pgEnum('market_category', ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other']);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role"),
  location: varchar("location"),
  bio: text("bio"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default('free'),
  totalIdeaScore: integer("total_idea_score").default(0),
  profileViews: integer("profile_views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  marketCategory: marketCategoryEnum("market_category").notNull(),
  problemDescription: text("problem_description").notNull(),
  solutionDescription: text("solution_description").notNull(),
  targetAudience: text("target_audience").notNull(),
  validationScore: integer("validation_score").default(0),
  analysisReport: jsonb("analysis_report"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: roleEnum("role").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  portfolioUrl: varchar("portfolio_url"),
  githubUrl: varchar("github_url"),
  liveUrl: varchar("live_url"),
  fileUrls: text("file_urls").array(),
  qualityScore: integer("quality_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").references(() => users.id).notNull(),
  user2Id: varchar("user2_id").references(() => users.id).notNull(),
  status: matchStatusEnum("status").default('pending'),
  compatibilityScore: integer("compatibility_score").default(0),
  user1Interested: boolean("user1_interested").default(false),
  user2Interested: boolean("user2_interested").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => matches.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ideas: many(ideas),
  submissions: many(submissions),
  sentMatches: many(matches, { relationName: 'user1Matches' }),
  receivedMatches: many(matches, { relationName: 'user2Matches' }),
  messages: many(messages),
}));

export const ideasRelations = relations(ideas, ({ one }) => ({
  user: one(users, {
    fields: [ideas.userId],
    references: [users.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
    relationName: 'user1Matches',
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
    relationName: 'user2Matches',
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).omit({
  id: true,
  createdAt: true,
  validationScore: true,
  analysisReport: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
  qualityScore: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideas.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
