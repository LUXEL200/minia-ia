import { startLogin } from "@/const";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActionEffect } from "@/components/ActionEffects";
import { useDownloadEffects } from "@/components/DownloadEffects";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toastRich } from "@/lib/toasts";
import PageHeader from "@/components/PageHeader";
import BearState from "@/components/BearState";
import {
  Image, Search, X, Plus, Download, Eye, Star, Share2, ListChecks,
  Type, Trash2, Loader2, Sparkles,
} from "lucide-react";

const STYLES = [
  { id: "viral", label: "Viral", emoji: "🔥" },
  { id: "mrbeast", label: "MrBeast", emoji: "🤩" },
  { id: "minimalist", label: "Minimaliste", emoji: "✨" },
  { id: "dramatic", label: "Dramatique", emoji: "🎬" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "retro", label: "Rétro", emoji: "📼" },
];
const STYLE_LABELS: Record<string, string> = Object.fromEntries(STYLES.map(s => [s.id, s.label]));

function getDateFromPeriod(period: string): string | undefined {
  const now = new Date();
  if (period === "today") { now.setHours(0, 0, 0, 0); return now.toISOString(); }
  if (period === "7days") { now.setDate(now.getDate() - 7); return now.toISOString(); }
  if (period === "30days") { now.setDate(now.getDate() - 30); return now.toISOString(); }
  return undefined;
}

export default function Miniatures() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { triggerShake, triggerPop } = useActionEffect();
  const { triggerDownload } = useDownloadEffects();
  const [, navigate] = useLocation();

  const [query, setQuery] = useState("");
  const [filterStyle, setFilterStyle] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [previewTarget, setPreviewTarget] = useState<{ id: number; imageUrl: string; prompt: string } | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const isAuthed = !authLoading && isAuthenticated && !!user;

  const { data: thumbnails, isLoading: loadingThumbs, refetch: refetchThumbs } = trpc.thumbnail.list.useQuery(undefined, { enabled: isAuthed });
  const { data: filteredThumbnails } = trpc.thumbnail.listFiltered.useQuery(
    {
      query: query || undefined,
      style: filterStyle === "all" ? undefined : filterStyle,
      ...(filterDate !== "all" ? { dateFrom: getDateFromPeriod(filterDate) } : {}),
    },
    { enabled: isAuthed }
  );

  const completedThumbIds = useMemo(
    () => thumbnails?.filter(t => t.status === "completed").map(t => t.id) ?? [],
    [thumbnails]
  );
  const { data: likesData } = trpc.likes.bulk.useQuery(
    { thumbnailIds: completedThumbIds },
    { enabled: isAuthed && completedThumbIds.length > 0 }
  );
  const [likedThumbs, setLikedThumbs] = useState<Record<number, { count: number; liked: boolean }>>({});

  useEffect(() => {
    if (likesData) {
      const mapped: Record<number, { count: number; liked: boolean }> = {};
      for (const [id, data] of Object.entries(likesData ?? {})) {
        mapped[Number(id)] = data as any;
      }
      setLikedThumbs(mapped);
    }
  }, [likesData]);

  const utils = trpc.useUtils();
  const deleteMutation = trpc.thumbnail.delete.useMutation({
    onSuccess: (_data, vars) => {
      triggerShake();
      refetchThumbs();
      toastRich("success", "Miniature supprimée", { description: "Elle est dans la Poubelle et peut être restaurée." });
    },
    onError: () => toastRich("error", "Erreur lors de la suppression"),
  });
  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: (data, vars) => {
      if (data.liked) triggerPop();
      setLikedThumbs(prev => ({ ...prev, [vars.thumbnailId]: { count: data.count, liked: data.liked } }));
      toastRich(data.liked ? "success" : "info", data.liked ? "Ajouté aux favoris" : "Retiré des favoris");
    },
    onError: () => toastRich("error", "Impossible de mettre à jour le favori"),
  });
  const createTaskMutation = trpc.team.createTask.useMutation({
    onSuccess: () => {
      utils.team.tasks.invalidate();
      toastRich("success", "Tâche de validation créée", { description: "Les membres de l'équipe peuvent maintenant la valider ou la refuser." });
    },
    onError: () => toastRich("error", "Impossible de créer la tâche"),
  });

  const displayThumbnails = (filteredThumbnails ?? []).filter(t => t.status === "completed");

  if (authLoading) return null;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-semibold text-white mb-2">Mes miniatures</h1>
          <p className="text-muted-foreground text-sm mb-6">Connecte-toi pour retrouver toutes tes miniatures générées.</p>
          <Button onClick={() => startLogin()} className="w-full py-5 text-base font-medium bg-white text-black hover:bg-white/90 rounded-xl">
            Se connecter
          </Button>
          <Link href="/" className="block mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">← Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "minia-ia.png";
    link.target = "_blank";
    downloadLinkRef.current = link;
    triggerDownload({ thumbnailUrl: url, title: "Miniature téléchargée", liquid: "multicolor" }, () => {
      downloadLinkRef.current?.click();
      toast.success("Miniature téléchargée !", { duration: 1800 });
    });
  };

  const handleShare = async (_id: number, imageUrl: string, prompt: string) => {
    const shareUrl = `${window.location.origin}/gallery`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Miniature Minia IA", text: prompt, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toastRich("success", "Lien copié dans le presse-papiers !");
      }
    } catch { /* cancelled */ }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Mes miniatures"
          subtitle={`${displayThumbnails.length} miniature(s) affichée(s) — retrouve, modifie et partage tes créations`}
          breadcrumb={[{ label: "Miniatures" }]}
          right={
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 bg-[#ff0050] hover:bg-[#e60048] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Nouvelle miniature</span>
            </button>
          }
        />

        {/* Filters */}
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par description ou titre YouTube…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-border text-white placeholder:text-zinc-600 text-sm focus:border-white/20 outline-none transition-all"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filterStyle} onChange={e => setFilterStyle(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-xs text-foreground outline-none">
              <option value="all">Tous les styles</option>
              {STYLES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
            </select>
            <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-xs text-foreground outline-none">
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
            </select>
            {(query || filterStyle !== "all" || filterDate !== "all") && (
              <button
                onClick={() => { setQuery(""); setFilterStyle("all"); setFilterDate("all"); }}
                className="px-3 py-2 rounded-lg bg-muted border border-border text-[11px] text-foreground hover:text-foreground transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loadingThumbs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-zinc-950 animate-pulse" />
            ))}
          </div>
        ) : displayThumbnails.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Image className="mx-auto mb-3" size={48} />
            {thumbnails && thumbnails.length === 0 ? (
              <>
                <BearState
                  title="L’ours garde encore une galerie vide"
                  description="Génère ta première miniature depuis le dashboard pour la retrouver ici, avec ses filtres, favoris et modifications."
                  actionLabel="Créer ma première miniature"
                  onAction={() => navigate("/dashboard")}
                />
              </>
            ) : (
              <>
                <BearState
                  title="L’ours ne trouve rien ici"
                  description="Aucune miniature ne correspond à tes filtres actuels."
                  actionLabel="Réinitialiser les filtres"
                  onAction={() => { setQuery(""); setFilterStyle("all"); setFilterDate("all"); }}
                />
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayThumbnails.map(thumb => (
              <div key={thumb.id} className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 group">
                <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs text-white/80 line-clamp-1">{thumb.prompt}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {STYLE_LABELS[thumb.style ?? "viral"] || thumb.style} · {new Date(thumb.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => setPreviewTarget(thumb)} className="p-2 rounded-full bg-muted/80 hover:bg-white/20 transition-colors" title="Aperçu">
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => handleDownload(thumb.imageUrl)} className="p-2 rounded-full bg-muted/80 hover:bg-white/20 transition-colors" title="Télécharger">
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => likeMutation.mutate({ thumbnailId: thumb.id })} className="p-2 rounded-full bg-muted/80 hover:bg-orange-400/20 transition-colors" title="Favori">
                    <Star className={`w-4 h-4 ${likedThumbs[thumb.id]?.liked ? "text-yellow-400 fill-yellow-400" : "text-white"}`} />
                  </button>
                  <button onClick={() => handleShare(thumb.id, thumb.imageUrl || "", thumb.prompt)} className="p-2 rounded-full bg-muted/80 hover:bg-white/20 transition-colors" title="Partager">
                    <Share2 className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => createTaskMutation.mutate({ thumbnailId: thumb.id, status: "pending" })} className="p-2 rounded-full bg-muted/80 hover:bg-orange-400/20 transition-colors" title="Valider (créer une tâche)">
                    <ListChecks className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => navigate(`/editor?image=${encodeURIComponent(thumb.imageUrl || "")}`)} className="p-2 rounded-full bg-muted/80 hover:bg-orange-400/20 transition-colors" title="Modifier (Canva)">
                    <Type className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => deleteMutation.mutate({ id: thumb.id })} className="p-2 rounded-full bg-muted/80 hover:bg-red-500/20 transition-colors" title="Supprimer">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview dialog */}
      {previewTarget && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewTarget(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={previewTarget.imageUrl} alt={previewTarget.prompt} className="w-full aspect-video object-cover" />
            <div className="p-4">
              <p className="text-sm text-white/90 line-clamp-2">{previewTarget.prompt}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleDownload(previewTarget.imageUrl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/80 hover:bg-white/20 text-[11px] text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger
                </button>
                <button
                  onClick={() => navigate(`/editor?image=${encodeURIComponent(previewTarget.imageUrl || "")}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/80 hover:bg-white/20 text-[11px] text-white transition-colors"
                >
                  <Type className="w-3.5 h-3.5" /> Modifier
                </button>
                <button
                  onClick={() => setPreviewTarget(null)}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-foreground transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}
