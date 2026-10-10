import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminShell from "@/components/AdminShell";
import { toast } from "sonner";

export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const { data: users, isLoading, refetch } = trpc.admin.adminUsers.useQuery();
  const updatePlan = trpc.admin.updatePlan.useMutation({ onSuccess: () => { toast.success("Plan mis à jour"); refetch(); }, onError: e => toast.error(e.message) });
  const updateCredits = trpc.admin.updateCredits.useMutation({ onSuccess: () => { toast.success("Crédits mis à jour"); refetch(); }, onError: e => toast.error(e.message) });
  const filtered = useMemo(() => (users ?? []).filter(user => `${user.name ?? ""} ${user.email ?? ""} ${user.id}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  return <AdminShell title="Utilisateurs"><div className="space-y-5">
    <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher par nom, email ou ID" className="w-full rounded-xl border border-white/10 bg-[#0d1b2e] py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-300/60" /></div>
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1b2e]"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-white/10 text-xs text-slate-400"><tr><th className="p-4">Utilisateur</th><th className="p-4">Plan</th><th className="p-4">Crédits</th><th className="p-4">Dernière connexion</th><th className="p-4">Rôle</th></tr></thead><tbody>{isLoading ? <tr><td className="p-5 text-slate-400" colSpan={5}>Chargement…</td></tr> : filtered.map(user => <tr key={user.id} className="border-b border-white/5 last:border-0"><td className="p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-orange-300/10 p-2"><UserRound className="h-4 w-4 text-orange-300" /></div><div><p className="font-medium">{user.name || "Sans nom"}</p><p className="text-xs text-slate-500">#{user.id} · {user.email || "sans email"}</p></div></div></td><td className="p-4"><select value={user.planType} onChange={e => updatePlan.mutate({ userId: user.id, planType: e.target.value as "free" | "pro" | "max" })} className="rounded-lg border border-white/10 bg-[#10233a] px-2 py-2 text-xs"><option value="free">Free</option><option value="pro">Pro</option><option value="max">Max</option></select></td><td className="p-4"><input defaultValue={user.credits} onBlur={e => { const credits = Number(e.target.value); if (Number.isFinite(credits) && credits >= 0) updateCredits.mutate({ userId: user.id, credits }); }} type="number" min="0" className="w-24 rounded-lg border border-white/10 bg-[#10233a] px-2 py-2 text-xs" /></td><td className="p-4 text-xs text-slate-400">{user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("fr-FR") : "—"}</td><td className="p-4 text-xs text-slate-400">{user.role}</td></tr>)}{!isLoading && filtered.length === 0 && <tr><td className="p-8 text-center text-slate-400" colSpan={5}>Aucun utilisateur trouvé.</td></tr>}</tbody></table></div>
  </div></AdminShell>;
}
