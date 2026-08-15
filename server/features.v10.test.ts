import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the db helper module used by routers (server/db.ts)
vi.mock("./db", () => ({
  getDb: vi.fn(),
  // Planning (v8 + v10)
  getUpcomingSchedules: vi.fn(),
  createPublishedSchedule: vi.fn(),
  deletePublishedSchedule: vi.fn(),
  getScheduleByIdWithCheck: vi.fn(),
  updatePublishedSchedule: vi.fn(),
  getSchedulesByMonth: vi.fn(),
  // Notifications (v10)
  getRecentUnreadNotifications: vi.fn(),
  getUnreadCountByUserId: vi.fn(),
  markNotificationRead: vi.fn(),
  createNotification: vi.fn(),
  markScheduleReminded: vi.fn(),
  getRemindersToFire: vi.fn(),
  // helpers
  getThumbnailByIdWithCheck: vi.fn(),
}));

import {
  getDb, getScheduleByIdWithCheck, updatePublishedSchedule,
  getSchedulesByMonth, getRecentUnreadNotifications, getUnreadCountByUserId,
  markNotificationRead, createNotification, getRemindersToFire, markScheduleReminded,
  getThumbnailByIdWithCheck,
} from "./db";
import { appRouter } from "./routers";

const user = { id: 1, name: "Test", email: "t@t.com", role: "user", createdAt: new Date() };
const other = { id: 99, name: "Other", email: "o@t.com", role: "user", createdAt: new Date() };

function createCaller(u = user) {
  const dbMock = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
          limit: vi.fn().mockResolvedValue([]),
        }),
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  };
  (getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(dbMock);
  const caller = appRouter.createCaller({ user: u } as never);
  return { caller, dbMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("schedules.update (v10 — édition depuis le calendrier)", () => {
  const futureDate = new Date(Date.now() + 86400000 * 2).toISOString();

  it("updates title for the owner", async () => {
    const { caller } = createCaller();
    (getScheduleByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, thumbnailId: 10, userId: 1 });
    const res = await caller.schedules.update({ id: 1, youtubeTitle: "Nouveau titre" });
    expect(res.success).toBe(true);
    expect(updatePublishedSchedule).toHaveBeenCalledWith(1, 1, { youtubeTitle: "Nouveau titre" });
  });

  it("updates scheduledAt for the owner", async () => {
    const { caller } = createCaller();
    (getScheduleByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, thumbnailId: 10, userId: 1 });
    await caller.schedules.update({ id: 1, scheduledAt: futureDate });
    expect(updatePublishedSchedule).toHaveBeenCalledWith(1, 1, { scheduledAt: expect.any(Date) });
  });

  it("rejects schedule not found / not owned by another user", async () => {
    const { caller } = createCaller();
    (getScheduleByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(caller.schedules.update({ id: 7, youtubeTitle: "x" })).rejects.toThrow();
  });

  it("rejects past scheduled dates", async () => {
    const { caller } = createCaller();
    (getScheduleByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, thumbnailId: 10, userId: 1 });
    await expect(caller.schedules.update({ id: 1, scheduledAt: new Date(Date.now() - 1000).toISOString() })).rejects.toThrow();
  });
});

describe("schedules.listMonth (v9/v10)", () => {
  it("delegates with year and month", async () => {
    const { caller } = createCaller();
    (getSchedulesByMonth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, scheduledAt: futureIso(), youtubeTitle: "t" }]);
    const res = await caller.schedules.listMonth({ year: 2026, month: 8 });
    expect(res).toHaveLength(1);
    expect(getSchedulesByMonth).toHaveBeenCalledWith(1, 2026, 8);
  });
});

const futureIso = () => new Date(Date.now() + 86400000 * 2).toISOString();

describe("notifications.recent + unreadCount (v10 — cloche dynamique)", () => {
  it("returns recent unread notifications", async () => {
    const { caller } = createCaller();
    const notifs = [{ id: 1, title: "Rappel", message: "J-1", metadata: null, isRead: "unread" as const }];
    (getRecentUnreadNotifications as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(notifs);
    const res = await caller.notifications.recent();
    expect(res).toEqual(notifs);
    expect(getRecentUnreadNotifications).toHaveBeenCalledWith(1, 3);
  });

  it("returns unread count for the badge", async () => {
    const { caller } = createCaller();
    (getUnreadCountByUserId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(4);
    const res = await caller.notifications.unreadCount();
    expect(res).toBe(4);
  });

  it("marks a notification read with ownership", async () => {
    const { caller } = createCaller();
    const res = await caller.notifications.markRead({ id: 2 });
    expect(res.success).toBe(true);
    expect(markNotificationRead).toHaveBeenCalledWith(2, 1);
  });
});

describe("reminders.fire (v9/v10 — metadata J-1)", () => {
  it("creates a notification with planning-reminder metadata and marks the schedule reminded", async () => {
    const { caller } = createCaller();
    (getThumbnailByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 10, userId: 1 });
    (getRemindersToFire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 5, userId: 1, thumbnailId: 10, youtubeTitle: "Ma vidéo", scheduledAt: new Date(futureIso()) },
    ]);
    const res = await caller.reminders.fire();
    expect(res.fired).toHaveLength(1);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      metadata: expect.stringContaining("planning-reminder"),
    }));
    const meta = JSON.parse(((createNotification as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as { metadata: string }).metadata);
    expect(meta.kind).toBe("planning-reminder");
    expect(meta.thumbnailId).toBe(10);
    expect(meta.scheduleId).toBe(5);
    expect(markScheduleReminded).toHaveBeenCalledWith(5);
  });
});
