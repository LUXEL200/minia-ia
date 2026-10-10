import { Activity, AlertTriangle, Database, Image, Users, WalletCards } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AdminShell from "@/components/AdminShell";

function Metric({ label, value, icon: Icon, accent = "text-orange-300" }: { label: string; value: string | number; icon: typeof Users; accent?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5"><Icon className={`mb-4 h-5 w-5 ${accent}`} /><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-semibold text-white">{value}</p></div>;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: operations } = trpc.admin.operations.useQuery(undefined, { refetchInterval: 10000 });
  const { data: metrics } = trpc.admin.historicalMetrics.useQuery({ days: 14 });
  const totals = (metrics ?? []).reduce((acc, day) => ({
    activeUsers: acc.activeUsers + day.activeUsers,
    generations: acc.generations + day.generations,
    successfulGenerations: acc.successfulGenerations + day.successfulGenerations,
    errors: acc.errors + day.errors,
  }), { activeUsers: 0, generations: 0, successfulGenerations: 0, errors: 0 });
  return <AdminShell title="Dashboard général">
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Utilisateurs" value={statsLoading ? "…" : stats?.totalUsers ?? 0} icon={Users} />
        <Metric label="Miniatures générées" value={statsLoading ? "…" : stats?.totalThumbnails ?? 0} icon={Image} accent="text-blue-300" />
        <Metric label="Crédits disponibles" value={statsLoading ? "…" : stats?.totalCredits ?? 0} icon={WalletCards} accent="text-emerald-300" />
        <Metric label="Incidents récents" value={operations?.failedGenerations?.length ?? 0} icon={AlertTriangle} accent="text-red-300" />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Activité des 14 derniers jours</h2><p className="mt-1 text-xs text-slate-400">Données historiques disponibles pour le suivi opérationnel.</p></div><Activity className="h-5 w-5 text-orange-300" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[
          ["Actifs", totals.activeUsers], ["Générations", totals.generations], ["Réussies", totals.successfulGenerations], ["Erreurs", totals.errors],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-white/5 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>)}</div></div>
        <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-emerald-300" /><h2 className="font-semibold">Santé du système</h2></div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-400">Base de données</span><span className={operations?.database === "ok" ? "text-emerald-300" : "text-red-300"}>{operations?.database === "ok" ? "Opérationnelle" : "Indisponible"}</span></div><div className="flex justify-between"><span className="text-slate-400">Stripe</span><span className="text-amber-300">Non connecté</span></div><div className="flex justify-between"><span className="text-slate-400">Dernier contrôle</span><span className="text-slate-300">{operations?.checkedAt ? new Date(operations.checkedAt).toLocaleTimeString("fr-FR") : "—"}</span></div></div></div>
      </section>
      <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5"><h2 className="font-semibold text-red-100">Incidents de génération</h2>{(operations?.failedGenerations ?? []).length === 0 ? <p className="mt-3 text-sm text-slate-400">Aucun incident récent.</p> : <div className="mt-3 space-y-2">{operations?.failedGenerations.slice(0, 5).map(item => <div key={item.id} className="flex gap-3 border-b border-white/10 pb-2 text-sm"><span className="text-red-300">#{item.id}</span><span className="truncate text-slate-300">{item.prompt}</span><span className="ml-auto text-xs text-slate-500">user {item.userId}</span></div>)}</div>}</section>
    </div>
  </AdminShell>;
}
