import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn(), globalSearch: vi.fn() }));
import { getDb, globalSearch } from "./db";
import { appRouter } from "./routers";

const user = { id: 1, name: "Test", email: "t@t.com", role: "user", createdAt: new Date() };
function createCaller() {
  (getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ select: vi.fn(), update: vi.fn(), delete: vi.fn() });
  return appRouter.createCaller({ user } as never);
}
beforeEach(() => vi.clearAllMocks());

describe("global search regression (v9)", () => {
  it("passes the authenticated user id and query", async () => {
    const caller = createCaller();
    (globalSearch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ thumbnails: [], favorites: [], gallery: [], trash: [] });
    const result = await caller.search.global({ query: "test" });
    expect(result.gallery).toEqual([]);
    expect(globalSearch).toHaveBeenCalledWith(1, "test");
  });

  it("rejects an empty query before touching the database", async () => {
    const caller = createCaller();
    await expect(caller.search.global({ query: "" })).rejects.toThrow();
    expect(globalSearch).not.toHaveBeenCalled();
  });
});
