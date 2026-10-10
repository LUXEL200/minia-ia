import { Bot, Power, RefreshCw, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import AdminShell from "@/components/AdminShell";
import { toast } from "sonner";

export default function AdminModels() {
  const { data, isLoading, refetch } = trpc.admin.models.useQuery();
  const { data: settings, refetch: refetchSettings } = trpc.admin.clientSettings.useQuery();
  const update = trpc.admin.updateClientSetting.useMutation({ onSuccess: () => { toast.success("Réglage enregistré"); refetchSettings(); }, onError: e => toast.error(e.message) });
  const enabled = settings?.["client.generationEnabled"] === "yes";
  return <AdminShell title="Modèles IA & API"><div className="space-y-6">
    <section className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-semibold"><Power className="h-4 w-4 text-orange-300" />Génération globale</h2><p className="mt-1 text-xs text-slate-400">Interrupteur d’urgence contrôlé côté serveur.</p></div><button type="button" onClick={() => update.mutate({ key: "client.generationEnabled", value: enabled ? "no" : "yes" })} className={`rounded-full px-4 py-2 text-sm font-semibold ${enabled ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"}`}>{enabled ? "Activée" : "Désactivée"}</button></div></section>
    <section className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><Bot className="h-4 w-4 text-orange-300" />Registre des modèles disponibles</h2><p className="mt-1 text-xs text-slate-400">Les secrets fournisseurs ne sont jamais affichés.</p></div><button type="button" onClick={() => refetch()} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><RefreshCw className="h-4 w-4" /></button></div>{isLoading ? <p className="text-sm text-slate-400">Chargement…</p> : <div className="grid gap-3 sm:grid-cols-2">{(data?.models ?? []).map((model: any, index: number) => <div key={model.model ?? model.id ?? index} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="font-medium">{model.model ?? model.id ?? "Modèle sans nom"}</p><p className="mt-1 text-xs text-emerald-300">Disponible</p></div>)}{(data?.models ?? []).length === 0 && <p className="text-sm text-slate-400">Aucun modèle retourné par le fournisseur.</p>}</div>}</section>
    <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-100"><ShieldAlert className="h-5 w-5 shrink-0" /><p>Stripe est volontairement différé. Les plans payants restent bloqués pour les clients jusqu’à la connexion d’un compte de paiement.</p></div>
  </div></AdminShell>;
}
