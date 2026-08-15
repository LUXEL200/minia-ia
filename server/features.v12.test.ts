import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  getDb: vi.fn(),
  listCreditPackPurchases: vi.fn(),
  createCreditPackPurchase: vi.fn(),
  ensureUserCredits: vi.fn(),
  updateUserCredits: vi.fn(),
  getUserCredits: vi.fn(),
  createNotification: vi.fn(),
}));

import {
  getDb,
  listCreditPackPurchases,
  createCreditPackPurchase,
  ensureUserCredits,
  updateUserCredits,
  getUserCredits,
  createNotification,
} from "./db";
import { appRouter } from "./routers";

function createCaller(user: { id: number; name: string; email: string; role: string } | null) {
  const caller = appRouter.createCaller({ user } as never);
  return caller;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("packs catalog (public)", () => {
  it("returns 4 packs with the right credits/prices", async () => {
    const caller = createCaller(null);
    const catalog = await caller.packs.catalog();
    expect(catalog).toHaveLength(4);
    expect(catalog.map((p) => p.id)).toEqual(["starter", "creator", "pro", "max"]);
    const creator = catalog.find((p) => p.id === "creator");
    expect(creator?.credits).toBe(50);
    expect(creator?.amountCents).toBe(1990);
    expect(creator?.popular).toBe(true);
  });
});

describe("packs purchase (protected)", () => {
  it("records the fake payment, credits the account and notifies", async () => {
    const caller = createCaller({ id: 1, name: "Test", email: "t@t.com", role: "user" });
    (createCreditPackPurchase as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 9,
      userId: 1,
      packId: "creator",
      packLabel: "Pack Créateur",
      creditsGranted: 50,
      amountCents: 1990,
      currency: "EUR",
      status: "completed",
      paymentId: "sim_123_1",
    });
    (ensureUserCredits as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ credits: 4, planType: "free" });
    (updateUserCredits as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getUserCredits as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ credits: 54, planType: "free" });

    const res = await caller.packs.purchase({ packId: "creator" });

    expect(res.success).toBe(true);
    expect(res.credits).toBe(54);
    expect(createCreditPackPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        packId: "creator",
        packLabel: "Pack Créateur",
        creditsGranted: 50,
        amountCents: 1990,
        status: "completed",
      }),
    );
    expect(updateUserCredits).toHaveBeenCalledWith(1, 54);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, type: "credit" }),
    );
  });

  it("rejects unauthenticated users", async () => {
    const caller = createCaller(null);
    await expect(caller.packs.purchase({ packId: "starter" })).rejects.toThrow();
  });

  it("rejects invalid pack ids", async () => {
    const caller = createCaller({ id: 1, name: "Test", email: "t@t.com", role: "user" });
    await expect(
      (caller.packs.purchase as unknown as (input: { packId: string }) => Promise<unknown>)({ packId: "evil" }),
    ).rejects.toThrow();
  });

  it("returns the purchase history of the connected user", async () => {
    const caller = createCaller({ id: 1, name: "Test", email: "t@t.com", role: "user" });
    (listCreditPackPurchases as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 9, userId: 1, packId: "creator", packLabel: "Pack Créateur", creditsGranted: 50, amountCents: 1990 },
    ]);
    const res = await caller.packs.purchases();
    expect(res).toHaveLength(1);
    expect(listCreditPackPurchases).toHaveBeenCalledWith(1);
  });
});
