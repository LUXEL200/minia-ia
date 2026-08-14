import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
} from "lucide-react";

export default function NotificationsPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery();
  const markAllRead = trpc.notifications.markAllRead.useMutation();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined as any, {
      onSuccess: () => {
        toast.success("Toutes les notifications marquées comme lues");
        refetch();
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Retour au dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {unread && unread.length > 0 ? `${unread.length} non lue(s)` : "Tout est à jour"}
            </p>
          </div>
          {unread && unread.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              <CheckCheck size={16} /> Tout marquer lu
            </button>
          )}
        </div>

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
            {notifications?.map((n: any) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  n.isRead
                    ? "bg-zinc-950 border-zinc-800"
                    : "bg-zinc-900 border-zinc-700"
                }`}
              >
                {n.isRead ? (
                  <Bell className="text-zinc-500 mt-0.5 shrink-0" size={18} />
                ) : (
                  <BellRing className="text-[#ff0050] mt-0.5 shrink-0" size={18} />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${n.isRead ? "text-zinc-400" : "text-white"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {new Date(n.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
