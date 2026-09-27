import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAdminOperations: vi.fn(),
    getUserSupportSnapshot: vi.fn(),
  };
});

import { getAdminOperations, getUserSupportSnapshot } from "./db";
import { appRouter } from "./routers";

function caller(user: { id: number; isAdminOwner?: boolean } | null) {
  return appRouter.createCaller({
    user: user ? { id: user.id, role: "admin", isAdminOwner: Boolean(user.isAdminOwner) } : null,
  } as never);
}

describe("Super Admin operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuse les diagnostics à un utilisateur non propriétaire", async () => {
    await expect(caller({ id: 2, isAdminOwner: false }).admin.operations()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("retourne le snapshot opérationnel au propriétaire vérifié", async () => {
    (getAdminOperations as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      database: "ok", checkedAt: new Date(), failedGenerations: [], recentCredits: [],
    });
    const result = await caller({ id: 1, isAdminOwner: true }).admin.operations();
    expect(result.database).toBe("ok");
    expect(getAdminOperations).toHaveBeenCalledOnce();
  });

  it("limite la fiche support à une requête propriétaire et rejette un compte absent", async () => {
    (getUserSupportSnapshot as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(caller({ id: 1, isAdminOwner: true }).admin.userSupport({ userId: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(getUserSupportSnapshot).toHaveBeenCalledWith(99);
  });
});
