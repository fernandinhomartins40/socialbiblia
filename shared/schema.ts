import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  denomination: varchar("denomination"),
  favoriteVerse: text("favorite_verse"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  verseReference: varchar("verse_reference"),
  verseText: text("verse_text"),
  type: varchar("type").notNull().default("post"), // post, prayer, verse
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follows table
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communities table
export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull().default("fas fa-users"),
  color: varchar("color").notNull().default("spiritual-blue"),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community memberships table
export const communityMemberships = pgTable("community_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull().default("member"), // member, moderator, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// AI interactions table
export const aiInteractions = pgTable("ai_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  userMessage: text("user_message").notNull(),
  aiResponse: text("ai_response").notNull(),
  emotion: varchar("emotion"), // anxiety, sadness, joy, etc.
  feedback: varchar("feedback"), // useful, not_useful
  createdAt: timestamp("created_at").defaultNow(),
});

// Complete Bible structure with books, chapters and verses
export const biblicalBooks = pgTable("biblical_books", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  abbreviation: varchar("abbreviation").notNull(),
  testament: varchar("testament").notNull(), // "old" or "new"
  order: integer("order").notNull(),
  chapters: integer("chapters").notNull(),
});

export const biblicalChapters = pgTable("biblical_chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").notNull().references(() => biblicalBooks.id),
  chapterNumber: integer("chapter_number").notNull(),
  verses: integer("verses").notNull(),
});

export const biblicalVerses = pgTable("biblical_verses", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").references(() => biblicalBooks.id),
  chapterId: uuid("chapter_id").references(() => biblicalChapters.id),
  book: varchar("book").notNull(),
  chapter: integer("chapter").notNull(),
  verse: integer("verse").notNull(),
  text: text("text").notNull(),
  translation: varchar("translation").notNull().default("ACF"),
  emotions: text("emotions").array(), // Array of emotions this verse addresses
  keywords: text("keywords").array(), // Array of keywords for search
});

// User bookmarks and notes
export const biblicalBookmarks = pgTable("biblical_bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  verseId: uuid("verse_id").notNull().references(() => biblicalVerses.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const biblicalReadingPlans = pgTable("biblical_reading_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // days
  verses: jsonb("verses").notNull(), // array of verse references
});

export const userReadingProgress = pgTable("user_reading_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: uuid("plan_id").references(() => biblicalReadingPlans.id),
  completedVerses: jsonb("completed_verses").default([]),
  startDate: timestamp("start_date").defaultNow(),
  lastRead: timestamp("last_read").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  aiInteractions: many(aiInteractions),
  communityMemberships: many(communityMemberships),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
  user: one(users, { fields: [likes.userId], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  memberships: many(communityMemberships),
}));

export const communityMembershipsRelations = relations(communityMemberships, ({ one }) => ({
  community: one(communities, { fields: [communityMemberships.communityId], references: [communities.id] }),
  user: one(users, { fields: [communityMemberships.userId], references: [users.id] }),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  user: one(users, { fields: [aiInteractions.userId], references: [users.id] }),
}));

export const biblicalBooksRelations = relations(biblicalBooks, ({ many }) => ({
  chapters: many(biblicalChapters),
  verses: many(biblicalVerses),
}));

export const biblicalChaptersRelations = relations(biblicalChapters, ({ one, many }) => ({
  book: one(biblicalBooks, { fields: [biblicalChapters.bookId], references: [biblicalBooks.id] }),
  verses: many(biblicalVerses),
}));

export const biblicalVersesRelations = relations(biblicalVerses, ({ one, many }) => ({
  book: one(biblicalBooks, { fields: [biblicalVerses.bookId], references: [biblicalBooks.id] }),
  chapter: one(biblicalChapters, { fields: [biblicalVerses.chapterId], references: [biblicalChapters.id] }),
  bookmarks: many(biblicalBookmarks),
}));

export const biblicalBookmarksRelations = relations(biblicalBookmarks, ({ one }) => ({
  user: one(users, { fields: [biblicalBookmarks.userId], references: [users.id] }),
  verse: one(biblicalVerses, { fields: [biblicalBookmarks.verseId], references: [biblicalVerses.id] }),
}));

export const userReadingProgressRelations = relations(userReadingProgress, ({ one }) => ({
  user: one(users, { fields: [userReadingProgress.userId], references: [users.id] }),
  plan: one(biblicalReadingPlans, { fields: [userReadingProgress.planId], references: [biblicalReadingPlans.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  denomination: true,
  favoriteVerse: true,
  bio: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertAIInteractionSchema = createInsertSchema(aiInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertBiblicalBookSchema = createInsertSchema(biblicalBooks).omit({
  id: true,
});

export const insertBiblicalChapterSchema = createInsertSchema(biblicalChapters).omit({
  id: true,
});

export const insertBiblicalVerseSchema = createInsertSchema(biblicalVerses).omit({
  id: true,
});

export const insertBiblicalBookmarkSchema = createInsertSchema(biblicalBookmarks).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type AIInteraction = typeof aiInteractions.$inferSelect;
export type InsertAIInteraction = z.infer<typeof insertAIInteractionSchema>;

// Biblical types
export type BiblicalBook = typeof biblicalBooks.$inferSelect;
export type InsertBiblicalBook = z.infer<typeof insertBiblicalBookSchema>;
export type BiblicalChapter = typeof biblicalChapters.$inferSelect;
export type InsertBiblicalChapter = z.infer<typeof insertBiblicalChapterSchema>;
export type BiblicalVerse = typeof biblicalVerses.$inferSelect;
export type InsertBiblicalVerse = z.infer<typeof insertBiblicalVerseSchema>;
export type BiblicalBookmark = typeof biblicalBookmarks.$inferSelect;
export type InsertBiblicalBookmark = z.infer<typeof insertBiblicalBookmarkSchema>;
export type BiblicalReadingPlan = typeof biblicalReadingPlans.$inferSelect;
export type UserReadingProgress = typeof userReadingProgress.$inferSelect;

// Extended types with relations
export type PostWithUser = Post & {
  user: User;
  comments: (Comment & { user: User })[];
  likes: { userId: string }[];
  _count: {
    likes: number;
    comments: number;
  };
};

export type UserWithStats = User & {
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
};
