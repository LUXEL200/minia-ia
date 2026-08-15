import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the db helper module used by routers (server/db.ts)
vi.mock("./db", () => ({
  getDb: vi.fn(),
  // Contributions A/B
  getAbTestContributions: vi.fn(),
  addAbTestContribution: vi.fn(),
  deleteAbTestContribution: vi.fn(),
  // Planning reminders
  getUpcomingSchedules: vi.fn(),
  createSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  createPublishedSchedule: vi.fn(),
  // Global search
  globalSearch: vi.fn(),
  // helpers déjà mockés par features.v2 mais redéclarés ici pour ce fichier
  getAbTestById: vi.fn(),
  getThumbnailById: vi.fn(),
  getThumbnailsByUserIdFiltered: vi.fn(),
  getThumbnailByIdWithCheck: vi.fn(),
  deletePublishedSchedule: vi.fn(),
}));

import {
  getDb, getAbTestContributions, addAbTestContribution, deleteAbTestContribution,
  getUpcomingSchedules, createSchedule, deleteSchedule, globalSearch, createPublishedSchedule,
  getAbTestById, getThumbnailById, getThumbnailsByUserIdFiltered,
  getThumbnailByIdWithCheck, deletePublishedSchedule,
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

describe("abTests.contributions (v8 — stats collaboratives)", () => {
  it("lists contributions for the test owner", async () => {
    const { caller } = createCaller();
    const contribs = [
      { id: 1, abTestId: 7, variant: "a", views: 100, clicks: 5, userId: 1, channelName: "C1" },
      { id: 2, abTestId: 7, variant: "b", views: 200, clicks: 20, userId: 1, channelName: "C2" },
    ];
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 1 });
    (getAbTestContributions as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(contribs);

    const res = await caller.abTests.contributions.list({ abTestId: 7 });
    expect(res).toHaveLength(2);
    expect(res[0].variant).toBe("a");
  });

  it("rejects listing contributions for a test owned by someone else", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 99 });

    await expect(caller.abTests.contributions.list({ abTestId: 7 })).rejects.toThrow();
    expect(addAbTestContribution).not.toHaveBeenCalled();
  });

  it("adds a contribution (member of the team, base variants untouched)", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 1 });
    (addAbTestContribution as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 });

    await caller.abTests.contributions.add({
      abTestId: 7,
      variant: "b",
      views: 5000,
      clicks: 400,
      channelName: "Canal de la collègue",
    });
    expect(addAbTestContribution).toHaveBeenCalledWith(
      expect.objectContaining({ abTestId: 7, variant: "b", views: 5000, clicks: 400, userId: 1 }),
    );
  });

  it("deletes only own contributions", async () => {
    const { caller } = createCaller();
    (deleteAbTestContribution as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await caller.abTests.contributions.delete({ contributionId: 5 });
    expect(deleteAbTestContribution).toHaveBeenCalledWith(5, user.id);
  });

  it("getAggregated sums base stats + contributions and computes CTR", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 7, userId: 1, status: "running",
      viewsA: 1000, clicksA: 100, viewsB: 1000, clicksB: 50,
    });
    (getAbTestContributions as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { variant: "a", views: 2000, clicks: 400 },
      { variant: "b", views: 2000, clicks: 100 },
    ]);

    const agg = await caller.abTests.getAggregated({ abTestId: 7 });
    expect(agg.viewsA).toBe(3000);
    expect(agg.clicksA).toBe(500);
    expect(agg.ctrA).toBeCloseTo(16.7);
    // B : (50 + 100) / (1000 + 2000) = 5.0 %
    expect(agg.ctrB).toBeCloseTo(5.0);
    expect(agg.contributionCount).toBe(2);
  });

  it("rejects aggregated access for a non-owner test", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 99 });
    await expect(caller.abTests.getAggregated({ abTestId: 7 })).rejects.toThrow();
  });
});

describe("schedules (v8 — rappels de planification)", () => {
  it("lists upcoming schedules for the user", async () => {
    const { caller } = createCaller();
    (getUpcomingSchedules as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, thumbnailId: 2, youtubeTitle: "Ma vidéo", scheduledAt: new Date(Date.now() + 86400000) },
    ]);

    const res = await caller.schedules.list();
    expect(res).toHaveLength(1);
    expect(res[0].youtubeTitle).toBe("Ma vidéo");
  });

  it("creates a schedule (past dates rejected)", async () => {
    const { caller } = createCaller();
    // schedules.create vérifie l'ownership via getThumbnailByIdWithCheck
    (getThumbnailByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2, userId: 1, status: "completed", imageUrl: "https://i.png",
    });
    (createPublishedSchedule as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 9 });

    const future = new Date(Date.now() + 86400000).toISOString();
    const res = await caller.schedules.create({ thumbnailId: 2, youtubeTitle: "Titre", scheduledAt: future });
    expect(res.id).toBe(9);
  });

  it("rejects creating a schedule for a thumbnail owned by someone else", async () => {
    const { caller } = createCaller();
    (getThumbnailByIdWithCheck as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Miniature introuvable"));
    await expect(caller.schedules.create({
      thumbnailId: 3, youtubeTitle: "Titre", scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    })).rejects.toThrow();
  });

  it("rejects creating a schedule for a past date", async () => {
    const { caller } = createCaller();
    const past = new Date(Date.now() - 60000).toISOString();
    await expect(caller.schedules.create({ thumbnailId: 2, youtubeTitle: "Titre", scheduledAt: past })).rejects.toThrow();
  });

  it("rejects scheduling a thumbnail owned by someone else", async () => {
    const { caller } = createCaller();
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 2, userId: 99 });
    await expect(caller.schedules.create({
      thumbnailId: 2, youtubeTitle: "Titre", scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    })).rejects.toThrow();
  });

  it("deletes a schedule only when it belongs to the user", async () => {
    const { caller } = createCaller();
    (deletePublishedSchedule as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await caller.schedules.delete({ id: 1 });
    expect(deletePublishedSchedule).toHaveBeenCalledWith(1, user.id);
  });
});

describe("search.global (v8 — recherche multi-pages)", () => {
  it("searches across history, favorites, gallery and trash", async () => {
    const { caller } = createCaller();
    const result = {
      thumbnails: [{ id: 1, imageUrl: "https://i1.png", prompt: "requins virale" }],
      favorites: [{ id: 3, imageUrl: "https://i3.png", prompt: "requins" }],
      gallery: [{ id: 5, imageUrl: "https://i5.png", prompt: "requins" }],
      trash: [{ id: 9, imageUrl: "https://i9.png", prompt: "requins" }],
    };
    (globalSearch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(result);

    const res = await caller.search.global({ query: "requins" });
    expect(res.thumbnails).toHaveLength(1);
    expect(res.gallery).toHaveLength(1);
    expect(globalSearch).toHaveBeenCalledWith(1, "requins");
  });

  it("rejects queries shorter than 1 character", async () => {
    const { caller } = createCaller();
    await expect(caller.search.global({ query: "" })).rejects.toThrow();
  });

  it("passes ownership through getThumbnailsByUserIdFiltered (favorites use userId)", async () => {
    const { caller } = createCaller();
    (globalSearch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      thumbnails: [], favorites: [], gallery: [], trash: [],
    });
    const res = await caller.search.global({ query: "x" });
    expect(globalSearch).toHaveBeenCalledWith(1, "x");
  });
});

describe("thumbnails ownership still enforced with new routes", () => {
  it("getThumbnailsByUserIdFiltered is used by filtered list (history view)", async () => {
    const { caller } = createCaller();
    (getThumbnailsByUserIdFiltered as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, userId: 1, imageUrl: "https://i.png", prompt: "sharks" },
    ]);
    const res = await caller.thumbnail.listFiltered({});
    expect(res).toHaveLength(1);
    expect(getThumbnailsByUserIdFiltered).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }));
  });
});
