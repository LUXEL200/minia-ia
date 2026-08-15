/**
 * Invitations — deux sections inspirées de Youthumb.ai :
 * « Invitations reçues » (org, inviteur, rôle, actions accepter/refuser) et
 * « Invitations envoyées par l'organisation » (e-mail, rôle, actions annuler),
 * plus un formulaire pour inviter un nouveau membre.
 */
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { UserPlus, Check, X, Building2 } from "lucide-react";

export default function InvitationsPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/dashboard");
  }, [loading, isAuthenticated, navigate]);

  const utils = trpc.useUtils();
  const { data: received, isLoading: receivedLoading } = trpc.org.receivedInvitations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: sent, isLoading: sentLoading } = trpc.org.sentInvitations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: org } = trpc.org.me.useQuery(undefined, { enabled: isAuthenticated });

  const invite = trpc.org.invite.useMutation();
  const cancel = trpc.org.cancelInvitation.useMutation();
  const accept = trpc.org.acceptInvitation.useMutation();
  const decline = trpc.org.declineInvitation.useMutation();

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error("L'e-mail est requis");
      return;
    }
    invite.mutate(
      { email: email.trim().toLowerCase(), role },
      {
        onSuccess: () => {
          toast.success("Invitation envoyée");
          setEmail("");
          utils.org.sentInvitations.invalidate();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Invitations"
          subtitle="Gérez les invitations de votre organisation"
          breadcrumb={[{ label: "Invitations" }]}
        />

        <div className="space-y-4">
          {/* Invitations reçues */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm font-semibold mb-4">Invitations reçues</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 pr-2 font-medium">Organisation</th>
                    <th className="text-left py-2 pr-2 font-medium">Inviteur</th>
                    <th className="text-left py-2 pr-2 font-medium">Rôle</th>
                    <th className="text-right py-2 font-medium">Actes</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <div className="animate-pulse text-zinc-600 text-[11px]">Chargement...</div>
                      </td>
                    </tr>
                  ) : (received ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-500">Aucune invitation reçue</td>
                    </tr>
                  ) : (
                    (received ?? []).map((inv: any) => (
                      <tr key={inv.id} className="border-b border-zinc-800/50 last:border-0">
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2">
                            <Building2 size={12} className="text-zinc-600" />
                            <span className="truncate">{inv.orgName || inv.orgSlug || "Organisation"}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-2 text-zinc-400 truncate">{inv.inviterName || "—"}</td>
                        <td className="py-3 pr-2 text-zinc-400">{inv.role === "admin" ? "admin" : "membre"}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                decline.mutate(
                                  { id: inv.id },
                                  {
                                    onSuccess: () => {
                                      toast.success("Invitation refusée");
                                      utils.org.receivedInvitations.invalidate();
                                    },
                                    onError: (err) => toast.error(err.message),
                                  }
                                )
                              }
                              disabled={decline.isPending}
                              className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg text-[10px] text-zinc-300 transition-colors"
                            >
                              <X size={11} /> Refuser
                            </button>
                            <button
                              onClick={() =>
                                accept.mutate(
                                  { id: inv.id },
                                  {
                                    onSuccess: () => {
                                      toast.success("Invitation acceptée");
                                      utils.org.receivedInvitations.invalidate();
                                      utils.org.me.invalidate();
                                    },
                                    onError: (err) => toast.error(err.message),
                                  }
                                )
                              }
                              disabled={accept.isPending}
                              className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                            >
                              <Check size={11} /> Accepter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invitations envoyées */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm font-semibold">
                Invitations envoyées par {org?.name ? `l'organisation ${org.name}` : "l'organisation"}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e-mail@exemple.com"
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 w-40 sm:w-48"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "member" | "admin")}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={invite.isPending}
                  className="flex items-center gap-1.5 bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                >
                  <UserPlus size={13} /> Inviter
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 pr-2 font-medium">E-mail</th>
                    <th className="text-left py-2 pr-2 font-medium">Rôle</th>
                    <th className="text-left py-2 pr-2 font-medium">Statut</th>
                    <th className="text-right py-2 font-medium">Actes</th>
                  </tr>
                </thead>
                <tbody>
                  {sentLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <div className="animate-pulse text-zinc-600 text-[11px]">Chargement...</div>
                      </td>
                    </tr>
                  ) : (sent ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-500">Aucune invitation envoyée</td>
                    </tr>
                  ) : (
                    (sent ?? []).map((inv: any) => (
                      <tr key={inv.id} className="border-b border-zinc-800/50 last:border-0">
                        <td className="py-3 pr-2">{inv.email}</td>
                        <td className="py-3 pr-2 text-zinc-400">{inv.role === "admin" ? "admin" : "membre"}</td>
                        <td className="py-3 pr-2">
                          <span
                            className={`text-[10px] rounded px-2 py-0.5 ${
                              inv.status === "pending"
                                ? "bg-yellow-500/15 text-yellow-400"
                                : inv.status === "accepted"
                                ? "bg-orange-500/15 text-orange-400"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {inv.status === "pending" ? "En attente" : inv.status === "accepted" ? "Acceptée" : "Annulée"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {inv.status === "pending" && (
                            <button
                              onClick={() =>
                                cancel.mutate(
                                  { id: inv.id },
                                  {
                                    onSuccess: () => {
                                      toast.success("Invitation annulée");
                                      utils.org.sentInvitations.invalidate();
                                    },
                                    onError: (err) => toast.error(err.message),
                                  }
                                )
                              }
                              disabled={cancel.isPending}
                              className="flex items-center gap-1 ml-auto bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg text-[10px] text-zinc-300 transition-colors"
                            >
                              <X size={11} /> Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
