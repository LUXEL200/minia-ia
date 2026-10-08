import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  getDb: vi.fn(),
  getAbTestContributions: vi.fn(),
  addAbTestContribution: vi.fn(),
  deleteAbTestContribution: vi.fn(),
  globalSearch: vi.fn(),
  getAbTestById: vi.fn(),
  getThumbnailById: vi.fn(),
  getThumbnailsByUserIdFiltered: vi.fn(),
}));

import {
  getDb,
  getAbTestContributions,
  addAbTestContribution,
  deleteAbTestContribution,
  globalSearch,
  getAbTestById,
  getThumbnailsByUserIdFiltered,
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
  return { caller: appRouter.createCaller({ user: u } as never), dbMock };
}

beforeEach(() => vi.clearAllMocks());

describe("abTests.contributions (v8 — stats collaboratives)", () => {
  it("lists contributions for the test owner", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 1 });
    (getAbTestContributions as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, abTestId: 7, variant: "a", views: 100, clicks: 5, userId: 1, channelName: "C1" },
      { id: 2, abTestId: 7, variant: "b", views: 200, clicks: 20, userId: 1, channelName: "C2" },
    ]);
    const res = await caller.abTests.contributions.list({ abTestId: 7 });
    expect(res).toHaveLength(2);
    expect(res[0].variant).toBe("a");
  });

  it("rejects listing contributions for another owner", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 99 });
    await expect(caller.abTests.contributions.list({ abTestId: 7 })).rejects.toThrow();
    expect(addAbTestContribution).not.toHaveBeenCalled();
  });

  it("adds a contribution without changing base variants", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 1 });
    (addAbTestContribution as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 5 });
    await caller.abTests.contributions.add({ abTestId: 7, variant: "b", views: 5000, clicks: 400, channelName: "Canal" });
    expect(addAbTestContribution).toHaveBeenCalledWith(expect.objectContaining({ abTestId: 7, variant: "b", views: 5000, clicks: 400, userId: 1 }));
  });

  it("deletes only own contributions", async () => {
    const { caller } = createCaller();
    await caller.abTests.contributions.delete({ contributionId: 5 });
    expect(deleteAbTestContribution).toHaveBeenCalledWith(5, user.id);
  });

  it("aggregates base stats and contributions", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 1, status: "running", viewsA: 1000, clicksA: 100, viewsB: 1000, clicksB: 50 });
    (getAbTestContributions as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ variant: "a", views: 2000, clicks: 400 }, { variant: "b", views: 2000, clicks: 100 }]);
    const agg = await caller.abTests.getAggregated({ abTestId: 7 });
    expect(agg.viewsA).toBe(3000);
    expect(agg.clicksA).toBe(500);
    expect(agg.ctrA).toBeCloseTo(16.7);
    expect(agg.ctrB).toBeCloseTo(5);
    expect(agg.contributionCount).toBe(2);
  });

  it("rejects aggregated access for another owner", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 99 });
    await expect(caller.abTests.getAggregated({ abTestId: 7 })).rejects.toThrow();
  });
});

describe("search.global (v8 — recherche multi-pages)", () => {
  it("searches history, favorites, gallery and trash with the caller user id", async () => {
    const { caller } = createCaller();
    const result = { thumbnails: [{ id: 1, prompt: "requins" }], favorites: [{ id: 3 }], gallery: [{ id: 5 }], trash: [{ id: 9 }] };
    (globalSearch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(result);
    const res = await caller.search.global({ query: "requins" });
    expect(res.thumbnails).toHaveLength(1);
    expect(res.gallery).toHaveLength(1);
    expect(globalSearch).toHaveBeenCalledWith(1, "requins");
  });

  it("rejects empty queries", async () => {
    const { caller } = createCaller();
    await expect(caller.search.global({ query: "" })).rejects.toThrow();
  });
});

describe("thumbnail ownership regression", () => {
  it("uses the authenticated user for filtered history", async () => {
    const { caller } = createCaller();
    (getThumbnailsByUserIdFiltered as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, userId: 1, prompt: "sharks" }]);
    const res = await caller.thumbnail.listFiltered({});
    expect(res).toHaveLength(1);
    expect(getThumbnailsByUserIdFiltered).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }));
  });
});
