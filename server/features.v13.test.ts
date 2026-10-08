import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("./db", () => ({ getDb: vi.fn(), getRecentUnreadNotifications: vi.fn(), getUnreadCountByUserId: vi.fn(), markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn() }));
import { getDb, getRecentUnreadNotifications, getUnreadCountByUserId, markNotificationRead, markAllNotificationsRead } from "./db";
import { appRouter } from "./routers";
function createCaller(userId: number) { (getDb as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ select: vi.fn(), update: vi.fn(), delete: vi.fn() }); return appRouter.createCaller({ user: { id: userId, role: "user", name: "Test", email: `u${userId}@example.com`, createdAt: new Date() } } as never); }
beforeEach(() => vi.clearAllMocks());
describe("v13 — notification ownership and isolation", () => {
  it("uses the caller id for recent and unread queries", async () => {
    const caller = createCaller(42);
    (getRecentUnreadNotifications as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getUnreadCountByUserId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    await caller.notifications.recent();
    await caller.notifications.unreadCount();
    expect(getRecentUnreadNotifications).toHaveBeenCalledWith(42, 3);
    expect(getUnreadCountByUserId).toHaveBeenCalledWith(42);
  });
  it("never marks another user's notification as read", async () => {
    const caller = createCaller(42);
    await caller.notifications.markRead({ id: 99 });
    expect(markNotificationRead).toHaveBeenCalledWith(99, 42);
    expect(markNotificationRead).not.toHaveBeenCalledWith(99, 7);
  });
  it("marks all notifications only for the caller", async () => {
    const caller = createCaller(42);
    await caller.notifications.markAllRead();
    expect(markAllNotificationsRead).toHaveBeenCalledWith(42);
  });
});
