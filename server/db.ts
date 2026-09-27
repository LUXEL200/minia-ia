import { and, desc, eq, gte, lt, lte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, thumbnails, userCredits, creditLedger, InsertThumbnail, thumbnailLikes, teamMembers, teamTasks, favorites, templates, avatars, endCards, trashedThumbnails, apiKeys, notifications, adminAuditLogs, templateCustomizations, imageVersions, abTests, abTestContributions, publishedSchedules, InsertTemplateCustomization, InsertImageVersion, InsertAbTest, organizations, teamInvitations, creditPackPurchases, InsertCreditPackPurchase, testimonials, InsertTestimonial, InsertCreditLedger } from "../drizzle/schema";
import { ENV } from './_core/env';
import { notifyOwner } from "./_core/notification";
import { createHash, randomBytes } from "node:crypto";

let _db: ReturnType<typeof drizzle> | null = null;

/** Drizzle/mysql2 peut renvoyer le ResultSetHeader directement ou dans un tuple. */
export function getAffectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result;
  return Number((header as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// === Thumbnails ===

export async function getThumbnailsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(thumbnails).where(eq(thumbnails.userId, userId)).orderBy(desc(thumbnails.createdAt));
}

export async function getThumbnailById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(thumbnails).where(eq(thumbnails.id, id)).limit(1);
  return result[0];
}

export async function createThumbnail(data: InsertThumbnail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(thumbnails).values(data);
  return { id: result.insertId };
}

export async function updateThumbnailStatus(id: number, status: string, imageUrl?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (imageUrl) updateData.imageUrl = imageUrl;
  await db.update(thumbnails).set(updateData).where(eq(thumbnails.id, id));
}

// === Credits ===

export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  return result[0];
}

export async function ensureUserCredits(userId: number) {
  const db = await getDb();
  if (!db) return { credits: 10, planType: "free" };
  const existing = await getUserCredits(userId);
  if (!existing) {
    await db.insert(userCredits).values({ userId, credits: 10, planType: "free" });
    return { credits: 10, planType: "free" };
  }
  return existing;
}

export async function deductCredits(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return false;
  if (!Number.isInteger(amount) || amount <= 0) return false;
  const result = await db.update(userCredits)
    .set({ credits: sql`${userCredits.credits} - ${amount}` })
    .where(and(eq(userCredits.userId, userId), sql`${userCredits.credits} >= ${amount}`));
  const applied = getAffectedRows(result) === 1;
  if (applied) {
    const current = await getUserCredits(userId);
    if (current) await recordCreditLedger({ userId, amount, balanceAfter: current.credits, type: "debit", reason: "generation" });
  }
  return applied;
}

export async function refundCredits(userId: number, amount: number) {
  const db = await getDb();
  if (!db || !Number.isInteger(amount) || amount <= 0) return false;
  const result = await db.update(userCredits)
    .set({ credits: sql`${userCredits.credits} + ${amount}` })
    .where(eq(userCredits.userId, userId));
  const applied = getAffectedRows(result) === 1;
  if (applied) {
    const current = await getUserCredits(userId);
    if (current) await recordCreditLedger({ userId, amount, balanceAfter: current.credits, type: "refund", reason: "generation_failed" });
  }
  return applied;
}

export async function recordCreditLedger(entry: InsertCreditLedger) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(creditLedger).values(entry);
  return { id: result.insertId };
}

export async function listCreditLedger(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(100);
}

// === Public Gallery ===

export async function getGalleryThumbnails(params: {
  style?: string;
  limit?: number;
  offset?: number;
  sortBy?: "recent" | "popular";
}) {
  const db = await getDb();
  if (!db) return [];

  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;
  const sortBy = params.sortBy ?? "recent";

  const whereConditions = [eq(thumbnails.status, "completed")];
  if (params.style && params.style !== "all") {
    whereConditions.push(eq(thumbnails.style, params.style));
  }

  const queryBuilder = db
    .select({
      id: thumbnails.id,
      imageUrl: thumbnails.imageUrl,
      prompt: thumbnails.prompt,
      style: thumbnails.style,
      createdAt: thumbnails.createdAt,
    })
    .from(thumbnails)
    .where(and(...whereConditions));

  let results: any[];
  if (sortBy === "popular") {
    // Join with likes to count, order by likes desc
    const allResults = await queryBuilder
      .orderBy(desc(thumbnails.createdAt))
      .limit(200) // fetch more to sort client-side by likes
      .offset(0);

    // Get like counts for all results
    const enrichedResults = [];
    for (const r of allResults) {
      const likes = await db.select().from(thumbnailLikes).where(eq(thumbnailLikes.thumbnailId, r.id));
      enrichedResults.push({ ...r, likeCount: likes.length });
    }

    // Sort by likes descending, then by date
    enrichedResults.sort((a, b) => b.likeCount - a.likeCount || b.createdAt.getTime() - a.createdAt.getTime());

    results = enrichedResults.slice(offset, offset + limit);
  } else {
    results = await queryBuilder
      .orderBy(desc(thumbnails.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return results;
}

export async function getGalleryStats() {
  const db = await getDb();
  if (!db) return { total: 0, styles: {} };

  const totalResult = await db
    .select()
    .from(thumbnails)
    .where(eq(thumbnails.status, "completed"));

  const total = totalResult.length;

  const styleCounts: Record<string, number> = {};
  for (const t of totalResult) {
    const style = t.style ?? "unknown";
    styleCounts[style] = (styleCounts[style] || 0) + 1;
  }

  return { total, styles: styleCounts };
}

// === Likes ===

export async function toggleLike(userId: number, thumbnailId: number): Promise<{ liked: boolean; count: number }> {
  const db = await getDb();
  if (!db) return { liked: false, count: 0 };

  const existing = await db.select().from(thumbnailLikes)
    .where(and(eq(thumbnailLikes.userId, userId), eq(thumbnailLikes.thumbnailId, thumbnailId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(thumbnailLikes).where(eq(thumbnailLikes.id, existing[0].id));
    const countResult = await db.select().from(thumbnailLikes).where(eq(thumbnailLikes.thumbnailId, thumbnailId));
    return { liked: false, count: countResult.length };
  } else {
    await db.insert(thumbnailLikes).values({ userId, thumbnailId });
    const countResult = await db.select().from(thumbnailLikes).where(eq(thumbnailLikes.thumbnailId, thumbnailId));
    return { liked: true, count: countResult.length };
  }
}

export async function getLikesForThumbnails(thumbnailIds: number[], userId?: number) {
  const db = await getDb();
  if (!db || thumbnailIds.length === 0) return {};

  const results: Record<number, { count: number; liked: boolean }> = {};

  for (const id of thumbnailIds) {
    const likes = await db.select().from(thumbnailLikes).where(eq(thumbnailLikes.thumbnailId, id));
    results[id] = {
      count: likes.length,
      liked: userId ? likes.some(l => l.userId === userId) : false,
    };
  }

  return results;
}

// === Team ===

export async function getTeamMembers(ownerId: number) {
  const db = await getDb();
  if (!db) return [];

  const members = await db.select().from(teamMembers).where(eq(teamMembers.ownerId, ownerId));

  const enriched = [];
  for (const m of members) {
    const userResult = await db.select().from(users).where(eq(users.id, m.userId)).limit(1);
    enriched.push({
      ...m,
      name: userResult[0]?.name || userResult[0]?.email || "Utilisateur",
      email: userResult[0]?.email,
    });
  }

  return enriched;
}

export async function inviteTeamMember(ownerId: number, userId: number, role: "member" | "admin" = "member") {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(teamMembers).values({ ownerId, userId, role });
    // Notify owner about new team member
    try {
      await notifyOwner({
        title: "Nouveau membre d'équipe",
        content: `Un nouveau membre (ID: ${userId}) a été ajouté à votre équipe Minia IA.`,
      });
    } catch { /* ignore notification errors */ }
    return true;
  } catch {
    return false;
  }
}

export async function removeTeamMember(ownerId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(teamMembers).where(and(eq(teamMembers.ownerId, ownerId), eq(teamMembers.userId, userId)));
  return true;
}

// === Team Tasks ===

export async function getTeamTasks(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamTasks)
    .where(eq(teamTasks.ownerId, ownerId))
    .orderBy(desc(teamTasks.createdAt));
}

export async function createTeamTask(data: { ownerId: number; thumbnailId: number; assigneeId?: number; status?: string; comment?: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(teamTasks).values({
    ownerId: data.ownerId,
    thumbnailId: data.thumbnailId,
    assigneeId: data.assigneeId,
    status: (data.status as any) || "pending",
    comment: data.comment,
    createdBy: data.createdBy,
  });
  return { id: result.insertId };
}

export async function updateTaskStatus(ownerId: number, taskId: number, status: "pending" | "reviewing" | "approved" | "rejected" | "cancelled", comment?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (comment) updateData.comment = comment;
  const result = await db.update(teamTasks).set(updateData)
    .where(and(eq(teamTasks.id, taskId), eq(teamTasks.ownerId, ownerId)));
  if (getAffectedRows(result) !== 1) return false;

  // Send notification on status change
  try {
    await notifyOwner({
      title: `Tâche ${status === "approved" ? "approuvée" : status === "rejected" ? "rejetée" : "mise à jour"}`,
      content: `Une tâche a été ${status === "approved" ? "approuvée" : status === "rejected" ? "rejetée" : "mise à jour"} (ID: ${taskId}).${comment ? ` Commentaire: ${comment}` : ""}`,
    });
  } catch { /* ignore notification errors */ }
  return true;
}

// === Favorites ===
export async function toggleFavorite(userId: number, thumbnailId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.thumbnailId, thumbnailId))).limit(1);
  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return false;
  }
  await db.insert(favorites).values({ userId, thumbnailId });
  return true;
}

export async function getFavoritesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const favs = await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  const results = [];
  for (const f of favs) {
    const thumb = await getThumbnailById(f.thumbnailId);
    if (thumb) results.push({ ...thumb, favoritedAt: f.createdAt });
  }
  return results;
}

// === Templates ===
export async function getAllTemplates(category?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(templates.id, templates.id)]; // always true
  if (category && category !== "all") conditions.push(eq(templates.category, category));
  return db.select().from(templates)
    .where(and(...conditions))
    .orderBy(desc(templates.createdAt))
    .limit(limit);
}

export async function createTemplate(data: { userId?: number; title: string; imageUrl: string; source?: string; category?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(templates).values({
    userId: data.userId,
    title: data.title,
    imageUrl: data.imageUrl,
    source: (data.source || "custom") as any,
    category: data.category || "viral",
  });
  return { id: result.insertId };
}

export async function deleteTemplate(id: number, userId?: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return false;
  if (isAdmin) {
    await db.delete(templates).where(eq(templates.id, id));
  } else if (userId) {
    await db.delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
  }
  return true;
}

// === Avatars ===
export async function getAvatarsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(avatars).where(eq(avatars.userId, userId)).orderBy(desc(avatars.createdAt));
}

export async function createAvatar(data: { userId: number; prompt: string; style?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] =   await db.insert(avatars).values({
    userId: data.userId,
    prompt: data.prompt,
    style: data.style || "professional",
    imageUrl: "pending",
  });
  return { id: result.insertId };
}

export async function updateAvatarStatus(id: number, status: string, imageUrl?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (imageUrl) updateData.imageUrl = imageUrl;
  await db.update(avatars).set(updateData).where(eq(avatars.id, id));
}

// === End Cards ===
export async function getEndCardsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(endCards).where(eq(endCards.userId, userId)).orderBy(desc(endCards.createdAt));
}

export async function createEndCard(data: { userId: number; prompt: string; style?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] =   await db.insert(endCards).values({
    userId: data.userId,
    prompt: data.prompt,
    style: data.style || "viral",
    imageUrl: "pending",
  });
  return { id: result.insertId };
}

export async function updateEndCardStatus(id: number, status: string, imageUrl?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (imageUrl) updateData.imageUrl = imageUrl;
  await db.update(endCards).set(updateData).where(eq(endCards.id, id));
}

// === Trash ===
export async function moveToTrash(userId: number, thumbnailId: number, prompt?: string, imageUrl?: string, style?: string) {
  const db = await getDb();
  if (!db) return false;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(trashedThumbnails).values({
    userId, thumbnailId, prompt, imageUrl, style, deletedAt: new Date(), expiresAt,
  });
  return true;
}

export async function getTrashedByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trashedThumbnails).where(eq(trashedThumbnails.userId, userId)).orderBy(desc(trashedThumbnails.deletedAt));
}

export async function restoreFromTrash(trashId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const trash = await db.select().from(trashedThumbnails)
    .where(and(eq(trashedThumbnails.id, trashId), eq(trashedThumbnails.userId, userId))).limit(1);
  if (trash.length === 0) return false;
  const t = trash[0];
  // Create new thumbnail entry
  await db.insert(thumbnails).values({
    userId: t.userId,
    prompt: t.prompt || "Restauré",
    style: t.style || "viral",
    imageUrl: t.imageUrl || "",
    status: "completed",
    creditsUsed: 0,
  });
  await db.delete(trashedThumbnails).where(eq(trashedThumbnails.id, trashId));
  return true;
}

export async function emptyTrash(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(trashedThumbnails).where(eq(trashedThumbnails.userId, userId));
}

// === API Keys ===
export async function getApiKeysByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.isActive, "active"))).orderBy(desc(apiKeys.createdAt));
  return rows.map(({ key: _storedHash, ...row }) => ({ ...row, key: "••••••••" }));
}

export async function createApiKey(userId: number, name: string, expiryMonths?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const key = `minia-${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const expiresAt = expiryMonths ? new Date(Date.now() + expiryMonths * 30 * 24 * 3600 * 1000) : null;
  await db.insert(apiKeys).values({ userId, name, key: keyHash, isActive: "active", expiresAt });
  const [result] = await db.select({ id: apiKeys.id }).from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.key, keyHash))).limit(1);
  return { id: result?.id ?? 0, key };
}

export async function revokeApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(apiKeys).set({ isActive: "revoked" }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  return true;
}

export async function deleteApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  return true;
}

/** Find active legacy plaintext keys (the old format started with `minia-`). */
export async function getLegacyApiKeySummary() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: apiKeys.id, userId: apiKeys.userId, name: apiKeys.name, createdAt: apiKeys.createdAt })
    .from(apiKeys)
    .where(and(eq(apiKeys.isActive, "active"), like(apiKeys.key, "minia-%")));
}

/** Revoke active legacy plaintext keys and return affected records for notification. */
export async function migrateLegacyApiKeys() {
  const db = await getDb();
  if (!db) return [];
  const legacy = await getLegacyApiKeySummary();
  if (legacy.length === 0) return [];
  await db.update(apiKeys).set({ isActive: "revoked" })
    .where(and(eq(apiKeys.isActive, "active"), like(apiKeys.key, "minia-%")));
  return legacy;
}

export async function createAdminAuditLog(data: {
  actorUserId: number;
  action: "legacy_keys_revoked" | "users_notified";
  targetUserId?: number;
  details?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(adminAuditLogs).values(data);
  return { id: Number(result.insertId) };
}

export async function getAdminAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(Math.min(limit, 250));
}

// === Notifications ===
export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function getUnreadCountByUserId(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const results = await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, "unread")));
  return results.length;
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: "read" }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function getRecentUnreadNotifications(userId: number, limit: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, "unread" as any)))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows;
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: "read" }).where(eq(notifications.userId, userId));
}

export async function createNotification(data: { userId: number; title: string; message?: string; type?: string; metadata?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: (data.type || "system") as any,
    ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
  });
}

// === Admin ===
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return {
    totalUsers: 0, totalThumbnails: 0, totalCredits: 0, totalTemplates: 0,
    activeUsers: 0, totalAvatars: 0, totalEndCards: 0, totalApiKeys: 0,
  };

  const userCount = await db.select({ count: users.id }).from(users);
  const thumbCount = await db.select({ count: thumbnails.id }).from(thumbnails);
  const creditsCount = await db.select().from(userCredits);
  const templateCount = await db.select({ count: templates.id }).from(templates);
  const avatarCount = await db.select({ count: avatars.id }).from(avatars);
  const endCardCount = await db.select({ count: endCards.id }).from(endCards);
  const apiKeyCount = await db.select({ count: apiKeys.id }).from(apiKeys);

  // Active users = signed in within last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeResult = await db.select({ count: users.id }).from(users)
    .where(eq(users.lastSignedIn, users.lastSignedIn)); // placeholder, will filter client-side

  const totalCredits = creditsCount.reduce((acc, c) => acc + (c.credits || 0), 0);

  return {
    totalUsers: userCount.length,
    totalThumbnails: thumbCount.length,
    totalCredits,
    totalTemplates: templateCount.length,
    activeUsers: 0, // will be computed
    totalAvatars: avatarCount.length,
    totalEndCards: endCardCount.length,
    totalApiKeys: apiKeyCount.length,
  };
}

/** Operational snapshot used by the Super Admin support console. */
export async function getAdminOperations() {
  const db = await getDb();
  if (!db) return { database: "unavailable" as const, checkedAt: new Date(), failedGenerations: [], recentCredits: [] };
  const failedGenerations = await db.select({ id: thumbnails.id, userId: thumbnails.userId, prompt: thumbnails.prompt, style: thumbnails.style, updatedAt: thumbnails.updatedAt })
    .from(thumbnails).where(eq(thumbnails.status, "failed")).orderBy(desc(thumbnails.updatedAt)).limit(25);
  const recentCredits = await db.select().from(creditLedger).orderBy(desc(creditLedger.createdAt)).limit(25);
  return { database: "ok" as const, checkedAt: new Date(), failedGenerations, recentCredits };
}

export async function getUserSupportSnapshot(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) return null;
  const credits = await getUserCredits(userId);
  const userThumbnails = await db.select({ id: thumbnails.id, status: thumbnails.status, prompt: thumbnails.prompt, createdAt: thumbnails.createdAt, updatedAt: thumbnails.updatedAt })
    .from(thumbnails).where(eq(thumbnails.userId, userId)).orderBy(desc(thumbnails.createdAt)).limit(20);
  const apiKeyRows = await db.select({ id: apiKeys.id, name: apiKeys.name, isActive: apiKeys.isActive, createdAt: apiKeys.createdAt, expiresAt: apiKeys.expiresAt })
    .from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt)).limit(20);
  const unreadNotifications = await getUnreadCountByUserId(userId);
  const ledger = await listCreditLedger(userId);
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role, lastSignedIn: user.lastSignedIn }, credits, thumbnails: userThumbnails, apiKeys: apiKeyRows, unreadNotifications, creditHistory: ledger };
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return true;
}

export async function updateUserCredits(userId: number, credits: number) {
  const db = await getDb();
  if (!db) return false;
  // Ensure credits record exists
  const existing = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(userCredits).values({ userId, credits, planType: "free" });
  } else {
    await db.update(userCredits).set({ credits }).where(eq(userCredits.userId, userId));
  }
  return true;
}

export async function updateUserPlan(userId: number, planType: "free" | "pro" | "max") {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(userCredits).values({ userId, credits: 0, planType });
  } else {
    await db.update(userCredits).set({ planType }).where(eq(userCredits.userId, userId));
  }
  return true;
}

export async function sendGlobalNotification(title: string, message?: string, type: "system" | "credit" | "generation" | "team" = "system") {
  const db = await getDb();
  if (!db) return false;
  const allUsers = await db.select({ id: users.id }).from(users);
  for (const user of allUsers) {
    await db.insert(notifications).values({
      userId: user.id,
      title,
      message: message || "",
      type: type as any,
      isRead: "unread",
    });
  }
  return true;
}

// === Template customizations ===
export async function createTemplateCustomization(data: InsertTemplateCustomization) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(templateCustomizations).values(data);
  return { id: result.insertId };
}

export async function updateTemplateCustomization(id: number, userId: number, data: Partial<InsertTemplateCustomization>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(templateCustomizations).set(data)
    .where(and(eq(templateCustomizations.id, id), eq(templateCustomizations.userId, userId)));
}

export async function deleteTemplateCustomization(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(templateCustomizations)
    .where(and(eq(templateCustomizations.id, id), eq(templateCustomizations.userId, userId)));
}

// === Image versions ===
export async function createImageVersion(data: InsertImageVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(imageVersions).values(data);
  return { id: result.insertId };
}

export async function deleteImageVersion(id: number, userId: number, thumbnailId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(imageVersions).where(and(
    eq(imageVersions.id, id),
    eq(imageVersions.userId, userId),
    eq(imageVersions.thumbnailId, thumbnailId),
  ));
}

// === A/B tests ===
export async function createAbTest(data: InsertAbTest) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(abTests).values(data);
  return { id: result.insertId };
}

export async function updateAbTest(id: number, userId: number, data: Partial<InsertAbTest>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(abTests).set(data)
    .where(and(eq(abTests.id, id), eq(abTests.userId, userId)));
}

export async function deleteAbTest(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(abTests).where(and(eq(abTests.id, id), eq(abTests.userId, userId)));
}

export async function getAbTestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(abTests).where(eq(abTests.id, id)).limit(1);
  return result[0];
}

export async function getAbTestByShareToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(abTests).where(eq(abTests.shareToken, token)).limit(1);
  return result[0];
}

export async function setAbTestShareToken(id: number, userId: number, token: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(abTests).set({ shareToken: token }).where(and(eq(abTests.id, id), eq(abTests.userId, userId)));
}

// === YouTube scheduling ===

export async function getThumbnailsByUserIdFiltered(params: {
  userId: number;
  query?: string;
  style?: string;
  youtubeStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(thumbnails.userId, params.userId)];
  if (params.query && params.query.trim().length > 0) {
    const q = `%${params.query.trim()}%`;
    conditions.push(
      or(like(thumbnails.prompt, q), like(thumbnails.youtubeTitle, q)) ?? like(thumbnails.prompt, q),
    );
  }
  if (params.style && params.style !== "all") {
    conditions.push(eq(thumbnails.style, params.style));
  }
  if (params.youtubeStatus && params.youtubeStatus !== "all") {
    conditions.push(eq(thumbnails.youtubeStatus, params.youtubeStatus as "unplanned" | "planned"));
  }
  if (params.dateFrom) conditions.push(gte(thumbnails.createdAt, params.dateFrom));
  if (params.dateTo) conditions.push(lte(thumbnails.createdAt, params.dateTo));

  return db.select().from(thumbnails)
    .where(and(...conditions))
    .orderBy(desc(thumbnails.createdAt))
    .limit(params.limit ?? 100)
    .offset(params.offset ?? 0);
}

export async function setThumbnailYoutube(id: number, userId: number, data: { youtubeTitle?: string | null; youtubeStatus?: "unplanned" | "planned" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(thumbnails).set(data).where(and(eq(thumbnails.id, id), eq(thumbnails.userId, userId)));
}

// === Organizations ===

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function getOrCreateOrganization(ownerId: number) {
  const db = await getDb();
  if (!db) return null;
  let org = await db.select().from(organizations).where(eq(organizations.ownerId, ownerId)).limit(1);
  if (org.length === 0) {
    const owner = (await db.select().from(users).where(eq(users.id, ownerId)).limit(1))[0];
    const baseName = owner?.name || owner?.email?.split("@")[0] || "Mon organisation";
    const baseSlug = slugify(baseName) || `org-${ownerId}`;
    const rand = Math.random().toString(36).slice(2, 8);
    const slug = `${baseSlug}-${rand}`;
    const [result] = await db.insert(organizations).values({
      ownerId,
      name: baseName,
      slug,
      description: `Organisation pour ${owner?.email || "le compte"}`,
    });
    const created = await db.select().from(organizations).where(eq(organizations.id, result.insertId)).limit(1);
    org = created;
  }
  return org[0];
}

export async function updateOrganization(ownerId: number, data: { name?: string; slug?: string; description?: string; logoUrl?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(organizations).set(data).where(eq(organizations.ownerId, ownerId));
}

export async function getOrgMembers(org: { id: number; ownerId: number }) {
  const db = await getDb();
  if (!db) return [];
  const owner = await db.select().from(users).where(eq(users.id, org.ownerId)).limit(1);
  const members = await db.select().from(teamMembers).where(eq(teamMembers.ownerId, org.ownerId));
  const rows = [];
  rows.push({
    userId: org.ownerId,
    name: owner[0]?.name || owner[0]?.email || "Propriétaire",
    email: owner[0]?.email,
    role: "propriétaire" as const,
  });
  for (const m of members) {
    const u = (await db.select().from(users).where(eq(users.id, m.userId)).limit(1))[0];
    rows.push({
      userId: m.userId,
      name: u?.name || u?.email || "Membre",
      email: u?.email,
      role: m.role as "member" | "admin",
    });
  }
  return rows;
}

export async function removeOrgMember(orgOwner: number, targetId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(teamMembers).where(and(eq(teamMembers.ownerId, orgOwner), eq(teamMembers.userId, targetId)));
  return true;
}

// === Team invitations ===

export async function sendOrgInvitation(data: { orgId: number; orgOwner: number; email: string; role: "member" | "admin" }) {
  const db = await getDb();
  if (!db) return false;
  const org = (await db.select().from(organizations).where(eq(organizations.ownerId, data.orgOwner)).limit(1))[0];
  if (!org) return false;
  const existing = await db.select().from(teamInvitations)
    .where(and(eq(teamInvitations.email, data.email.toLowerCase()), eq(teamInvitations.status, "pending")))
    .limit(1);
  if (existing.length > 0) return false;
  const target = (await db.select().from(users).where(eq(users.email, data.email.toLowerCase())).limit(1))[0];
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(teamInvitations).values({
    orgId: org.id,
    email: data.email.toLowerCase(),
    role: data.role,
    invitedBy: data.orgOwner,
    invitedTo: target?.id ?? null,
    expiresAt,
  });
  return true;
}

export async function getReceivedInvitations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user?.email) return [];
  const invites = await db.select().from(teamInvitations)
    .where(and(eq(teamInvitations.email, user.email.toLowerCase()), eq(teamInvitations.status, "pending")));
  const enriched = [];
  for (const inv of invites) {
    const org = (await db.select().from(organizations).where(eq(organizations.id, inv.orgId)).limit(1))[0];
    const inviter = (await db.select().from(users).where(eq(users.id, inv.invitedBy)).limit(1))[0];
    if (org) enriched.push({ ...inv, orgName: org.name, orgSlug: org.slug, inviterName: inviter?.name || inviter?.email || "Quelqu'un" });
  }
  return enriched;
}

export async function getSentInvitations(orgOwner: number) {
  const db = await getDb();
  if (!db) return [];
  const org = (await db.select().from(organizations).where(eq(organizations.ownerId, orgOwner)).limit(1))[0];
  if (!org) return [];
  const invites = await db.select().from(teamInvitations).where(eq(teamInvitations.orgId, org.id)).orderBy(teamInvitations.createdAt);
  return invites.map(inv => ({ ...inv, orgName: org.name }));
}

export async function acceptInvitation(id: number, userId: number) {
  const db = await getDb();
  if (!db) return { ok: false, error: "" };
  const invite = (await db.select().from(teamInvitations).where(eq(teamInvitations.id, id)).limit(1))[0];
  if (!invite) return { ok: false, error: "Invitation introuvable" };
  if (invite.status !== "pending") return { ok: false, error: "Invitation déjà traitée" };
  if (invite.expiresAt < new Date()) return { ok: false, error: "Invitation expirée" };
  const recipient = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!recipient?.email || recipient.email.toLowerCase() !== invite.email.toLowerCase()) {
    return { ok: false, error: "Cette invitation ne vous est pas destinée" };
  }
  const org = (await db.select().from(organizations).where(eq(organizations.id, invite.orgId)).limit(1))[0];
  if (!org) return { ok: false, error: "Organisation introuvable" };
  // Join the org team
  await db.insert(teamMembers).values({ ownerId: org.ownerId, userId, role: invite.role }).onDuplicateKeyUpdate({ set: { role: invite.role } });
  await db.update(teamInvitations).set({ status: "accepted" }).where(eq(teamInvitations.id, id));
  return { ok: true };
}

export async function declineInvitation(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user?.email) return false;
  const result = await db.update(teamInvitations).set({ status: "declined" })
    .where(and(eq(teamInvitations.id, id), eq(teamInvitations.status, "pending"), eq(teamInvitations.email, user.email.toLowerCase())));
  return getAffectedRows(result) === 1;
}

export async function cancelSentInvitation(id: number, orgOwner: number) {
  const db = await getDb();
  if (!db) return false;
  const invite = (await db.select().from(teamInvitations).where(eq(teamInvitations.id, id)).limit(1))[0];
  if (!invite) return false;
  const org = (await db.select().from(organizations).where(eq(organizations.ownerId, orgOwner)).limit(1))[0];
  if (!org || invite.orgId !== org.id) return false;
  await db.update(teamInvitations).set({ status: "declined" }).where(eq(teamInvitations.id, id));
  return true;
}

// === A/B test collaborative contributions ===

export async function addAbTestContribution(data: { abTestId: number; userId: number; orgId?: number; variant: "a" | "b"; views: number; clicks: number; channelName?: string; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(abTestContributions).values({
    abTestId: data.abTestId,
    userId: data.userId,
    orgId: data.orgId ?? null,
    variant: data.variant,
    views: Math.max(0, data.views),
    clicks: Math.max(0, data.clicks),
    channelName: data.channelName ?? null,
    note: data.note ?? null,
  });
  return { id: result.insertId };
}

export async function getAbTestContributions(abTestId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(abTestContributions)
    .where(eq(abTestContributions.abTestId, abTestId))
    .orderBy(desc(abTestContributions.createdAt));
  const enriched = [];
  for (const c of rows) {
    const u = (await db.select().from(users).where(eq(users.id, c.userId)).limit(1))[0];
    enriched.push({ ...c, contributorName: u?.name || u?.email || "Contributeur", contributorEmail: u?.email });
  }
  return enriched;
}

export async function deleteAbTestContribution(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(abTestContributions).where(and(eq(abTestContributions.id, id), eq(abTestContributions.userId, userId)));
  return true;
}

// === Global search (multi-page) ===

export async function globalSearch(userId: number, query: string, params: { limit?: number } = {}) {
  const db = await getDb();
  if (!db) return { thumbnails: [], favorites: [], gallery: [], trash: [] };
  const q = `%${query.trim()}%`;
  const limit = params.limit ?? 25;

  // User history: prompt + youtubeTitle
  const thumbs = await db.select().from(thumbnails)
    .where(and(eq(thumbnails.userId, userId), or(like(thumbnails.prompt, q), like(thumbnails.youtubeTitle, q)) ?? like(thumbnails.prompt, q)))
    .orderBy(desc(thumbnails.createdAt))
    .limit(limit);

  // Favorites (filter client-side on prompt / youtubeTitle)
  const favs = await db.select().from(favorites).where(eq(favorites.userId, userId)).limit(200);
  const matchText = (text: string | null) =>
    text ? text.toLowerCase().includes(query.trim().toLowerCase()) : false;
  const favThumbs = [];
  for (const f of favs) {
    const t = await getThumbnailById(f.thumbnailId);
    if (t && (matchText(t.prompt) || matchText(t.youtubeTitle))) {
      favThumbs.push({ ...t, favoritedAt: f.createdAt });
    }
  }

  // Public gallery
  const gallery = await db.select().from(thumbnails)
    .where(and(eq(thumbnails.status, "completed"), or(like(thumbnails.prompt, q), like(thumbnails.youtubeTitle, q)) ?? like(thumbnails.prompt, q)))
    .orderBy(desc(thumbnails.createdAt))
    .limit(limit);

  // Trash
  const trash = await db.select().from(trashedThumbnails)
    .where(and(eq(trashedThumbnails.userId, userId), like(trashedThumbnails.prompt, q)))
    .limit(limit);

  return { thumbnails: thumbs, favorites: favThumbs, gallery, trash };
}

// === Published schedules (planning reminders) ===

export async function createPublishedSchedule(data: { userId: number; thumbnailId: number; youtubeTitle: string; scheduledAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(publishedSchedules).values({
    userId: data.userId,
    thumbnailId: data.thumbnailId,
    youtubeTitle: data.youtubeTitle,
    scheduledAt: data.scheduledAt,
  });
  return { id: result.insertId };
}

export async function deletePublishedSchedule(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(publishedSchedules).where(and(eq(publishedSchedules.id, id), eq(publishedSchedules.userId, userId)));
  return true;
}

export async function getScheduleByIdWithCheck(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(publishedSchedules)
    .where(and(eq(publishedSchedules.id, id), eq(publishedSchedules.userId, userId)));
  return row;
}

export async function updatePublishedSchedule(id: number, userId: number, data: { youtubeTitle?: string; scheduledAt?: Date }) {
  const db = await getDb();
  if (!db) return false;
  await db.update(publishedSchedules)
    .set({ ...(data.youtubeTitle !== undefined ? { youtubeTitle: data.youtubeTitle } : {}), ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}) })
    .where(and(eq(publishedSchedules.id, id), eq(publishedSchedules.userId, userId)));
  return true;
}

export async function getUpcomingSchedules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(publishedSchedules)
    .where(and(eq(publishedSchedules.userId, userId), gte(publishedSchedules.scheduledAt, new Date())))
    .orderBy(publishedSchedules.scheduledAt)
    .limit(10);
  // Attach thumbnail image
  const enriched = [];
  for (const s of rows) {
    const t = await getThumbnailById(s.thumbnailId);
    if (t) enriched.push({ ...s, imageUrl: t.imageUrl, style: t.style });
  }
  return enriched;
}

// === Planning reminders (J-1 notifications) ===

export async function getRemindersToFire(before: Date) {
  const db = await getDb();
  if (!db) return [];
  // Schedules whose publication time is within 24h (future <= before) and not yet reminded
  return db.select().from(publishedSchedules)
    .where(and(gte(publishedSchedules.scheduledAt, new Date()), lte(publishedSchedules.scheduledAt, before), eq(publishedSchedules.reminded, 0)))
    .orderBy(publishedSchedules.scheduledAt);
}

export async function markScheduleReminded(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(publishedSchedules).set({ reminded: 1 }).where(eq(publishedSchedules.id, id));
  return true;
}

// === Planning reminders J-5 (notifications 5 jours avant publication) ===

export async function getJ5RemindersToFire() {
  const db = await getDb();
  if (!db) return [];
  // Schedules whose publication time is within 4–5 days (4d..6d from now) and not yet reminded
  const from = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const before = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
  return db.select().from(publishedSchedules)
    .where(and(gte(publishedSchedules.scheduledAt, from), lt(publishedSchedules.scheduledAt, before), eq(publishedSchedules.remindedJ5, 0)))
    .orderBy(publishedSchedules.scheduledAt);
}

export async function markScheduleJ5Reminded(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(publishedSchedules).set({ remindedJ5: 1 }).where(eq(publishedSchedules.id, id));
  return true;
}

// === Low credit alerts (email-style in-app when balance <= 5) ===

export async function getUsersWithLowCredits(threshold = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userCredits)
    .where(and(lte(userCredits.credits, threshold), eq(userCredits.notifiedLowCredit, 0)));
}

export async function markLowCreditNotified(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(userCredits).set({ notifiedLowCredit: 1 }).where(eq(userCredits.userId, userId));
  return true;
}

export async function getSchedulesByMonth(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const rows = await db.select().from(publishedSchedules)
    .where(and(eq(publishedSchedules.userId, userId), gte(publishedSchedules.scheduledAt, start), lt(publishedSchedules.scheduledAt, end)))
    .orderBy(publishedSchedules.scheduledAt);
  const enriched = [];
  for (const s of rows) {
    const t = await getThumbnailById(s.thumbnailId);
    enriched.push({ ...s, imageUrl: t?.imageUrl ?? null });
  }
  return enriched;
}

export async function getThumbnailByIdWithCheck(id: number, userId?: number) {
  const t = await getThumbnailById(id);
  if (!t) return undefined;
  if (userId !== undefined && t.userId !== userId) return undefined;
  return t;
}

// === Credit pack purchases (simulated payments, ready for Stripe later) ===

export async function listCreditPackPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(creditPackPurchases)
    .where(eq(creditPackPurchases.userId, userId))
    .orderBy(desc(creditPackPurchases.createdAt))
    .limit(50);
}

export async function createCreditPackPurchase(insert: InsertCreditPackPurchase) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(creditPackPurchases).values(insert);
  const insertId = (result as unknown as { insertId: number }).insertId;
  const rows = await db.select().from(creditPackPurchases).where(eq(creditPackPurchases.id, insertId)).limit(1);
  return rows[0] ?? null;
}

// === Testimonials (real user reviews, moderated) ===

export async function listApprovedTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.verified, "approved"))
    .orderBy(desc(testimonials.createdAt))
    .limit(50);
}

export async function createTestimonial(insert: InsertTestimonial) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(testimonials).values(insert);
  const insertId = (result as unknown as { insertId: number }).insertId;
  const rows = await db.select().from(testimonials).where(eq(testimonials.id, insertId)).limit(1);
  return rows[0] ?? null;
}

export async function setTestimonialVerified(id: number, verified: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(testimonials).set({ verified }).where(eq(testimonials.id, id));
}

export async function deleteTestimonial(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(testimonials).where(eq(testimonials.id, id));
}

export async function listAllTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(testimonials)
    .orderBy(desc(testimonials.createdAt))
    .limit(100);
}
