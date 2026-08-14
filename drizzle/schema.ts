import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Thumbnails table — stores generated miniatures
 */
export const thumbnails = mysqlTable("thumbnails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 64 }).default("viral"),
  /** URL of the generated image stored in S3 */
  imageUrl: text("imageUrl").notNull(),
  /** Status: generating, completed, failed */
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  /** Number of credits used */
  creditsUsed: int("creditsUsed").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type Thumbnail = typeof thumbnails.$inferSelect;
export type InsertThumbnail = typeof thumbnails.$inferInsert;

/**
 * Credits table — tracks available credits per user
 */
export const userCredits = mysqlTable("userCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  credits: int("credits").default(10).notNull(),
  planType: mysqlEnum("planType", ["free", "pro", "max"]).default("free").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_credits_user_id_idx").on(table.userId),
}));

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = typeof userCredits.$inferInsert;

/**
 * Likes table — tracks which users liked which thumbnails
 */
export const thumbnailLikes = mysqlTable("thumbnailLikes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  thumbnailId: int("thumbnailId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueLike: index("unique_like_idx").on(table.userId, table.thumbnailId),
  thumbIdx: index("thumb_like_idx").on(table.thumbnailId),
}));

export type ThumbnailLike = typeof thumbnailLikes.$inferSelect;
export type InsertThumbnailLike = typeof thumbnailLikes.$inferInsert;

/**
 * Team members table — team collaboration
 */
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "admin"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("team_owner_idx").on(table.ownerId),
  uniqueMember: index("unique_member_idx").on(table.ownerId, table.userId),
}));

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Team tasks table — collaborative workflow
 */
export const teamTasks = mysqlTable("teamTasks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  thumbnailId: int("thumbnailId").notNull(),
  assigneeId: int("assigneeId"),
  status: mysqlEnum("status", ["pending", "reviewing", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  comment: text("comment"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdx: index("task_owner_idx").on(table.ownerId),
  thumbIdx: index("task_thumb_idx").on(table.thumbnailId),
}));

export type TeamTask = typeof teamTasks.$inferSelect;
export type InsertTeamTask = typeof teamTasks.$inferInsert;

/**
 * Favorites table — user favorites
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  thumbnailId: int("thumbnailId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueFav: index("unique_fav_idx").on(table.userId, table.thumbnailId),
  thumbIdx: index("fav_thumb_idx").on(table.thumbnailId),
}));

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Templates table — inspiration templates (admin + user uploaded)
 */
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  title: text("title").notNull(),
  imageUrl: text("imageUrl").notNull(),
  source: mysqlEnum("source", ["unsplash", "pexels", "custom", "user"]).default("custom"),
  category: varchar("category", { length: 64 }).default("viral"),
  likesCount: int("likesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("template_user_idx").on(table.userId),
}));

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Avatars table — generated avatar images
 */
export const avatars = mysqlTable("avatars", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 64 }).default("professional"),
  imageUrl: text("imageUrl").notNull(),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("avatar_user_idx").on(table.userId),
}));

export type Avatar = typeof avatars.$inferSelect;
export type InsertAvatar = typeof avatars.$inferInsert;

/**
 * YouTube end cards table
 */
export const endCards = mysqlTable("endCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  prompt: text("prompt").notNull(),
  style: varchar("style", { length: 64 }).default("viral"),
  imageUrl: text("imageUrl").notNull(),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("endcard_user_idx").on(table.userId),
}));

export type EndCard = typeof endCards.$inferSelect;
export type InsertEndCard = typeof endCards.$inferInsert;

/**
 * Soft-deleted thumbnails (trash)
 */
export const trashedThumbnails = mysqlTable("trashedThumbnails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  thumbnailId: int("thumbnailId").notNull(),
  prompt: text("prompt"),
  imageUrl: text("imageUrl"),
  style: varchar("style", { length: 64 }),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => ({
  userIdIdx: index("trash_user_idx").on(table.userId),
}));

export type TrashedThumbnail = typeof trashedThumbnails.$inferSelect;
export type InsertTrashedThumbnail = typeof trashedThumbnails.$inferInsert;

/**
 * API Keys table
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  isActive: mysqlEnum("isActive", ["active", "revoked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("apikey_user_idx").on(table.userId),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  type: mysqlEnum("type", ["generation", "credit", "team", "system"]).default("system").notNull(),
  isRead: mysqlEnum("isRead", ["read", "unread"]).default("unread").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notif_user_idx").on(table.userId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
