import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, thumbnails, userCredits, InsertThumbnail, thumbnailLikes, teamMembers, teamTasks } from "../drizzle/schema";
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
