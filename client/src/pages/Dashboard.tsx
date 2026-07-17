import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, Image, CreditCard, Download, Trash2, Loader2, Sparkles,
  ChevronDown, Play, Clock, CheckCircle2, XCircle,
} from "lucide-react";

const STYLES = [
  { id: "viral", label: "Viral", emoji: "🔥", desc: "Bold, vibrant, high CTR" },
  { id: "mrbeast", label: "MrBeast", emoji: "🤩", desc: "Exaggerated, saturated" },
  { id: "minimalist", label: "Minimaliste", emoji: "✨", desc: "Clean, elegant, subtle" },
  { id: "dramatic", label: "Dramatique", emoji: "🎬", desc: "Dark, moody, cinematic" },
  { id: "tech", label: "Tech", emoji: "💻", desc: "Futuristic, neon, digital" },
  { id: "retro", label: "Rétro", emoji: "📼", desc: "Vintage, 80s, nostalgic" },
];

const QUANTITY_OPTIONS = [
  { value: 1, label: "1 miniature" },
  { value: 2, label: "2 miniatures" },
  { value: 3, label: "3 miniatures" },
  { value: 4, label: "4 miniatures" },
];

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("viral");
  const [quantity, setQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);

  // tRPC queries
  const { data: thumbnails, isLoading: loadingThumbs, refetch: refetchThumbs } = trpc.thumbnail.list.useQuery();
  const { data: credits, refetch: refetchCredits } = trpc.thumbnail.credits.useQuery();
  const generateMutation = trpc.thumbnail.generate.useMutation();
  const deleteMutation = trpc.thumbnail.delete.useMutation({
    onSuccess: () => {
      refetchThumbs();
      refetchCredits();
      toast.success("Miniature supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      startLogin();
    }
  }, [authLoading, isAuthenticated]);

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      toast.error("Décris ta miniature en au moins 10 caractères");
      return;
    }
    if (credits && credits.credits < quantity) {
      toast.error(`Crédits insuffisants. Il te reste ${credits.credits} crédit(s).`);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        style: style as any,
        quantity,
      });
      toast.success(`${result.thumbnails.filter(t => t.status === "completed").length} miniature(s) générée(s) !`);
      setPrompt("");
      refetchThumbs();
      refetchCredits();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const handleDownload = (url: string, id: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `minia-ia-${id}.png`;
    link.target = "_blank";
    link.click();
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#EC4899]" />
          <p className="text-zinc-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/90 backdrop-blur-xl border-b border-[#27272A]">
        <nav className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-base font-bold text-white">
              Minia<span className="text-[#06B6D4]">IA</span>
            </span>
            <a href="/" className="ml-4 text-sm text-zinc-500 hover:text-white transition-colors">
              ← Retour au site
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18181B] border border-[#27272A]">
              <CreditCard className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-sm font-bold text-[#22C55E]">{credits?.credits ?? 10}</span>
              <span className="text-xs text-zinc-500">crédits</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-white font-medium">{user.name || user.email}</p>
              <p className="text-xs text-zinc-500 capitalize">{credits?.planType || "free"} plan</p>
            </div>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-1">
              Crée ta miniature <span className="text-[#06B6D4]">virale</span>
            </h1>
            <p className="text-zinc-400">Décris ce que tu veux, choisis un style, et laisse l'IA travailler.</p>
          </div>

          {/* Generation Form */}
          <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6 mb-8">
            {/* Prompt input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Décris ta miniature
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Un homme surpris avec un gros plan, fond bleu électrique, texte 'IL A GAGNÉ 100 000€' en gros..."
                  className="w-full h-28 px-4 py-3 rounded-lg bg-[#09090B] border border-[#27272A] text-white placeholder:text-zinc-600 focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/20 outline-none resize-none transition-all"
                  maxLength={500}
                />
                <span className="absolute bottom-2 right-2 text-xs text-zinc-600">
                  {prompt.length}/500
                </span>
              </div>
            </div>

            {/* Style selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Style</label>
                <div className="relative">
                  <button
                    onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#09090B] border border-[#27272A] text-white hover:border-[#06B6D4]/30 transition-colors"
                  >
                    <span>{STYLES.find(s => s.id === style)?.emoji} {STYLES.find(s => s.id === style)?.label}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  </button>
                  {showStyleDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-[#18181B] border border-[#27272A] overflow-hidden z-10">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setStyle(s.id); setShowStyleDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#09090B] transition-colors ${
                            style === s.id ? "bg-[#06B6D4]/10" : ""
                          }`}
                        >
                          <span className="text-lg">{s.emoji}</span>
                          <div>
                            <span className="text-sm text-white">{s.label}</span>
                            <span className="block text-xs text-zinc-500">{s.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Quantité</label>
                <div className="flex gap-2">
                  {QUANTITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setQuantity(opt.value)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        quantity === opt.value
                          ? "bg-[#06B6D4] text-black"
                          : "bg-[#09090B] border border-[#27272A] text-zinc-400 hover:border-[#06B6D4]/30"
                      }`}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || prompt.length < 10}
                className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-bold px-6 h-11"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Générer {quantity} miniature{quantity > 1 ? "s" : ""}
                  </>
                )}
              </Button>
              <span className="text-xs text-zinc-500">
                Coût : {quantity} crédit{quantity > 1 ? "s" : ""} ({credits?.credits ?? 10} restants)
              </span>
            </div>
          </div>

          {/* Recent Thumbnails */}
          <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Miniatures récentes
            </h3>

            {loadingThumbs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-video rounded-lg bg-[#09090B] border border-[#27272A] animate-pulse" />
                ))}
              </div>
            ) : !thumbnails || thumbnails.length === 0 ? (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Aucune miniature générée pour le moment</p>
                <p className="text-zinc-600 text-xs mt-1">Décris ta première miniature ci-dessus !</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {thumbnails.map((thumb) => (
                  <div
                    key={thumb.id}
                    className="rounded-lg bg-[#09090B] border border-[#27272A] overflow-hidden group hover:border-[#06B6D4]/30 transition-all"
                  >
                    {/* Image */}
                    <div className="aspect-video relative">
                      {thumb.status === "generating" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#09090B]">
                          <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" />
                        </div>
                      ) : thumb.status === "completed" ? (
                        <>
                          <img
                            src={thumb.imageUrl}
                            alt={thumb.prompt}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleDownload(thumb.imageUrl, thumb.id)}
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Download className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={() => handleDelete(thumb.id)}
                              className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#09090B]">
                          <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#18181B] text-zinc-400 capitalize">
                          {thumb.style}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {thumb.status === "completed" ? (
                            <span className="flex items-center gap-1 text-[#22C55E]">
                              <CheckCircle2 className="w-3 h-3" /> Terminé
                            </span>
                          ) : thumb.status === "generating" ? (
                            <span className="flex items-center gap-1 text-[#06B6D4]">
                              <Play className="w-3 h-3" /> En cours...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="w-3 h-3" /> Échoué
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{thumb.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
