import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the db helper module used by routers (server/db.ts)
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getTemplateCustomizationsByUserId: vi.fn(),
  getTemplateCustomizationById: vi.fn(),
  createTemplateCustomization: vi.fn(),
  updateTemplateCustomization: vi.fn(),
  deleteTemplateCustomization: vi.fn(),
  getImageVersionsByThumbnailId: vi.fn(),
  getImageVersionById: vi.fn(),
  createImageVersion: vi.fn(),
  deleteImageVersion: vi.fn(),
  getAbTestsByUserId: vi.fn(),
  getAbTestById: vi.fn(),
  getAbTestByShareToken: vi.fn(),
  setAbTestShareToken: vi.fn(),
  createAbTest: vi.fn(),
  updateAbTest: vi.fn(),
  deleteAbTest: vi.fn(),
  getThumbnailById: vi.fn(),
  getThumbnailsByUserIdFiltered: vi.fn(),
}));

import { getDb, createTemplateCustomization, createImageVersion, createAbTest, updateAbTest, getAbTestById, getThumbnailById, getAbTestByShareToken, setAbTestShareToken, getThumbnailsByUserIdFiltered } from "./db";
import { appRouter } from "./routers";

const limitChain = vi.fn();
const whereChain = vi.fn();

function createCaller() {
  whereChain.mockReturnValue({
    orderBy: vi.fn().mockResolvedValue([]),
    limit: vi.fn(),
  });
  const fromChain = vi.fn().mockReturnValue({
    where: whereChain,
    limit: vi.fn(),
  });
  const dbMock = {
    select: vi.fn().mockImplementation(() => ({ from: fromChain })),
    insert: vi.fn(),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  };
  (getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(dbMock);
  const caller = appRouter.createCaller({
    user: { id: 1, name: "Test", email: "t@t.com", role: "user", createdAt: new Date() },
  } as never);
  return { caller, dbMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("customizationsRouter", () => {
  it("saves a template customization and returns its id", async () => {
    const { caller } = createCaller();
    (createTemplateCustomization as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7 });

    const res = await caller.customizations.create({
      templateId: 3,
      title: "Mon template personnalisé",
      elements: [],
      backgroundColor: "#000000",
    });
    expect(res.id).toBe(7);
    expect(createTemplateCustomization).toHaveBeenCalledWith({
      userId: 1,
      templateId: 3,
      title: "Mon template personnalisé",
      elements: [],
      backgroundColor: "#000000",
    });
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller({ user: null } as never);
    await expect(caller.customizations.list()).rejects.toThrow();
  });
});

describe("thumbnailRouter Phase 3", () => {
  it("keeps text, style and date filters without a planning filter", async () => {
    const { caller } = createCaller();
    (getThumbnailsByUserIdFiltered as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await caller.thumbnail.listFiltered({
      query: "voyage",
      style: "viral",
      dateFrom: "2026-09-01T00:00:00.000Z",
      dateTo: "2026-09-30T23:59:59.999Z",
    });

    expect(getThumbnailsByUserIdFiltered).toHaveBeenCalledWith({
      userId: 1,
      query: "voyage",
      style: "viral",
      dateFrom: new Date("2026-09-01T00:00:00.000Z"),
      dateTo: new Date("2026-09-30T23:59:59.999Z"),
    });
  });
});

describe("imageVersionsRouter", () => {
  it("creates a version for a thumbnail", async () => {
    const { caller } = createCaller();
    (createImageVersion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 42 });

    const res = await caller.imageVersions.create({
      thumbnailId: 5,
      name: "Version 1",
      imageUrl: "data:image/png;base64,abc",
      elements: [],
    });
    expect(res.id).toBe(42);
    expect(createImageVersion).toHaveBeenCalledWith({
      userId: 1,
      thumbnailId: 5,
      name: "Version 1",
      imageUrl: "data:image/png;base64,abc",
      elements: [],
      isCurrent: "no",
    });
  });
});

describe("abTestsRouter", () => {
  it("refuses duplicate variants", async () => {
    const { caller } = createCaller();
    await expect(
      caller.abTests.create({ title: "Test", variantAId: 1, variantBId: 1 })
    ).rejects.toThrow();
  });

  it("refuses when variants are not owned by the user", async () => {
    const { caller } = createCaller();
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, userId: 99 });
    await expect(
      caller.abTests.create({ title: "Test", variantAId: 1, variantBId: 2 })
    ).rejects.toThrow();
  });

  it("creates a test when the user owns both variants", async () => {
    const { caller } = createCaller();
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1, userId: 1 });
    (createAbTest as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 3 });

    const res = await caller.abTests.create({ title: "Comparaison #1", variantAId: 1, variantBId: 2 });
    expect(res.id).toBe(3);
    expect(createAbTest).toHaveBeenCalledWith({
      userId: 1,
      title: "Comparaison #1",
      variantAId: 1,
      variantBId: 2,
    });
  });

  it("allows the owner to update stats and declare a winner", async () => {
    const { caller } = createCaller();
    (updateAbTest as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await caller.abTests.updateStats({
      id: 1,
      viewsA: 1000,
      clicksA: 50,
      winner: "a",
      status: "finished",
    });
    expect(res.success).toBe(true);
    expect(updateAbTest).toHaveBeenCalledWith(1, 1, {
      viewsA: 1000,
      clicksA: 50,
      winner: "a",
      status: "finished",
    });
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller({ user: null } as never);
    await expect(caller.abTests.list()).rejects.toThrow();
  });
  it("auto-closes the test when CTR difference is statistically significant (z >= 1.96)", async () => {
    const { caller, dbMock } = createCaller();
    (updateAbTest as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const setChain = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    limitChain.mockResolvedValue([{ id: 1, userId: 1, status: "running", viewsA: 5000, clicksA: 500, viewsB: 5000, clicksB: 100 }]);
    whereChain.mockReturnValue({ limit: limitChain });
    dbMock.update.mockReturnValue({ set: setChain });

    const res = await caller.abTests.updateStats({
      id: 1,
      viewsA: 5000,
      clicksA: 500,
      viewsB: 5000,
      clicksB: 100,
    });
    expect(res.success).toBe(true);
    // Significant difference (10% vs 2%) → winner "a", status "finished", auto-closed
    expect(setChain).toHaveBeenCalledWith({ winner: "a", status: "finished", autoClosed: 1 });
    expect(dbMock.update).toHaveBeenCalled();
  });
  it("keeps the test running when the CTR difference is not significant", async () => {
    const { caller, dbMock } = createCaller();
    (updateAbTest as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    limitChain.mockResolvedValue([{ id: 1, userId: 1, status: "running", viewsA: 5000, clicksA: 100, viewsB: 5000, clicksB: 105 }]);
    whereChain.mockReturnValue({ limit: limitChain });
    dbMock.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    const res = await caller.abTests.updateStats({
      id: 1,
      viewsA: 5000,
      clicksA: 100,
      viewsB: 5000,
      clicksB: 105,
    });
    expect(res.success).toBe(true);
    // 2.0% vs 2.1% is not significant → no auto-close update
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("generates a 32-char share token when sharing is enabled", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 1 });
    (setAbTestShareToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await caller.abTests.share({ id: 7, enabled: true });
    expect(res.token).toHaveLength(32);
    expect(setAbTestShareToken).toHaveBeenCalledWith(7, 1, res.token);
  });

  it("disables sharing by setting the token to null", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 1 });
    (setAbTestShareToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await caller.abTests.share({ id: 7, enabled: false });
    expect(res.token).toBeNull();
    expect(setAbTestShareToken).toHaveBeenCalledWith(7, 1, null);
  });

  it("refuses sharing a test not owned by the user", async () => {
    const { caller } = createCaller();
    (getAbTestById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, userId: 99 });
    await expect(caller.abTests.share({ id: 7, enabled: true })).rejects.toThrow();
  });

  it("returns an anonymized test by share token (read-only public view)", async () => {
    const { caller } = createCaller();
    (getAbTestByShareToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 7, title: "Test", variantAId: 1, variantBId: 2, viewsA: 100, clicksA: 10, viewsB: 200, clicksB: 10,
    });
    (getThumbnailById as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 1, imageUrl: "https://a.png", prompt: "A", style: "viral", userId: 1 })
      .mockResolvedValueOnce({ id: 2, imageUrl: "https://b.png", prompt: "B", style: "viral", userId: 1 });

    const res = await caller.abTests.getByShareToken({ token: "a".repeat(32) });
    expect(res.title).toBe("Test");
    expect(res.userId).toBeUndefined();
    expect(res.ctrA).toBe(10);
    expect(res.ctrB).toBe(5);
  });

  it("rejects an invalid share token", async () => {
    const { caller } = createCaller();
    (getAbTestByShareToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await expect(caller.abTests.getByShareToken({ token: "invalid" })).rejects.toThrow();
  });
});
