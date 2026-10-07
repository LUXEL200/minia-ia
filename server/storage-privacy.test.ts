import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  canReadPrivateAsset: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: vi.fn() },
}));

import { canReadPrivateAsset } from "./db";
import { sdk } from "./_core/sdk";
import { canReadStorageKey } from "./_core/storageProxy";

const request = { headers: {} } as never;

describe("Phase 1 — isolation du proxy de stockage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bloque l’ancien préfixe generated même pour un utilisateur connecté", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 7 } as never);
    await expect(canReadStorageKey(request, "generated/legacy.png")).resolves.toBe(false);
    expect(canReadPrivateAsset).not.toHaveBeenCalled();
  });

  it("autorise le propriétaire sur son chemin user-images", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 7 } as never);
    vi.mocked(canReadPrivateAsset).mockResolvedValue(true);
    await expect(canReadStorageKey(request, "user-images/7/private.png")).resolves.toBe(true);
    expect(canReadPrivateAsset).toHaveBeenCalledWith(7, 7);
  });

  it("refuse à l’utilisateur A l’URL directe d’une image de B", async () => {
    vi.mocked(sdk.authenticateRequest).mockResolvedValue({ id: 7 } as never);
    vi.mocked(canReadPrivateAsset).mockResolvedValue(false);
    await expect(canReadStorageKey(request, "user-images/99/private.png")).resolves.toBe(false);
    expect(canReadPrivateAsset).toHaveBeenCalledWith(7, 99);
  });

  it("autorise uniquement les assets publics explicitement dédiés", async () => {
    await expect(canReadStorageKey(request, "templates/public-gallery/admin.png")).resolves.toBe(true);
    await expect(canReadStorageKey(request, "user-images/7/private.png")).resolves.toBe(false);
  });
});
