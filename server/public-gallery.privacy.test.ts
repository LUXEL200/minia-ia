import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getGalleryThumbnails: vi.fn(),
    getGalleryStats: vi.fn(),
    listPublicGalleryAdmin: vi.fn(),
    createPublicGalleryItem: vi.fn(),
  };
});

import { getGalleryThumbnails, getGalleryStats, listPublicGalleryAdmin, createPublicGalleryItem } from "./db";
import { appRouter } from "./routers";

function caller(user: { id: number; isAdminOwner?: boolean } | null) {
  return appRouter.createCaller({
    user: user ? { id: user.id, role: user.isAdminOwner ? "admin" : "user", isAdminOwner: Boolean(user.isAdminOwner) } : null,
    req: { headers: { cookie: "" } },
  } as never);
}

describe("Phase 1 — galerie publique administrée", () => {
  beforeEach(() => vi.clearAllMocks());

  it("utilise la source publicGallery au lieu de lire les miniatures utilisateur", async () => {
    vi.mocked(getGalleryThumbnails).mockResolvedValue([
      { id: 12, imageUrl: "/manus-storage/templates/public-gallery/demo.png", title: "Inspiration", style: "viral", category: "featured", isVisible: 1, sortOrder: 1, createdAt: new Date() },
    ]);
    vi.mocked(getGalleryStats).mockResolvedValue({ total: 1, styles: { viral: 1 } });

    await expect(caller(null).gallery.thumbnails({})).resolves.toHaveLength(1);
    await expect(caller(null).gallery.stats()).resolves.toEqual({ total: 1, styles: { viral: 1 } });
    expect(getGalleryThumbnails).toHaveBeenCalledWith({ limit: 24, offset: 0, sortBy: "recent" });
    expect(getGalleryStats).toHaveBeenCalledOnce();
  });

  it("réserve la lecture de la liste d’administration au propriétaire", async () => {
    vi.mocked(listPublicGalleryAdmin).mockResolvedValue([]);
    await expect(caller({ id: 1, isAdminOwner: true }).admin.publicGallery()).resolves.toEqual([]);
    await expect(caller({ id: 7 }).admin.publicGallery()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("réserve l’écriture de publicGallery au propriétaire Super Admin", async () => {
    vi.mocked(createPublicGalleryItem).mockResolvedValue({ id: 42 });
    const input = { imageUrl: "https://cdn.example.test/admin.png", title: "Admin", style: "viral", category: "featured", isVisible: true, sortOrder: 1 };
    await expect(caller({ id: 1, isAdminOwner: true }).admin.createPublicGallery(input)).resolves.toEqual({ success: true, id: 42 });
    await expect(caller({ id: 7 }).admin.createPublicGallery(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
