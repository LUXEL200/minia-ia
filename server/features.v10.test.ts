import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("./db", () => ({ getDb: vi.fn(), getRecentUnreadNotifications: vi.fn(), getUnreadCountByUserId: vi.fn(), markNotificationRead: vi.fn(), createNotification: vi.fn() }));
import { getDb, getRecentUnreadNotifications, getUnreadCountByUserId, markNotificationRead } from "./db";
import { appRouter } from "./routers";
const user = { id: 1, name: "Test", email: "t@t.com", role: "user", createdAt: new Date() };
function createCaller(u = user) { (getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ select: vi.fn(), update: vi.fn(), delete: vi.fn() }); return appRouter.createCaller({ user: u } as never); }
beforeEach(() => vi.clearAllMocks());
describe("notifications.recent + unreadCount (v10)", () => {
  it("returns recent unread notifications", async () => {
    const caller = createCaller();
    const notifs = [{ id: 1, title: "Miniature prête", message: "Prête", metadata: null, isRead: "unread" as const }];
    (getRecentUnreadNotifications as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(notifs);
    expect(await caller.notifications.recent()).toEqual(notifs);
    expect(getRecentUnreadNotifications).toHaveBeenCalledWith(1, 3);
  });
  it("returns the unread count", async () => {
    const caller = createCaller();
    (getUnreadCountByUserId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(4);
    expect(await caller.notifications.unreadCount()).toBe(4);
  });
  it("marks a notification read for the authenticated owner only", async () => {
    const caller = createCaller();
    expect(await caller.notifications.markRead({ id: 2 })).toEqual({ success: true });
    expect(markNotificationRead).toHaveBeenCalledWith(2, 1);
  });
});
