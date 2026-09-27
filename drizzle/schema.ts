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
  /** YouTube Studio scheduling fields */
  youtubeTitle: text("youtubeTitle"),
  youtubeStatus: mysqlEnum("youtubeStatus", ["unplanned", "planned"]).default("unplanned").notNull(),
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
  notifiedLowCredit: int("notifiedLowCredit").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_credits_user_id_idx").on(table.userId),
}));

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = typeof userCredits.$inferInsert;

/** Immutable credit ledger for generation debits, refunds and top-ups. */
export const creditLedger = mysqlTable("creditLedger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  type: mysqlEnum("type", ["debit", "refund", "grant"]).notNull(),
  reason: varchar("reason", { length: 128 }).notNull(),
  referenceId: varchar("referenceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("credit_ledger_user_idx").on(table.userId),
  createdAtIdx: index("credit_ledger_created_idx").on(table.createdAt),
}));

export type CreditLedger = typeof creditLedger.$inferSelect;
export type InsertCreditLedger = typeof creditLedger.$inferInsert;

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
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("apikey_user_idx").on(table.userId),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/** Super-admin audit trail for sensitive security and communication actions. */
export const adminAuditLogs = mysqlTable("adminAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").notNull(),
  action: mysqlEnum("action", ["legacy_keys_revoked", "users_notified"]).notNull(),
  targetUserId: int("targetUserId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("admin_audit_created_idx").on(table.createdAt),
  actorIdx: index("admin_audit_actor_idx").on(table.actorUserId),
}));

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;

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
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notif_user_idx").on(table.userId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Template customizations — user-defined edits of a library template
 * (text layers, colors, emojis, overlay elements) before/after generation.
 */
export const templateCustomizations = mysqlTable("templateCustomizations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateId: int("templateId").notNull(),
  title: text("title").notNull(),
  /** JSON: array of elements { id, type: "text"|"emoji"|"shape", text, x, y, fontSize, color, ... } */
  elements: json("elements").notNull(),
  backgroundColor: varchar("backgroundColor", { length: 16 }).default("#000000"),
  /** Optional: thumbnail produced from this customization */
  thumbnailId: int("thumbnailId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("custom_user_idx").on(table.userId),
  templateIdIdx: index("custom_template_idx").on(table.templateId),
}));

export type TemplateCustomization = typeof templateCustomizations.$inferSelect;
export type InsertTemplateCustomization = typeof templateCustomizations.$inferInsert;

/**
 * Image versions — snapshot history of an edited thumbnail in the Canva editor
 */
export const imageVersions = mysqlTable("imageVersions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  thumbnailId: int("thumbnailId").notNull(),
  name: text("name").notNull(),
  imageUrl: text("imageUrl").notNull(),
  /** JSON: editor elements snapshot at save time */
  elements: json("elements").notNull(),
  isCurrent: mysqlEnum("isCurrent", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("ver_user_idx").on(table.userId),
  thumbIdx: index("ver_thumb_idx").on(table.thumbnailId),
}));

export type ImageVersion = typeof imageVersions.$inferSelect;
export type InsertImageVersion = typeof imageVersions.$inferInsert;

/**
 * Organizations — one per user by default, team collaboration hub
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdx: index("org_owner_idx").on(table.ownerId),
  slugIdx: index("org_slug_idx").on(table.slug),
}));

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Team invitations — received / sent invitation management
 */
export const teamInvitations = mysqlTable("teamInvitations", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["member", "admin"]).default("member").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  invitedBy: int("invitedBy").notNull(),
  invitedTo: int("invitedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => ({
  orgIdx: index("inv_org_idx").on(table.orgId),
  emailIdx: index("inv_email_idx").on(table.email),
}));

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

/**
 * A/B tests — two thumbnail variants compared on declared CTR
 */
export const abTests = mysqlTable("abTests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  variantAId: int("variantAId").notNull(),
  variantBId: int("variantBId").notNull(),
  /** Declared stats (user reports YouTube Analytics views/clicks) */
  viewsA: int("viewsA").default(0).notNull(),
  clicksA: int("clicksA").default(0).notNull(),
  viewsB: int("viewsB").default(0).notNull(),
  clicksB: int("clicksB").default(0).notNull(),
  winner: mysqlEnum("winner", ["a", "b", "tie", "undecided"]).default("undecided").notNull(),
  status: mysqlEnum("status", ["running", "finished"]).default("running").notNull(),
  /** True when the test was auto-closed by statistical significance (z-test) */
  autoClosed: int("autoClosed").default(0).notNull(),
  /** Public read-only share token for collaborators */
  shareToken: varchar("shareToken", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("ab_user_idx").on(table.userId),
}));

export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = typeof abTests.$inferInsert;

/**
 * A/B test collaborative contributions — team members add their own
 * YouTube views/clicks without modifying the original variant stats
 */
export const abTestContributions = mysqlTable("abTestContributions", {
  id: int("id").autoincrement().primaryKey(),
  abTestId: int("abTestId").notNull(),
  userId: int("userId").notNull(),
  orgId: int("orgId"),
  /** Contributor reports which variant these stats belong to */
  variant: mysqlEnum("variant", ["a", "b"]).notNull(),
  views: int("views").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  channelName: varchar("channelName", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  abTestIdx: index("contrib_abtest_idx").on(table.abTestId),
  userIdx: index("contrib_user_idx").on(table.userId),
}));

export type AbTestContribution = typeof abTestContributions.$inferSelect;
export type InsertAbTestContribution = typeof abTestContributions.$inferInsert;

/**
 * Planned schedules — publication reminders with countdown
 */
export const publishedSchedules = mysqlTable("publishedSchedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  thumbnailId: int("thumbnailId").notNull(),
  youtubeTitle: text("youtubeTitle").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  reminded: int("reminded").default(0).notNull(),
  remindedJ5: int("remindedJ5").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("sched_user_idx").on(table.userId),
  thumbIdx: index("sched_thumb_idx").on(table.thumbnailId),
}));

export type PublishedSchedule = typeof publishedSchedules.$inferSelect;
export type InsertPublishedSchedule = typeof publishedSchedules.$inferInsert;

/**
 * Credit pack purchases — simulated (fake) payments, ready for a future Stripe
 * integration. Credits are added to userCredits immediately on purchase.
 */
export const creditPackPurchases = mysqlTable("creditPackPurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  packId: varchar("packId", { length: 32 }).notNull(),
  packLabel: varchar("packLabel", { length: 64 }).notNull(),
  creditsGranted: int("creditsGranted").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).default("EUR").notNull(),
  status: mysqlEnum("status", ["completed", "refunded", "failed"]).default("completed").notNull(),
  /** Placeholder for the future Stripe payment intent ID */
  paymentId: varchar("paymentId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("cpp_user_idx").on(table.userId),
}));

export type CreditPackPurchase = typeof creditPackPurchases.$inferSelect;
export type InsertCreditPackPurchase = typeof creditPackPurchases.$inferInsert;

/**
 * Real user testimonials — collected via a public feedback form (no fabricated reviews).
 * Moderated by admins before being displayed on the landing page.
 */
export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Verified flag from admin moderation */
  verified: mysqlEnum("verified", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** Author display info */
  authorName: varchar("authorName", { length: 128 }),
  authorChannel: varchar("authorChannel", { length: 128 }),
  /** 1-5 star rating */
  rating: int("rating").default(5).notNull(),
  /** Free-form feedback */
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("test_user_idx").on(table.userId),
  verifiedIdx: index("test_verified_idx").on(table.verified),
}));
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;
