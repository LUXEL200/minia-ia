import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAdminOperations: vi.fn(),
    getUserSupportSnapshot: vi.fn(),
    getUserEventTimeline: vi.fn(),
    getAdminHistoricalMetrics: vi.fn(),
    resetUserCredits: vi.fn(),
    revokeUserSessions: vi.fn(),
    createAdminAuditLog: vi.fn(),
    createNotification: vi.fn(),
  };
});

import { getAdminOperations, getUserSupportSnapshot, getUserEventTimeline, getAdminHistoricalMetrics, resetUserCredits, revokeUserSessions } from "./db";
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

  it("retourne la timeline détaillée uniquement au propriétaire", async () => {
    (getUserEventTimeline as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "credit-1", timestamp: new Date("2026-09-27T12:00:00Z"), kind: "credit", title: "Crédits consommés", description: "1 crédit" },
      { id: "generation-1", timestamp: new Date("2026-09-20T12:00:00Z"), kind: "generation", title: "Génération terminée", description: "viral" },
    ]);
    const result = await caller({ id: 1, isAdminOwner: true }).admin.userTimeline({ userId: 7, limit: 50, kind: "credit", from: new Date("2026-09-27T00:00:00Z"), to: new Date("2026-09-27T23:59:59Z") });
    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe("credit");
    expect(getUserEventTimeline).toHaveBeenCalledWith(7, 100);
    await expect(caller({ id: 2, isAdminOwner: false }).admin.userTimeline({ userId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("protège les métriques et les actions de support contre un admin non propriétaire", async () => {
    const unauthorized = caller({ id: 2, isAdminOwner: false });
    await expect(unauthorized.admin.historicalMetrics({ days: 14 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(unauthorized.admin.resetCredits({ userId: 7, amount: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(unauthorized.admin.notifyUser({ userId: 7, title: "Test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(unauthorized.admin.revokeSessions({ userId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("retourne les métriques et journalise le reset de crédits propriétaire", async () => {
    (getAdminHistoricalMetrics as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ date: "2026-09-27", activeUsers: 1, generations: 2, successfulGenerations: 1, errors: 1, creditsConsumed: 2 }]);
    (resetUserCredits as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (revokeUserSessions as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const admin = caller({ id: 1, isAdminOwner: true });
    expect((await admin.admin.historicalMetrics({ days: 14 }))[0]?.errors).toBe(1);
    expect(await admin.admin.resetCredits({ userId: 7, amount: 10 })).toMatchObject({ success: true, amount: 10 });
    expect(await admin.admin.revokeSessions({ userId: 7 })).toEqual({ success: true });
    expect(resetUserCredits).toHaveBeenCalledWith(7, 10);
    expect(revokeUserSessions).toHaveBeenCalledWith(7);
  });
});
