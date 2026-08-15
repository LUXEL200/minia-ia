import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import {
  getNotificationsByUserId,
  getUnreadCountByUserId,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  getRemindersToFire,
  createPublishedSchedule,
} from "./db";
import { eq, and } from "drizzle-orm";
import { notifications, publishedSchedules } from "../drizzle/schema";

const makeCaller = async (userId: number) => {
  return appRouter.createCaller({
    user: { id: userId, role: "user" as const, name: "Test V13", email: "v13test@example.com", credits: 100, plan: "free", orgId: null, createdAt: new Date() },
    db: await getDb(),
    headers: {},
    session: null,
  } as never);
};

let testUserId = 0;

beforeAll(async () => {
  const db = await getDb();
  if (!db) throw new Error("db unavailable");
  // Utiliser un userId arbitraire isolé (aucun enregistrement réel)
  testUserId = 999999;
  await db.delete(notifications).where(eq(notifications.userId, testUserId));
  await db.delete(publishedSchedules).where(eq(publishedSchedules.userId, testUserId));
  // Notifications de test
  await createNotification({
    userId: testUserId,
    type: "generation",
    title: "Miniature prête",
    message: "Ta miniature est prête",
    metadata: "{}",
  });
  await createNotification({
    userId: testUserId,
    type: "system",
    title: "Rappel J-1",
    message: "Publie demain : Ma vidéo",
    metadata: JSON.stringify({ thumbnailId: 1, thumbnailTitle: "Ma vidéo", scheduledAt: new Date().toISOString() }),
  });
  // Planification J+1 (déclenchera le rappel) et J+10 (hors fenêtre)
  await createPublishedSchedule({
    userId: testUserId,
    thumbnailId: 1,
    youtubeTitle: "Vidéo test J+1",
    scheduledAt: new Date(Date.now() + 24 * 3600 * 1000),
  });
  await createPublishedSchedule({
    userId: testUserId,
    thumbnailId: 1,
    youtubeTitle: "Vidéo test J+10",
    scheduledAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
  });
});

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq(notifications.userId, testUserId));
  await db.delete(publishedSchedules).where(eq(publishedSchedules.userId, testUserId));
});

describe("v13 — Notifications et rappels", () => {
  it("list retourne les notifications avec metadata", async () => {
    const caller = await makeCaller(testUserId);
    const list = await caller.notifications.list();
    expect(list.length).toBe(2);
    const reminder = list.find(n => n.metadata?.includes("Ma vidéo"));
    expect(reminder).toBeDefined();
  });

  it("unreadCount reflète les non lues", async () => {
    const count = await getUnreadCountByUserId(testUserId);
    expect(count).toBe(2);
  });

  it("recent retourne les notifications non lues récentes (max 3)", async () => {
    const caller = await makeCaller(testUserId);
    const recent = await caller.notifications.recent();
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.length).toBeLessThanOrEqual(3);
    expect(recent.every(n => n.isRead === "unread")).toBe(true);
  });

  it("markRead marque une notification lue et décrète le compteur", async () => {
    const caller = await makeCaller(testUserId);
    const list = await caller.notifications.list();
    const toMark = list.find(n => n.isRead === "unread")!;
    await markNotificationRead(toMark.id, testUserId);
    const count = await getUnreadCountByUserId(testUserId);
    expect(count).toBe(1);
  });

  it("markAllRead marque tout lu et remet le compteur à 0", async () => {
    const caller = await makeCaller(testUserId);
    await caller.notifications.markAllRead();
    const count = await getUnreadCountByUserId(testUserId);
    expect(count).toBe(0);
    const list = await getNotificationsByUserId(testUserId);
    expect(list.every(n => n.isRead === "read")).toBe(true);
  });

  it("getRemindersToFire cible les planifications à venir dans la fenêtre", async () => {
    // La planification J+1 est dans la fenêtre <= now+24h ; J+10 non.
    const before = new Date(Date.now() + 28 * 3600 * 1000);
    const due = await getRemindersToFire(before);
    const dueTitles = due.map(s => s.youtubeTitle);
    expect(dueTitles).toContain("Vidéo test J+1");
    expect(dueTitles).not.toContain("Vidéo test J+10");
  });

  it("fireReminders crée des notifications de rappel J-1", async () => {
    const caller = await makeCaller(testUserId);
    // Nettoyer les notifs de rappel existantes et réinitialiser reminded pour re-fire
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    await db.delete(notifications).where(and(eq(notifications.userId, testUserId), eq(notifications.type as any, "planning_reminder" as any)));
    await db.update(publishedSchedules).set({ reminded: 0 }).where(eq(publishedSchedules.userId, testUserId));
    const result = await caller.reminders.fire();
    expect(result.fired.length).toBeGreaterThanOrEqual(1);
    const all = await getNotificationsByUserId(testUserId);
    const reminders = all.filter(n => n.message?.includes("demain") || n.metadata?.includes("planning-reminder"));
    expect(reminders.length).toBeGreaterThanOrEqual(1);
  });

  it("getSchedulesByMonth retourne les événements du mois", async () => {
    const caller = await makeCaller(testUserId);
    const now = new Date();
    const month = await caller.schedules.listMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
    expect(month.length).toBeGreaterThanOrEqual(1);
  });
});
