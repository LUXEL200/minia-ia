import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getAppSettings: vi.fn(), setAppSetting: vi.fn(), consumeGuestDemoUsage: vi.fn(), refundGuestDemoUsage: vi.fn() };
});

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn(),
  listImageModels: vi.fn(),
}));

import { getAppSettings, setAppSetting, consumeGuestDemoUsage, refundGuestDemoUsage } from "./db";
import { generateImage } from "./_core/imageGeneration";
import { appRouter } from "./routers";

function caller(remoteAddress: string, owner = false) {
  return appRouter.createCaller({
    user: owner ? { id: 1, role: "admin", isAdminOwner: true } : null,
    req: { headers: {}, socket: { remoteAddress } },
  } as never);
}

const defaultSettings = () => ({
  "client.guestDemoEnabled": "yes",
  "client.guestDailyLimit": "2",
  "client.guestGlobalDailyLimit": "100",
  "client.generationEnabled": "yes",
  "client.batchEnabled": "yes",
  "client.freeWatermark": "yes",
});

describe("Démo invitée réelle", () => {
  const usageCounts = new Map<string, number>();
  beforeEach(() => {
    vi.clearAllMocks();
    usageCounts.clear();
    vi.mocked(getAppSettings).mockResolvedValue(defaultSettings());
    vi.mocked(setAppSetting).mockResolvedValue(null);
    vi.mocked(consumeGuestDemoUsage).mockImplementation(async (key, limit) => {
      const count = (usageCounts.get(key) ?? 0) + 1;
      usageCounts.set(key, count);
      return { allowed: count <= limit, count };
    });
    vi.mocked(refundGuestDemoUsage).mockResolvedValue(undefined);
    vi.mocked(generateImage).mockResolvedValue({ url: "https://cdn.example.com/demo.png" });
  });

  it("génère une vraie image et retourne le quota restant", async () => {
    const result = await caller("guest-real-generation").demo.generate({
      prompt: "Une miniature YouTube sur les erreurs de montage vidéo",
      style: "dramatic",
    });
    expect(result).toEqual({ imageUrl: "https://cdn.example.com/demo.png", remaining: 1, globalRemaining: 99 });
    expect(generateImage).toHaveBeenCalledWith(expect.objectContaining({ model: "MODEL_GPT_IMAGE_2", quality: "medium" }));
  });

  it("bloque le troisième essai de la même adresse IP", async () => {
    const guest = caller("guest-rate-limit");
    await guest.demo.generate({ prompt: "Une vidéo sur les astuces de croissance YouTube", style: "viral" });
    await guest.demo.generate({ prompt: "Une vidéo sur les astuces de montage YouTube", style: "viral" });
    await expect(guest.demo.generate({ prompt: "Une vidéo sur les astuces de titres YouTube", style: "viral" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("respecte le verrouillage admin de la démo", async () => {
    vi.mocked(getAppSettings).mockResolvedValue({ ...defaultSettings(), "client.guestDemoEnabled": "no" });
    await expect(caller("guest-disabled").demo.generate({ prompt: "Une miniature sur les nouveautés de YouTube", style: "minimalist" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(generateImage).not.toHaveBeenCalled();
  });

  it("permet au propriétaire de modifier le quota client", async () => {
    await caller("admin-settings", true).admin.updateClientSetting({ key: "client.guestDailyLimit", value: "4" });
    expect(setAppSetting).toHaveBeenCalledWith("client.guestDailyLimit", "4", 1);
  });
});
