import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getAdminAccess: vi.fn(),
    listScheduledExports: vi.fn(),
  };
});

vi.mock("./_core/heartbeat", () => ({
  createHeartbeatJob: vi.fn(),
  updateHeartbeatJob: vi.fn(),
  deleteHeartbeatJob: vi.fn(),
}));

import { getAdminAccess, listScheduledExports } from "./db";
import { appRouter } from "./routers";

function caller(user: { id: number; isAdminOwner?: boolean } | null) {
  return appRouter.createCaller({
    user: user ? { id: user.id, role: "admin", isAdminOwner: Boolean(user.isAdminOwner) } : null,
    req: { headers: { cookie: "" } },
  } as never);
}

describe("Admin access and scheduled exports", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expose les permissions du propriétaire sans dépendre d’une ligne secondaire", async () => {
    const result = await caller({ id: 1, isAdminOwner: true }).admin.accessMe();
    expect(result).toMatchObject({ owner: true, enabled: true, role: "owner" });
    expect(getAdminAccess).not.toHaveBeenCalled();
  });

  it("expose le rôle secondaire et autorise la lecture des exports", async () => {
    (getAdminAccess as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ enabled: "yes", role: "analyst", permissions: ["reports.view"] });
    (listScheduledExports as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const secondary = caller({ id: 7 });
    expect(await secondary.admin.accessMe()).toMatchObject({ enabled: true, role: "analyst" });
    expect(await secondary.admin.scheduledExports()).toEqual([]);
    expect(listScheduledExports).toHaveBeenCalledWith(7);
  });

  it("refuse la création d’un export sans reports.schedule", async () => {
    (getAdminAccess as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ enabled: "yes", role: "analyst", permissions: ["reports.view"] });
    await expect(caller({ id: 7 }).admin.createScheduledExport({
      email: "reports@example.com", reportType: "metrics", format: "csv", cron: "0 0 9 * * *", filters: {},
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
