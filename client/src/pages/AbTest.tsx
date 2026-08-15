import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import {
  Plus, Trash2, TrendingUp, Award, X, Zap,
} from "lucide-react";

export default function AbTest() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  if (!loading && !isAuthenticated) navigate("/dashboard");

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [variantAId, setVariantAId] = useState<number>(0);
  const [variantBId, setVariantBId] = useState<number>(0);
  const [openTestId, setOpenTestId] = useState<number | null>(null);

  const { data: thumbnails, isLoading: thumbsLoading } = trpc.thumbnail.list.useQuery();

  const { data: tests, isLoading: testsLoading, refetch } = trpc.abTests.list.useQuery();
  const createTest = trpc.abTests.create.useMutation();
  const updateStats = trpc.abTests.updateStats.useMutation();
  const deleteTest = trpc.abTests.delete.useMutation();
  const utils = trpc.useUtils();

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Titre requis"); return; }
    if (variantAId === 0 || variantBId === 0) { toast.error("Choisis deux miniatures différentes"); return; }
    if (variantAId === variantBId) { toast.error("Les deux variantes doivent être différentes"); return; }
    createTest.mutate(
      { title: title.trim(), variantAId, variantBId },
      {
        onSuccess: () => {
          toast.success("Test A/B créé !");
          setShowCreate(false);
          setTitle("");
          setVariantAId(0);
          setVariantBId(0);
          utils.abTests.list.invalidate();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const updateStat = (test: any, field: "viewsA" | "clicksA" | "viewsB" | "clicksB", value: number) => {
    updateStats.mutate(
      { id: test.id, [field]: Math.max(0, value) },
      {
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const declareWinner = (test: any, winner: "a" | "b" | "tie") => {
    updateStats.mutate(
      { id: test.id, winner, status: "finished" },
      {
        onSuccess: () => {
          toast.success(winner === "tie" ? "Match nul déclaré !" : `Variante ${winner.toUpperCase()} déclarée gagnante !`);
          utils.abTests.list.invalidate();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  if (loading) return null;
  if (!isAuthenticated) return null;

  const thumbs = (thumbnails as any[]) || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Tests A/B"
          subtitle="Compare deux miniatures et suis leur CTR pour choisir la meilleure"
          breadcrumb={[{ label: "Tests A/B" }]}
          right={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-[#ff0050] hover:bg-[#e60048] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Nouveau test</span>
            </button>
          }
        />

        {testsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[2/1] bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (!tests || tests.length === 0) ? (
          <div className="text-center py-20 text-zinc-500">
            <TrendingUp className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucun test A/B en cours</p>
            <p className="text-sm max-w-md mx-auto">
              Compare deux de tes miniatures, déclare les vues et clics depuis YouTube Analytics, et Minia IA calcule le CTR pour désigner la gagnante.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test: any) => {
              const isWinner = test.winner && test.winner !== "undecided";
              return (
                <div key={test.id} className="bg-zinc-950 border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <h3 className="text-sm font-medium">{test.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${test.status === "finished" ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"}`}>
                        {test.status === "finished" ? "Terminé" : "En cours"}
                      </span>
                      {test.autoClosed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1" title="Différence de CTR statistiquement significative (test z, α = 0,05)">
                          <Zap size={10} /> Clôturé automatiquement
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setOpenTestId(openTestId === test.id ? null : test.id)} className="text-xs text-zinc-400 hover:text-white">
                        Détails
                      </button>
                      <button
                        onClick={() => deleteTest.mutate({ id: test.id }, { onSuccess: () => utils.abTests.list.invalidate() })}
                        className="text-zinc-500 hover:text-red-400"
                        title="Supprimer le test"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-t border-white/5">
                    {(["A", "B"] as const).map((side) => {
                      const variant = side === "A" ? test.variantA : test.variantB;
                      const views = side === "A" ? test.viewsA : test.viewsB;
                      const clicks = side === "A" ? test.clicksA : test.clicksB;
                      const ctr = side === "A" ? test.ctrA : test.ctrB;
                      const isWin = test.winner === side.toLowerCase();
                      return (
                        <div key={side} className={`relative rounded-lg overflow-hidden border ${isWin ? "border-emerald-400" : "border-white/10"}`}>
                          {isWin && (
                            <span className="absolute top-1.5 left-1.5 z-10 bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Award size={10} /> GAGNANTE
                            </span>
                          )}
                          <img src={variant?.imageUrl || ""} alt={`Variante ${side}`} className="w-full aspect-video object-cover" />
                          <div className="p-2.5 bg-zinc-900 space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                              <span className="font-bold text-white text-xs">V{side}</span> Variante {side}
                              <span className="ml-auto text-cyan-400 font-medium">CTR {ctr}%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-zinc-500">Vues</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={views ?? 0}
                                  onChange={(e) => updateStat(test, side === "A" ? "viewsA" : "viewsB", Number(e.target.value))}
                                  className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-zinc-500">Clics</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={clicks ?? 0}
                                  onChange={(e) => updateStat(test, side === "A" ? "clicksA" : "clicksB", Number(e.target.value))}
                                  className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                                />
                              </div>
                            </div>
                            {test.status !== "finished" && (
                              <button
                                onClick={() => declareWinner(test, side === "A" ? "a" : "b")}
                                className="w-full text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded py-1 text-zinc-300 transition-colors"
                              >
                                Déclarer gagnante
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {test.status !== "finished" && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => declareWinner(test, "tie")}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Match nul
                      </button>
                    </div>
                  )}
                  {test.autoClosed && (
                    <div className="px-4 pb-3 flex items-center gap-1.5 text-[11px] text-amber-400/90">
                      <Zap size={12} /> La différence de CTR est statistiquement significative (test z à deux proportions, α = 0,05) — Minia IA a déclaré automatiquement la gagnante.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nouveau test A/B</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Titre du test</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Miniature video #12"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Variante A</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {thumbsLoading ? (
                    <div className="col-span-4 text-xs text-zinc-500">Chargement…</div>
                  ) : thumbs.length === 0 ? (
                    <div className="col-span-4 text-xs text-zinc-500">Génère d'abord des miniatures</div>
                  ) : (
                    thumbs.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => setVariantAId(t.id)}
                        className={`relative aspect-video rounded overflow-hidden border-2 transition-colors ${variantAId === t.id ? "border-cyan-400" : "border-transparent"}`}
                      >
                        <img src={t.imageUrl || ""} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Variante B</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {thumbs.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => setVariantBId(t.id)}
                      className={`relative aspect-video rounded overflow-hidden border-2 transition-colors ${variantBId === t.id ? "border-pink-500" : "border-transparent"}`}
                    >
                      <img src={t.imageUrl || ""} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={createTest.isPending}
                className="w-full bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {createTest.isPending ? "Création..." : "Lancer le test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
