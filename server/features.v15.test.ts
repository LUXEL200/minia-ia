import { describe, expect, it, vi, beforeEach } from "vitest";
vi.mock("./db", () => ({
  getDb: vi.fn(),
  listApprovedTestimonials: vi.fn(),
  listAllTestimonials: vi.fn(),
  createTestimonial: vi.fn(),
  setTestimonialVerified: vi.fn(),
  deleteTestimonial: vi.fn(),
}));

import {
  getDb,
  listApprovedTestimonials,
  listAllTestimonials,
  createTestimonial,
  setTestimonialVerified,
  deleteTestimonial as dbDeleteTestimonial,
} from "./db";
import { appRouter } from "./routers";
import type { Testimonial } from "../drizzle/schema";

const mockDb = {
  select: vi.fn(() => ({ from: ({ where: ({ orderBy: ({ limit: vi.fn().mockResolvedValue([]) }) }) }) })),
  insert: vi.fn(() => ({ values: vi.fn(() => Promise.resolve([{ insertId: 42 }])) })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
  delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
};

function makeCaller(user: { id: number; role: string; isAdminOwner?: boolean }) {
  return appRouter.createCaller({
    user: { id: user.id, role: user.role as "user" | "admin", isAdminOwner: Boolean(user.isAdminOwner) },
    req: {} as any,
    res: {} as any,
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  (getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);
  (listApprovedTestimonials as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (listAllTestimonials as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (createTestimonial as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: 42,
    userId: 1,
    content: "Mon avis test V15, très utile pour la communauté !",
    rating: 4,
    authorName: "V15 User",
    authorChannel: null,
    verified: "pending",
    createdAt: new Date(),
  } as Testimonial);
  (setTestimonialVerified as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (dbDeleteTestimonial as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

describe("Testimonials — moderation flow (backend)", () => {
  it("approuved retourne la liste des avis validés (public)", async () => {
    const approved = [{ id: 7, userId: 1, content: "Génial !", rating: 5, verified: "approved", createdAt: new Date() } as Testimonial];
    (listApprovedTestimonials as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(approved);
    const caller = makeCaller({ id: 1, role: "user" });
    const rows = await caller.testimonials.approved();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(7);
    expect(listApprovedTestimonials).toHaveBeenCalledOnce();
  });

  it("un utilisateur connecté peut soumettre un avis (en modération)", async () => {
    const caller = makeCaller({ id: 1, role: "user" });
    const res = await caller.testimonials.create({
      content: "Mon avis test V15, très utile pour la communauté !",
      rating: 4,
      authorName: "V15 User",
    });
    expect(res.success).toBe(true);
    expect(createTestimonial).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, content: expect.stringContaining("Mon avis test"), rating: 4, verified: "pending" })
    );
  });

  it("un avis trop court est rejeté par la validation Zod", async () => {
    const caller = makeCaller({ id: 1, role: "user" });
    await expect(
      caller.testimonials.create({ content: "Court", rating: 5 })
    ).rejects.toThrow();
    expect(createTestimonial).not.toHaveBeenCalled();
  });

  it("une note hors bornes [1-5] est rejetée", async () => {
    const caller = makeCaller({ id: 1, role: "user" });
    await expect(
      caller.testimonials.create({ content: "Un avis correctement long pour passer la validation", rating: 6 })
    ).rejects.toThrow();
  });

  it("si l'utilisateur a déjà un avis validé, la nouvelle soumission repasse en pending", async () => {
    const existing = { id: 9, userId: 1, verified: "approved" } as Testimonial;
    (listApprovedTestimonials as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([existing]);
    const caller = makeCaller({ id: 1, role: "user" });
    await caller.testimonials.create({ content: "Second avis de mise à jour V15, tout aussi utile !", rating: 5 });
    expect(setTestimonialVerified).toHaveBeenCalledWith(9, "pending");
  });

  it("un non-admin ne peut pas approuver un avis (adminProcedure)", async () => {
    const caller = makeCaller({ id: 1, role: "user" });
    await expect(
      caller.testimonials.setVerified({ id: 99, verified: "approved" })
    ).rejects.toThrow();
    expect(setTestimonialVerified).not.toHaveBeenCalled();
  });

  it("l'admin peut approuver, retirer et refuser un avis", async () => {
    const adminCaller = makeCaller({ id: 2, role: "admin", isAdminOwner: true });
    await adminCaller.testimonials.setVerified({ id: 7, verified: "approved" });
    expect(setTestimonialVerified).toHaveBeenCalledWith(7, "approved");
    await adminCaller.testimonials.setVerified({ id: 7, verified: "pending" });
    await adminCaller.testimonials.setVerified({ id: 7, verified: "rejected" });
    expect(setTestimonialVerified).toHaveBeenCalledTimes(3);
  });

  it("l'admin peut supprimer un avis", async () => {
    const adminCaller = makeCaller({ id: 2, role: "admin", isAdminOwner: true });
    await adminCaller.testimonials.delete({ id: 7 });
    expect(dbDeleteTestimonial).toHaveBeenCalledWith(7);
  });

  it("l'admin obtient la liste complète (modération) incluant pending", async () => {
    const all = [
      { id: 1, verified: "pending" },
      { id: 2, verified: "approved" },
      { id: 3, verified: "rejected" },
    ] as Testimonial[];
    (listAllTestimonials as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(all);
    const adminCaller = makeCaller({ id: 2, role: "admin", isAdminOwner: true });
    const rows = await adminCaller.testimonials.list();
    expect(rows).toHaveLength(3);
    expect(listAllTestimonials).toHaveBeenCalledOnce();
  });
});
