import { and, desc, eq, gte, lte, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, thumbnails, userCredits, InsertThumbnail, thumbnailLikes, teamMembers, teamTasks, favorites, templates, avatars, endCards, trashedThumbnails, apiKeys, notifications, templateCustomizations, imageVersions, abTests, InsertTemplateCustomization, InsertImageVersion, InsertAbTest } from "../drizzle/schema";
import { ENV } from './_core/env';
import { notifyOwner } from "./_core/notification";

let _db: ReturnType<typeof drizzle> | null = null;

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
  const current = await getUserCredits(userId);
  if (!current || current.credits < amount) return false;
  await db.update(userCredits)
    .set({ credits: current.credits - amount })
    .where(eq(userCredits.userId, userId));
  return true;
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

export async function updateTaskStatus(taskId: number, status: "pending" | "reviewing" | "approved" | "rejected" | "cancelled", comment?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (comment) updateData.comment = comment;
  await db.update(teamTasks).set(updateData).where(eq(teamTasks.id, taskId));

  // Send notification on status change
  try {
    await notifyOwner({
      title: `Tâche ${status === "approved" ? "approuvée" : status === "rejected" ? "rejetée" : "mise à jour"}`,
      content: `Une tâche a été ${status === "approved" ? "approuvée" : status === "rejected" ? "rejetée" : "mise à jour"} (ID: ${taskId}).${comment ? ` Commentaire: ${comment}` : ""}`,
    });
  } catch { /* ignore notification errors */ }
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
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const key = `minia-${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`;
  const [result] = await db.insert(apiKeys).values({ userId, name, key, isActive: "active" });
  return { id: result.insertId, key };
}

export async function revokeApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(apiKeys).set({ isActive: "revoked" }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  return true;
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

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: "read" }).where(eq(notifications.userId, userId));
}

export async function createNotification(data: { userId: number; title: string; message?: string; type?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: (data.type || "system") as any,
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
