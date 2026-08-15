import { startLogin } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import {
  Plus, Trash2, Users, Mail, Check, X as XIcon, ListChecks,
  CheckCircle2, XCircle, RotateCcw, Loader2, UserRound, AlertCircle,
} from "lucide-react";

type TabKey = "membres" | "invitations" | "taches";

export default function Personnes() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [tab, setTab] = useState<TabKey>("membres");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteComment, setInviteComment] = useState("");
  const [updatingTask, setUpdatingTask] = useState<number | null>(null);

  const isAuthed = !authLoading && isAuthenticated && !!user;

  const { data: orgMembers } = trpc.org.members.useQuery(undefined, { enabled: isAuthed });
  const { data: received } = trpc.org.receivedInvitations.useQuery(undefined, { enabled: isAuthed });
  const { data: sent } = trpc.org.sentInvitations.useQuery(undefined, { enabled: isAuthed });
  const { data: tasks } = trpc.team.tasks.useQuery(undefined, { enabled: isAuthed });

  const inviteMutation = trpc.org.invite.useMutation({
    onSuccess: () => { toast.success("Invitation envoyée !"); setInviteEmail(""); setInviteComment(""); },
    onError: (err) => toast.error(err.message),
  });
  const acceptInvitation = trpc.org.acceptInvitation.useMutation({
    onSuccess: () => toast.success("Invitation acceptée !"),
    onError: (err) => toast.error(err.message),
  });
  const declineInvitation = trpc.org.declineInvitation.useMutation({
    onSuccess: () => toast.success("Invitation refusée"),
    onError: (err) => toast.error(err.message),
  });
  const cancelSent = trpc.org.cancelInvitation.useMutation({
    onSuccess: () => toast.success("Invitation annulée"),
    onError: (err) => toast.error(err.message),
  });
  const updateTask = trpc.team.updateTask.useMutation({
    onSuccess: () => toast.success("Tâche mise à jour"),
    onError: (err) => toast.error(err.message),
  });

  const handleUpdateTask = (taskId: number, status: "pending" | "reviewing" | "approved" | "rejected" | "cancelled") => {
    setUpdatingTask(taskId);
    updateTask.mutate(
      { taskId, status, comment: inviteComment || undefined },
      { onSettled: () => setUpdatingTask(null) }
    );
  };

  if (authLoading) return null;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-semibold text-white mb-2">Personnes</h1>
          <p className="text-zinc-500 text-sm mb-6">Connecte-toi pour gérer ton équipe et tes collaborations.</p>
          <Button onClick={() => startLogin()} className="w-full py-5 text-base font-medium bg-white text-black hover:bg-white/90 rounded-xl">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  const members = (orgMembers ?? []) as any[];
  const receivedInvites = (received ?? []) as any[];
  const sentInvites = (sent ?? []) as any[];
  const allTasks = (tasks ?? []) as any[];

  const STATUS_STYLE: Record<string, string> = {
    pending: "bg-white/10 text-zinc-300",
    reviewing: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-emerald-500/20 text-emerald-400",
    rejected: "bg-red-500/20 text-red-400",
    cancelled: "bg-zinc-700 text-zinc-400",
  };
  const STATUS_LABEL: Record<string, string> = {
    pending: "En attente",
    reviewing: "En révision",
    approved: "Approuvé",
    rejected: "Rejeté",
    cancelled: "Annulé",
  };
  const INVITE_STATUS_STYLE: Record<string, string> = {
    pending: "bg-white/10 text-zinc-300",
    accepted: "bg-emerald-500/20 text-emerald-400",
    declined: "bg-red-500/20 text-red-400",
  };
  const INVITE_STATUS_LABEL: Record<string, string> = {
    pending: "En attente",
    accepted: "Acceptée",
    declined: "Refusée",
  };

  /** Petit prévisualiseur d'image de tâche : résout l'URL du thumbnail par son id */
  function TaskThumb({ thumbnailId }: { thumbnailId: number }) {
    const { data: thumbs } = trpc.thumbnail.list.useQuery(undefined, { enabled: thumbnailId > 0 });
    const thumb = (thumbs ?? []).find((t: any) => t.id === thumbnailId);
    if (!thumb?.imageUrl) return null;
    return <img src={thumb.imageUrl} alt="Miniature" className="w-full aspect-video object-cover rounded-lg mb-2" />;
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "membres", label: "Membres", count: members.length },
    { key: "invitations", label: "Invitations", count: receivedInvites.length + sentInvites.length },
    { key: "taches", label: "Tâches", count: allTasks.length },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Personnes"
          subtitle="Gère les membres de ton équipe, les invitations et les tâches de validation"
          breadcrumb={[{ label: "Personnes" }]}
          right={
            <button
              onClick={() => { setTab("invitations"); setInviteEmail(""); }}
              className="flex items-center gap-2 bg-[#ff0050] hover:bg-[#e60048] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <Mail size={14} /> <span className="hidden sm:inline">Inviter</span>
            </button>
          }
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-white text-black" : "bg-zinc-950 border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {t.key === "membres" ? <Users size={14} /> : t.key === "invitations" ? <Mail size={14} /> : <ListChecks size={14} />}
              {t.label}
              {typeof t.count === "number" && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab === t.key ? "bg-black/10 text-black" : "bg-white/5 text-zinc-500"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== Membres ===== */}
        {tab === "membres" && (
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-500">
              Les membres sont gérés au niveau de l'organisation. Depuis <span className="text-zinc-300">Organisation → Invitations</span> ou l'onglet Invitations ci-dessus, invite un collaborateur par e-mail.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {user && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium">{user.name || "Moi"}</p>
                      <p className="text-[10px] text-zinc-500">{user.email || ""}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">Moi · {user.role === "admin" ? "Admin" : "Membre"}</span>
                </div>
              )}
              {members.length === 0 && !user && (
                <div className="text-center py-10 text-zinc-500 col-span-2">
                  <UserRound className="mx-auto mb-2" size={32} />
                  <p className="text-xs">Aucun membre pour le moment</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Invitations ===== */}
        {tab === "invitations" && (
          <div className="space-y-5">
            {/* Inviter */}
            <div className="bg-zinc-950 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-medium text-white mb-3 flex items-center gap-2">
                <Mail size={14} className="text-pink-500" /> Inviter un collaborateur
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="E-mail du collaborateur…"
                  className="flex-1 px-3 py-2 rounded-lg bg-black border border-white/10 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/20"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!inviteEmail.includes("@")) { toast.error("Entre une adresse e-mail valide"); return; }
                    inviteMutation.mutate({ email: inviteEmail.trim(), role: "member" });
                  }}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  className="bg-white text-black hover:bg-white/90 rounded-lg h-9 text-xs"
                >
                  {inviteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Envoyer
                </Button>
              </div>
            </div>

            {/* Reçues */}
            <div>
              <h3 className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Invitations reçues ({receivedInvites.length})</h3>
              {receivedInvites.length === 0 ? (
                <div className="text-center py-8 bg-zinc-950 border border-white/10 rounded-xl">
                  <AlertCircle className="mx-auto mb-2 text-zinc-700" size={28} />
                  <p className="text-xs text-zinc-500">Aucune invitation reçue pour le moment</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {receivedInvites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-white/10 rounded-xl">
                      <div>
                        <p className="text-xs text-white">{inv.inviterName || "Un collaborateur"}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {INVITE_STATUS_LABEL[inv.status] ?? inv.status} · {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {inv.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptInvitation.mutate({ id: inv.id })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            <Check size={12} /> Accepter
                          </button>
                          <button
                            onClick={() => declineInvitation.mutate({ id: inv.id })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <XIcon size={12} /> Refuser
                          </button>
                        </div>
                      )}
                      {inv.status !== "pending" && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${INVITE_STATUS_STYLE[inv.status] ?? "bg-white/10 text-zinc-300"}`}>
                          {INVITE_STATUS_LABEL[inv.status] ?? inv.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Envoyées */}
            <div>
              <h3 className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Invitations envoyées ({sentInvites.length})</h3>
              {sentInvites.length === 0 ? (
                <div className="text-center py-8 bg-zinc-950 border border-white/10 rounded-xl">
                  <AlertCircle className="mx-auto mb-2 text-zinc-700" size={28} />
                  <p className="text-xs text-zinc-500">Aucune invitation envoyée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sentInvites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-white/10 rounded-xl">
                      <div>
                        <p className="text-xs text-white">{inv.email}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {INVITE_STATUS_LABEL[inv.status] ?? inv.status} · {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${INVITE_STATUS_STYLE[inv.status] ?? "bg-white/10 text-zinc-300"}`}>
                          {INVITE_STATUS_LABEL[inv.status] ?? inv.status}
                        </span>
                        {inv.status === "pending" && (
                          <button
                            onClick={() => cancelSent.mutate({ id: inv.id })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] bg-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <XIcon size={12} /> Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tâches ===== */}
        {tab === "taches" && (
          <div>
            <p className="text-[11px] text-zinc-500 mb-3">
              Clique sur <span className="text-zinc-300">✓</span> depuis une miniature (Miniatures → valider) pour créer une tâche, puis suis son cycle de validation.
            </p>
            {allTasks.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950 border border-white/10 rounded-xl">
                <ListChecks className="mx-auto mb-2 text-zinc-700" size={32} />
                <p className="text-xs text-zinc-500">Aucune tâche en cours</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-xl bg-zinc-950 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[task.status] ?? "bg-white/10 text-zinc-300"}`}>
                        {STATUS_LABEL[task.status] ?? task.status}
                      </span>
                      <span className="text-[10px] text-zinc-600">{new Date(task.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {task.comment && <p className="text-xs text-zinc-400 mb-2">{task.comment}</p>}
                    {task.thumbnailId > 0 && <TaskThumb thumbnailId={task.thumbnailId} />}
                    <div className="flex gap-1.5 flex-wrap">
                      {task.status !== "approved" && task.status !== "cancelled" && (
                        <button
                          onClick={() => handleUpdateTask(task.id, "approved")}
                          disabled={updatingTask === task.id}
                          className="px-2.5 py-1 rounded-md text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                          {updatingTask === task.id ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          Approuver
                        </button>
                      )}
                      {task.status !== "rejected" && task.status !== "cancelled" && (
                        <button
                          onClick={() => handleUpdateTask(task.id, "rejected")}
                          disabled={updatingTask === task.id}
                          className="px-2.5 py-1 rounded-md text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {updatingTask === task.id ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                          Rejeter
                        </button>
                      )}
                      {task.status === "pending" && (
                        <button
                          onClick={() => handleUpdateTask(task.id, "reviewing")}
                          disabled={updatingTask === task.id}
                          className="px-2.5 py-1 rounded-md text-[10px] bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                        >
                          En révision
                        </button>
                      )}
                      {task.status === "rejected" && (
                        <button
                          onClick={() => handleUpdateTask(task.id, "pending")}
                          disabled={updatingTask === task.id}
                          className="px-2.5 py-1 rounded-md text-[10px] bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3 inline mr-1" /> Reproposer
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateTask(task.id, "cancelled")}
                        disabled={updatingTask === task.id}
                        className="px-2.5 py-1 rounded-md text-[10px] bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition-colors disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
