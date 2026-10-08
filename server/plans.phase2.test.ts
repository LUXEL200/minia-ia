import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlanDefinition, isQuotaPeriodExpired, isStyleAllowed, PLAN_DEFINITIONS } from "../shared/plans";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    ensureUserCredits: vi.fn(),
    updateUserPlan: vi.fn(),
    createNotification: vi.fn(),
    createApiKey: vi.fn(),
    inviteTeamMember: vi.fn(),
  };
});

import { ensureUserCredits, updateUserPlan, createNotification, createApiKey, inviteTeamMember } from "./db";
import { appRouter } from "./routers";

function caller(user: { id: number; isAdminOwner?: boolean } | null) {
  return appRouter.createCaller({ user, req: { headers: {}, socket: { remoteAddress: "phase2-test" } } } as never);
}

describe("Phase 2 — plans et quotas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureUserCredits).mockResolvedValue({ credits: 5, planType: "free", quotaPeriodStart: new Date() } as never);
    vi.mocked(updateUserPlan).mockResolvedValue(true);
    vi.mocked(createNotification).mockResolvedValue(true as never);
    vi.mocked(createApiKey).mockResolvedValue({ id: 1, name: "test" } as never);
    vi.mocked(inviteTeamMember).mockResolvedValue(true);
  });

  it("expose les trois offres avec les limites du cahier", async () => {
    const catalog = await caller(null).plans.catalog();
    expect(catalog.map(plan => plan.id)).toEqual(["free", "pro", "max"]);
    expect(catalog.find(plan => plan.id === "free")?.features).toContain("5 miniatures au total");
    expect(PLAN_DEFINITIONS.pro.quota).toBe(50);
    expect(PLAN_DEFINITIONS.max.batch).toBe(true);
  });

  it("autorise seulement les styles prévus par chaque plan", () => {
    expect(isStyleAllowed("free", "viral")).toBe(true);
    expect(isStyleAllowed("free", "tech")).toBe(false);
    expect(isStyleAllowed("pro", "retro")).toBe(true);
    expect(isStyleAllowed("max", "style-futur")).toBe(true);
  });

  it("renouvelle les périodes Pro et applique le plafond anti-abus Max", () => {
    const now = new Date("2026-10-08T00:00:00Z");
    expect(isQuotaPeriodExpired(getPlanDefinition("pro"), new Date("2026-09-01T00:00:00Z"), now)).toBe(true);
    expect(isQuotaPeriodExpired(getPlanDefinition("free"), new Date("2020-01-01T00:00:00Z"), now)).toBe(false);
    expect(getPlanDefinition("max").quota).toBe(1000);
  });

  it("refuse à un client de s'attribuer gratuitement Pro ou Max", async () => {
    await expect(caller({ id: 7 }).plans.choose({ planType: "pro" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(updateUserPlan).not.toHaveBeenCalled();
  });

  it("refuse au plan Gratuit les styles avancés et les variations parallèles", async () => {
    await expect(caller({ id: 7 }).thumbnail.generate({ prompt: "Une miniature assez longue pour le test", style: "tech", quantity: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller({ id: 7 }).thumbnail.generate({ prompt: "Une miniature assez longue pour le test", style: "viral", quantity: 2 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("réserve les clés API, invitations et batch au plan Max", async () => {
    await expect(caller({ id: 7 }).apiKeys.create({ name: "clé test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller({ id: 7 }).team.invite({ userId: 9, role: "member" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller({ id: 7 }).batch.generate({ prompts: ["Un brief suffisamment long pour le test"], style: "viral" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createApiKey).not.toHaveBeenCalled();
    expect(inviteTeamMember).not.toHaveBeenCalled();
  });

  it("laisse le propriétaire Super Admin changer de plan pour les tests d'administration", async () => {
    const result = await caller({ id: 1, isAdminOwner: true }).plans.choose({ planType: "max" });
    expect(result).toMatchObject({ success: true, planType: "max", simulated: false });
    expect(updateUserPlan).toHaveBeenCalledWith(1, "max");
  });
});
