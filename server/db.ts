import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, thumbnails, userCredits, InsertThumbnail } from "../drizzle/schema";
import { ENV } from './_core/env';

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

export async function getThumbnailsByUserId(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(thumbnails)
    .where(eq(thumbnails.userId, userId))
    .orderBy(desc(thumbnails.createdAt))
    .limit(limit);
}

export async function getThumbnailById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(thumbnails).where(eq(thumbnails.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createThumbnail(data: InsertThumbnail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(thumbnails).values(data);
  return { id: result.insertId };
}

export async function updateThumbnailStatus(id: number, status: "generating" | "completed" | "failed", imageUrl?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (imageUrl) updateData.imageUrl = imageUrl;
  await db.update(thumbnails).set(updateData).where(eq(thumbnails.id, id));
}

// === User Credits ===

export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function ensureUserCredits(userId: number): Promise<{ credits: number; planType: string }> {
  const db = await getDb();
  if (!db) return { credits: 10, planType: "free" };

  const existing = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  // Create default credits on first use
  await db.insert(userCredits).values({ userId, credits: 10, planType: "free" });
  return { credits: 10, planType: "free" };
}

export async function deductCredits(userId: number, amount = 1): Promise<boolean> {
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

/**
 * Get featured thumbnails for the public gallery.
 * Returns completed thumbnails, anonymized (no userId exposed),
 * optionally filtered by style.
 */
export async function getGalleryThumbnails(params: {
  style?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;

  if (params.style && params.style !== "all") {
    const results = await db
      .select({
        id: thumbnails.id,
        imageUrl: thumbnails.imageUrl,
        prompt: thumbnails.prompt,
        style: thumbnails.style,
        createdAt: thumbnails.createdAt,
      })
      .from(thumbnails)
      .where(eq(thumbnails.style, params.style) && eq(thumbnails.status, "completed"))
      .orderBy(desc(thumbnails.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(t => ({
      id: t.id,
      imageUrl: t.imageUrl,
      prompt: t.prompt,
      style: t.style,
      createdAt: t.createdAt,
    }));
  }

  const results = await db
    .select({
      id: thumbnails.id,
      imageUrl: thumbnails.imageUrl,
      prompt: thumbnails.prompt,
      style: thumbnails.style,
      createdAt: thumbnails.createdAt,
    })
    .from(thumbnails)
    .where(eq(thumbnails.status, "completed"))
    .orderBy(desc(thumbnails.createdAt))
    .limit(limit)
    .offset(offset);

  return results.map(t => ({
    id: t.id,
    imageUrl: t.imageUrl,
    prompt: t.prompt,
    style: t.style,
    createdAt: t.createdAt,
  }));
}

/**
 * Get gallery stats (total public thumbnails, styles breakdown)
 */
export async function getGalleryStats() {
  const db = await getDb();
  if (!db) return { total: 0, styles: {} };

  // Count total completed thumbnails
  const totalResult = await db
    .select()
    .from(thumbnails)
    .where(eq(thumbnails.status, "completed"));

  const total = totalResult.length;

  // Count by style
  const styleCounts: Record<string, number> = {};
  for (const t of totalResult) {
    const style = t.style ?? "unknown";
    styleCounts[style] = (styleCounts[style] || 0) + 1;
  }

  return { total, styles: styleCounts };
}
