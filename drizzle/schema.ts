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
