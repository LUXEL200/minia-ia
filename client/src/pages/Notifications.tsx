import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import PageHeader from "@/components/PageHeader";
import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  CalendarClock,
  Image as ImageIcon,
} from "lucide-react";

function parseMeta(n: { metadata?: string | null }): { kind?: string; thumbnailId?: number } {
  if (!n.metadata) return {};
  try {
    return JSON.parse(n.metadata);
  } catch {
    return {};
  }
}

function isPlanningReminder(n: { metadata?: string | null }): boolean {
  return parseMeta(n).kind === "planning-reminder";
}

function getThumbId(metadata: string): number | null {
  try {
    return JSON.parse(metadata)?.thumbnailId ?? null;
  } catch {
    return null;
  }
}

export default function NotificationsPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const utils = trpc.useUtils();
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery();
  const markOneRead = trpc.notifications.markRead.useMutation();
  const markAllRead = trpc.notifications.markAllRead.useMutation();

  // Marquage lu optimiste : l'UI se met à jour immédiatement
  const [optimisticRead, setOptimisticRead] = useState<Set<number>>(new Set());

  const handleMarkOneRead = (n: { id: number; isRead?: boolean }) => {
    if (n.isRead || optimisticRead.has(n.id)) return;
    setOptimisticRead(prev => new Set(prev).add(n.id));
    markOneRead.mutate(
      { id: n.id },
      {
        onSuccess: () => {
          utils.notifications.list.invalidate();
          utils.notifications.unreadCount.invalidate();
          utils.notifications.recent.invalidate();
        },
        onError: () => {
          setOptimisticRead(prev => {
            const next = new Set(prev);
            next.delete(n.id);
            return next;
          });
          toast.error("Impossible de marquer comme lue");
        },
      }
    );
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined as any, {
      onSuccess: () => {
        utils.notifications.list.invalidate();
        utils.notifications.unreadCount.invalidate();
        utils.notifications.recent.invalidate();
        toast.success("Toutes les notifications marquées comme lues");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const unread = notifications?.filter((n: any) => !n.isRead);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <PageHeader
          title="Notifications"
          subtitle={unread && unread.length > 0 ? `${unread.length} non lue(s)` : "Tout est à jour"}
          breadcrumb={[{ label: "Notifications" }]}
          right={
            unread && unread.length > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs sm:text-sm transition-colors"
              >
                <CheckCheck size={14} /> <span className="hidden sm:inline">Tout marquer lu</span>
                <span className="sm:hidden">Marquer lu</span>
              </button>
            ) : undefined
          }
        />

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Bell className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucune notification</p>
            <p className="text-sm">Tu seras notifié quand une miniature est prête</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications?.map((n: any) => {
              const isRead = n.isRead || optimisticRead.has(n.id);
              return (
              <div
                key={n.id}
                onClick={() => handleMarkOneRead(n)}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  isRead
                    ? "bg-zinc-950 border-zinc-800"
                    : "bg-zinc-900 border-zinc-700 hover:border-zinc-600 animate-in fade-in slide-in-from-bottom-1 duration-200"
                }`}>
                {isRead ? (
                  <Bell className="text-zinc-500 mt-0.5 shrink-0" size={18} />
                ) : (
                  <BellRing className="text-[#ff0050] mt-0.5 shrink-0 animate-pulse" size={18} />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${isRead ? "text-zinc-400" : "text-white"}`}>
                      {n.message}
                    </p>
                    {isPlanningReminder(n) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#EC4899]/15 text-[10px] font-bold text-[#EC4899]">
                        <CalendarClock className="w-3 h-3" /> J-1
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    {n.createdAt
                      ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })
                      : new Date(n.createdAt).toLocaleString("fr-FR")}
                  </p>
                  {isPlanningReminder(n) && n.metadata && (
                    <Link
                      href={`/editor?imageId=${getThumbId(n.metadata)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Voir la miniature à publier
                    </Link>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
