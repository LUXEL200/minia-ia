import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Activity, Zap, Trophy, TrendingUp, Copy, ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

export default function ShareAbTest() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: test, isLoading, error } = trpc.abTests.getByShareToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token && token.length >= 16, retry: false },
  );

  // Redirect logged-in owner to the real /ab-test page
  useEffect(() => {
    if (test && isAuthenticated) {
      // Not strictly needed, but avoids duplicates — leave as-is (read-only link still works)
    }
  }, [test, isAuthenticated]);

  const copyLink = async (imageUrl: string, label: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${imageUrl}`);
      toast.success(`Lien ${label} copié !`);
    } catch {
      // Clipboard unavailable — noop
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-white mb-2">Test introuvable</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Ce lien de partage est invalide ou a été désactivé par son créateur.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-semibold text-white">Minia IA · Test A/B partagé</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Accueil
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map(i => (
              <div key={i} className="aspect-video rounded-[20px] bg-muted animate-pulse" />
            ))}
          </div>
        ) : test ? (
          <>
            <div className="pt-8 pb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {test.status === "finished" && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    test.winner && test.winner !== "undecided" && test.winner !== "tie"
                      ? "bg-green-500/15 text-green-400 border border-green-500/30"
                      : "bg-muted/80 text-foreground border border-border"
                  }`}>
                    {test.winner === "a" || test.winner === "b" ? <Trophy className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    {test.winner === "a" ? "Gagnant : A" : test.winner === "b" ? "Gagnant : B" : test.winner === "tie" ? "Égalité" : "Terminé"}
                  </span>
                )}
                {test.autoClosed === 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                    <Zap className="w-3 h-3" /> Clôturé automatiquement
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border text-[10px]">
                  {test.status === "running" ? "En cours" : "Terminé"}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-white">{test.title}</h1>
              <p className="text-xs text-muted-foreground mt-1.5">
                Ce test compare deux variantes de miniature en mesurant leur taux de clics (CTR) déclaré.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["a", "b"] as const).map(variant => {
                const v = variant === "a" ? test.variantA : test.variantB;
                const views = variant === "a" ? test.viewsA : test.viewsB;
                const clicks = variant === "a" ? test.clicksA : test.clicksB;
                const ctr = variant === "a" ? test.ctrA : test.ctrB;
                const isWinner = test.winner === variant;
                return (
                  <div key={variant} className={`rounded-[20px] border overflow-hidden ${isWinner ? "border-green-500/40 bg-green-500/5" : "border-border bg-muted"}`}>
                    <div className="relative">
                      <img src={v.imageUrl} alt={`Variante ${variant.toUpperCase()}`} className="w-full aspect-video object-cover" />
                      {isWinner && (
                        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/90 text-white text-[10px] font-semibold">
                          <Trophy className="w-3 h-3" /> Gagnante
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold">
                        Variante {variant.toUpperCase()}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{v.prompt}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{ctr}%</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> CTR</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{views.toLocaleString("fr-FR")}</p>
                          <p className="text-[10px] text-muted-foreground">Vues</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{clicks.toLocaleString("fr-FR")}</p>
                          <p className="text-[10px] text-muted-foreground">Clics</p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyLink(v.imageUrl, variant === "a" ? "A" : "B")}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-[11px] text-foreground transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Copier la miniature
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-8">
              Vue en lecture seule · Créé avec Minia IA — générateur de miniatures YouTube par IA
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
