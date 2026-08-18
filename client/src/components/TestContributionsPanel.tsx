import { Users, TrendingUp, UserPlus, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * TestContributionsPanel — stats collaboratives A/B.
 * Les membres d'une organisation ajoutent leurs vues/clics YouTube sans
 * modifier les variantes d'origine : les totaux agrégés sont affichés
 * avec le CTR cumulé (base + contributions).
 */
export function TestContributionsPanel({
  testId,
  open,
  onToggle,
  variant,
  setVariant,
  views,
  setViews,
  clicks,
  setClicks,
  channel,
  setChannel,
  onAdd,
  adding,
  onDelete,
}: {
  testId: number;
  open: boolean;
  onToggle: () => void;
  variant: "a" | "b";
  setVariant: (v: "a" | "b") => void;
  views: number;
  setViews: (n: number) => void;
  clicks: number;
  setClicks: (n: number) => void;
  channel: string;
  setChannel: (s: string) => void;
  onAdd: () => void;
  adding: boolean;
  onDelete?: (contributionId: number) => void;
}) {
  const { data: aggregated, isLoading: aggLoading } = trpc.abTests.getAggregated.useQuery({ abTestId: testId });
  const { data: contributions, isLoading: contribsLoading } = trpc.abTests.contributions.list.useQuery({ abTestId: testId });

  return (
    <div className="border-t border-white/5 bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-white transition-colors"
      >
        <Users className="w-3.5 h-3.5" /> Contributions d'équipe
        <span className="ml-auto text-[10px] text-muted-foreground/70">
          {(contributions ?? []).length} contribution{(contributions ?? []).length > 1 ? "s" : ""}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* CTR agrégé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {aggLoading ? (
              <div className="col-span-full text-[10px] text-muted-foreground/70 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Chargement…
              </div>
            ) : (
              <>
                <div className="bg-muted border border-border rounded-lg p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 mb-0.5">CTR agrégé — A</p>
                  <p className="text-sm font-semibold text-white">{aggregated?.ctrA ?? 0}%</p>
                  <p className="text-[10px] text-zinc-500">
                    {aggregated?.viewsA ?? 0} vues · {aggregated?.clicksA ?? 0} clics
                  </p>
                </div>
                <div className="bg-muted border border-border rounded-lg p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 mb-0.5">CTR agrégé — B</p>
                  <p className="text-sm font-semibold text-white">{aggregated?.ctrB ?? 0}%</p>
                  <p className="text-[10px] text-zinc-500">
                    {aggregated?.viewsB ?? 0} vues · {aggregated?.clicksB ?? 0} clics
                  </p>
                </div>
                <div className="bg-muted border border-border rounded-lg p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 mb-0.5">Écart CTR agrégé</p>
                  <p className="text-sm font-semibold text-orange-400">
                    {aggregated && ((aggregated.ctrA - aggregated.ctrB) >= 0 ? "+" : "")}{((aggregated?.ctrA ?? 0) - (aggregated?.ctrB ?? 0)).toFixed(1)} pts
                  </p>
                  <p className="text-[10px] text-zinc-500">{aggregated?.contributionCount ?? 0} contribution{(aggregated?.contributionCount ?? 0) > 1 ? "s" : ""} d'équipe</p>
                </div>
              </>
            )}
          </div>

          {/* Formulaire d'ajout */}
          <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
              <UserPlus className="w-3 h-3" /> Ajoute les vues/clics de ta chaîne (les variantes d'origine ne sont pas modifiées)
            </p>
            <div className="flex items-center gap-1">
              {(["a", "b"] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                    variant === v ? "bg-orange-400 text-black border-orange-400" : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  Variante {v.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500">Vues ajoutées</label>
                <input
                  type="number"
                  min={0}
                  value={views}
                  onChange={e => setViews(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">Clics ajoutés</label>
                <input
                  type="number"
                  min={0}
                  value={clicks}
                  onChange={e => setClicks(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={channel}
                onChange={e => setChannel(e.target.value)}
                placeholder="Nom de la chaîne (optionnel)"
                className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
              />
              <button
                type="button"
                onClick={onAdd}
                disabled={adding}
                className="flex items-center gap-1 px-3 rounded bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 text-[10px] font-medium text-white transition-colors"
              >
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />} Ajouter
              </button>
            </div>
          </div>

          {/* Liste des contributions */}
              {(contributions ?? []).length > 0 && (
            <div className="space-y-1.5">
              {contribsLoading && (
                <p className="text-[10px] text-muted-foreground/70">Chargement…</p>
              )}
              {(contributions ?? []).map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 bg-muted border border-border rounded px-2.5 py-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${c.variant === "a" ? "border-orange-400/30 text-orange-300" : "border-orange-400/30 text-pink-300"}`}>
                    {c.variant.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-zinc-300 flex-1 min-w-0">
                    {c.channelName || c.contributorName || "Membre d'équipe"} — {c.views} vues, {c.clicks} clics
                  </span>
                  <span className="text-[9px] text-muted-foreground/70 hidden sm:block">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(c.id)}
                      className="text-muted-foreground/70 hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
