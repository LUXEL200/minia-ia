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
  createAbTest: vi.fn(),
  updateAbTest: vi.fn(),
  deleteAbTest: vi.fn(),
  getThumbnailById: vi.fn(),
}));

import { getDb, createTemplateCustomization, createImageVersion, createAbTest, updateAbTest, getThumbnailById } from "./db";
import {
  customizationsRouter,
  imageVersionsRouter,
  abTestsRouter,
} from "./routers";
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();
const appRouter = t.router({
  customizations: customizationsRouter,
  imageVersions: imageVersionsRouter,
  abTests: abTestsRouter,
});

function createCaller() {
  const dbMock = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
          limit: vi.fn(),
        }),
        limit: vi.fn(),
      }),
    }),
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
});
