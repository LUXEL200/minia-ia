import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  BellRing,
  CheckCheck,
  CalendarClock,
  Image as ImageIcon,
  Zap,
  Trash2,
  Users,
  FileText,
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

/** Icône par type de notification (métadonnées kind) */
function notifIcon(n: { metadata?: string | null }) {
  const kind = parseMeta(n).kind;
  if (kind === "planning-reminder") return <CalendarClock className="w-4.5 h-4.5" />;
  if (kind === "generation-ready") return <ImageIcon className="w-4.5 h-4.5" />;
  if (kind === "low-credit") return <Zap className="w-4.5 h-4.5" />;
  if (kind === "team-invite" || kind === "team-task") return <Users className="w-4.5 h-4.5" />;
  return <BellRing className="w-4.5 h-4.5" />;
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const unread = notifications?.filter((n: any) => !n.isRead);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell size={16} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display">Notifications</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unread && unread.length > 0 ? `${unread.length} non lue(s)` : "Tout est à jour"}
              </p>
            </div>
          </div>
          {unread && unread.length > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors"
            >
              <CheckCheck size={14} /> <span className="hidden sm:inline">Tout marquer lu</span>
              <span className="sm:hidden">Marquer lu</span>
            </button>
          ) : undefined}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2 font-medium text-foreground">Aucune notification</p>
            <p className="text-sm">Tu seras notifié quand une miniature est prête, planifiée ou tes crédits sont bas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications?.map((n: any) => {
              const isRead = n.isRead || optimisticRead.has(n.id);
              return (
              <div
                key={n.id}
                onClick={() => handleMarkOneRead(n)}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                  isRead
                    ? "bg-card border-border"
                    : "bg-orange-500/5 border-orange-400/30 hover:border-orange-400/60 animate-in fade-in slide-in-from-bottom-1 duration-200"
                }`}>
                <span className={`mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${isRead ? "bg-muted text-muted-foreground" : "bg-orange-400/15 text-orange-400 animate-pulse"}`}>
                  {notifIcon(n)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${isRead ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                      {n.message}
                    </p>
                    {isPlanningReminder(n) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-400/15 text-[10px] font-bold text-orange-400">
                        <CalendarClock className="w-3 h-3" /> J-1
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {n.createdAt
                      ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })
                      : new Date(n.createdAt).toLocaleString("fr-FR")}
                  </p>
                  {isPlanningReminder(n) && n.metadata && (
                    <Link
                      href={`/editor?imageId=${getThumbId(n.metadata)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
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
