import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the db helper module used by routers (server/db.ts)
vi.mock("./db", () => ({
  getDb: vi.fn(),
  // Rappels J-1
  getRemindersToFire: vi.fn(),
  markScheduleReminded: vi.fn(),
  createNotification: vi.fn(),
  // Calendrier mensuel
  getSchedulesByMonth: vi.fn(),
  getUpcomingSchedules: vi.fn(),
  // helpers nécessaires à d'autres procédures mockées ici
  getThumbnailById: vi.fn(),
  getThumbnailByIdWithCheck: vi.fn(),
  createPublishedSchedule: vi.fn(),
  deletePublishedSchedule: vi.fn(),
  globalSearch: vi.fn(),
  getAbTestContributions: vi.fn(),
  addAbTestContribution: vi.fn(),
  deleteAbTestContribution: vi.fn(),
  getAbTestById: vi.fn(),
  getThumbnailsByUserIdFiltered: vi.fn(),
}));

import {
  getDb, getRemindersToFire, markScheduleReminded, createNotification,
  getSchedulesByMonth, getUpcomingSchedules, getThumbnailById,
  getThumbnailByIdWithCheck, createPublishedSchedule, deletePublishedSchedule,
  globalSearch, getAbTestContributions, addAbTestContribution, deleteAbTestContribution,
  getAbTestById, getThumbnailsByUserIdFiltered,
} from "./db";
import { appRouter } from "./routers";

const user = { id: 1, name: "Test", email: "t@t.com", role: "user", createdAt: new Date() };

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

describe("reminders.fire (v9 — rappels J-1)", () => {
  it("creates a notification for each schedule due within 24h", async () => {
    const { caller } = createCaller();
    const dueDate = new Date(Date.now() + 12 * 3600000); // dans 12h → dans la fenêtre
    (getRemindersToFire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 11, userId: 1, thumbnailId: 2, youtubeTitle: "Ma vidéo virale", scheduledAt: dueDate },
    ]);
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 2, userId: 1 });
    (createNotification as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 77 });
    (markScheduleReminded as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await caller.reminders.fire();
    expect(res.fired).toHaveLength(1);
    expect(res.fired[0].title).toBe("Ma vidéo virale");
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        title: "Rappel de planification",
        message: expect.stringMatching(/Ma vidéo virale[\s\S]*demain|demain[\s\S]*Ma vidéo virale/),
        type: "system",
      }),
    );
    expect(markScheduleReminded).toHaveBeenCalledWith(11);
  });

  it("does not fire when no schedule is due", async () => {
    const { caller } = createCaller();
    (getRemindersToFire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await caller.reminders.fire();
    expect(res.fired).toHaveLength(0);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("respects an explicit nowIso input (deterministic tests)", async () => {
    const { caller } = createCaller();
    const fixed = new Date("2026-08-15T10:00:00Z");
    const dueDate = new Date("2026-08-16T09:00:00Z"); // dans la fenêtre de 24h après fixed
    (getRemindersToFire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 12, userId: 1, thumbnailId: 2, youtubeTitle: "Next video", scheduledAt: dueDate },
    ]);
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createNotification as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
    (markScheduleReminded as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await caller.reminders.fire({ nowIso: fixed.toISOString() });
    expect(res.fired).toHaveLength(1);
    // La fenêtre demandée à db doit être fixed + 24h
    expect(getRemindersToFire).toHaveBeenCalledWith(new Date("2026-08-16T10:00:00Z"));
  });

  it("continues on failure for one schedule (other reminders still fire)", async () => {
    const { caller } = createCaller();
    (getRemindersToFire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, userId: 1, thumbnailId: 2, youtubeTitle: "A", scheduledAt: new Date(Date.now() + 3600000) },
      { id: 2, userId: 1, thumbnailId: 3, youtubeTitle: "B", scheduledAt: new Date(Date.now() + 7200000) },
    ]);
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createNotification as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ id: 2 });
    (markScheduleReminded as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await caller.reminders.fire();
    expect(res.fired).toHaveLength(1);
    expect(res.fired[0].title).toBe("B");
    expect(markScheduleReminded).not.toHaveBeenCalledWith(1); // A échoué → non marqué
  });

  it("does not mark a schedule reminded if the notification creation failed", async () => {
    const { caller } = createCaller();
    (getRemindersToFire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, userId: 1, thumbnailId: 2, youtubeTitle: "A", scheduledAt: new Date(Date.now() + 3600000) },
    ]);
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createNotification as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    (markScheduleReminded as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await caller.reminders.fire();
    expect(markScheduleReminded).not.toHaveBeenCalled();
    expect(getRemindersToFire).toHaveBeenCalled();
  });
});

describe("schedules.listMonth (v9 — vue Calendrier)", () => {
  it("returns schedules for the requested month", async () => {
    const { caller } = createCaller();
    (getSchedulesByMonth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, userId: 1, youtubeTitle: "Tuto", scheduledAt: new Date("2026-08-20T10:00:00Z") },
      { id: 2, userId: 1, youtubeTitle: "Vlog", scheduledAt: new Date("2026-08-25T14:00:00Z") },
    ]);
    const res = await caller.schedules.listMonth({ year: 2026, month: 8 });
    expect(res).toHaveLength(2);
    expect(getSchedulesByMonth).toHaveBeenCalledWith(1, 2026, 8);
  });

  it("returns an empty array when nothing is planned", async () => {
    const { caller } = createCaller();
    (getSchedulesByMonth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await caller.schedules.listMonth({ year: 2030, month: 1 });
    expect(res).toEqual([]);
  });

  it("rejects invalid month values (13)", async () => {
    const { caller } = createCaller();
    await expect(caller.schedules.listMonth({ year: 2026, month: 13 })).rejects.toThrow();
  });

  it("rejects invalid year values", async () => {
    const { caller } = createCaller();
    await expect(caller.schedules.listMonth({ year: 1900, month: 6 })).rejects.toThrow();
  });
});

describe("theme reminder guard (publicProcedure)", () => {
  it("reminders.fire is callable without auth session (cron/public endpoint)", async () => {
    const { caller } = createCaller();
    (getRemindersToFire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await caller.reminders.fire();
    expect(res.fired).toEqual([]);
  });
});

describe("schedules CRUD intact after v9 additions", () => {
  it("still lists upcoming schedules", async () => {
    const { caller } = createCaller();
    (getUpcomingSchedules as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await caller.schedules.list();
    expect(res).toEqual([]);
  });

  it("still deletes only own schedules", async () => {
    const { caller } = createCaller();
    (deletePublishedSchedule as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await caller.schedules.delete({ id: 1 });
    expect(deletePublishedSchedule).toHaveBeenCalledWith(1, user.id);
  });

  it("still creates with ownership check", async () => {
    const { caller } = createCaller();
    (getThumbnailByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2, userId: 1, status: "completed", imageUrl: "https://i.png",
    });
    (createPublishedSchedule as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 9 });
    const res = await caller.schedules.create({
      thumbnailId: 2, youtubeTitle: "T", scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(res.id).toBe(9);
  });
});

describe("global search still works (regression guard)", () => {
  it("calls globalSearch with userId and query", async () => {
    const { caller } = createCaller();
    (globalSearch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      thumbnails: [], favorites: [], gallery: [], trash: [],
    });
    const res = await caller.search.global({ query: "test" });
    expect(globalSearch).toHaveBeenCalledWith(1, "test");
    expect(res.gallery).toEqual([]);
  });
});
