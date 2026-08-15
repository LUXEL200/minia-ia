import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Image, CreditCard, Download, Trash2, Loader2, Sparkles,
  ArrowRight, Home, MessageSquare, Plus, Users, ListChecks,
  Heart, CheckCircle2, XCircle, ChevronRight, UserCircle2,
  Menu, LayoutDashboard, UserRound, Grid3X3, Eye,
  RectangleHorizontal, Star, Trash, Zap, Sun, Key, TrendingUp,
  Settings, Bell, LogOut, Type, Shield, Upload, Share2, Copy,
  Search, CalendarRange, Youtube, CalendarClock, X,
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
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (period === "7days") {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (period === "30days") {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  return undefined;
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("viral");
  const [quantity, setQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "generate" | "team" | "all-generations">("home");
  const [batchPrompts, setBatchPrompts] = useState("");
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sidebarPlatform, setSidebarPlatform] = useState<"compte" | "miniatures" | "personnes" | "modèles">("compte");
  const [likedThumbs, setLikedThumbs] = useState<Record<number, { count: number; liked: boolean }>>({});
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [generateTab, setGenerateTab] = useState<"text" | "image">("text");
  const [inspirationUrl, setInspirationUrl] = useState("");
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const inspirationFileInputRef = useRef<HTMLInputElement>(null);

  // Theme
  const { theme, toggleTheme } = useTheme();

  // Auth gate
  const isAuthed = !authLoading && isAuthenticated && !!user;

  // v6 : deep-linking via hash depuis la sidebar (Miniatures / Personnes)
  useEffect(() => {
    if (!isAuthed) return;
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "miniatures") setActiveView("all-generations");
    else if (hash === "equipe" || hash === "team" || hash === "personnes") setActiveView("team");
    // Effacer le hash pour éviter de re-déclencher après un refresh
    if (hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [isAuthed]);

  // v5 : search & filters for all-generations view
  const [filterQuery, setFilterQuery] = useState("");
  const [filterStyle, setFilterStyle] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterYoutube, setFilterYoutube] = useState("all");
  const { data: filteredThumbnails } = trpc.thumbnail.listFiltered.useQuery(
    {
      query: filterQuery || undefined,
      style: filterStyle === "all" ? undefined : filterStyle,
      youtubeStatus: filterYoutube === "all" ? undefined : filterYoutube,
      ...(filterDate !== "all" ? { dateFrom: getDateFromPeriod(filterDate) } : {}),
    },
    { enabled: isAuthed && activeView === "all-generations" },
  );

  // v5 : YouTube planning dialog state
  const [planTarget, setPlanTarget] = useState<{ id: number; imageUrl: string; prompt: string } | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const planMutation = trpc.thumbnail.planYoutube.useMutation({
    onSuccess: () => { refetchThumbs(); toast.success("Miniature planifiée ! Ouvre YouTube Studio pour l'importer."); },
    onError: (err) => toast.error(err.message || "Erreur"),
  });
  const unplanMutation = trpc.thumbnail.unplanYoutube.useMutation({
    onSuccess: () => { refetchThumbs(); toast.success("Planification annulée"); },
  });

  // tRPC queries
  const { data: thumbnails, isLoading: loadingThumbs, refetch: refetchThumbs } = trpc.thumbnail.list.useQuery(undefined, { enabled: isAuthed });
  const { data: credits, refetch: refetchCredits } = trpc.thumbnail.credits.useQuery(undefined, { enabled: isAuthed });
  const { data: teamMembers, refetch: refetchTeam } = trpc.team.members.useQuery(undefined, { enabled: isAuthed });
  const { data: teamTasks, refetch: refetchTasks } = trpc.team.tasks.useQuery(undefined, { enabled: isAuthed });

  const completedThumbIds = useMemo(
    () => thumbnails?.filter(t => t.status === "completed").map(t => t.id) ?? [],
    [thumbnails]
  );
  const { data: likesData } = trpc.likes.bulk.useQuery(
    { thumbnailIds: completedThumbIds },
    { enabled: isAuthed && completedThumbIds.length > 0 }
  );

  const generateMutation = trpc.thumbnail.generate.useMutation();
  const batchMutation = trpc.batch.generate.useMutation();
  const deleteMutation = trpc.thumbnail.delete.useMutation({
    onSuccess: () => { refetchThumbs(); refetchCredits(); toast.success("Miniature supprimée"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: (data, vars) => {
      setLikedThumbs(prev => ({ ...prev, [vars.thumbnailId]: { count: data.count, liked: data.liked } }));
    },
  });
  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => { refetchTeam(); setShowInviteModal(false); setInviteEmail(""); toast.success("Membre invité !"); },
    onError: (err) => toast.error(err.message || "Erreur"),
  });
  const removeMutation = trpc.team.remove.useMutation({
    onSuccess: () => { refetchTeam(); toast.success("Membre retiré"); },
  });
  const createTaskMutation = trpc.team.createTask.useMutation({
    onSuccess: () => { refetchTasks(); toast.success("Tâche créée"); },
  });
  const updateTaskMutation = trpc.team.updateTask.useMutation({
    onSuccess: () => { refetchTasks(); toast.success("Statut mis à jour"); },
  });

  // Sync likes data
  useEffect(() => {
    if (likesData) {
      const mapped: Record<number, { count: number; liked: boolean }> = {};
      for (const [id, data] of Object.entries(likesData ?? {})) {
        mapped[Number(id)] = data as any;
      }
      setLikedThumbs(mapped);
    }
  }, [likesData]);

  const handleGenerate = useCallback(async () => {
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
        ...(inspirationUrl ? { inspirationImageUrl: inspirationUrl } : {}),
        ...(inspirationImage && inspirationImage.startsWith("data:")
          ? (() => {
              const [header, b64] = inspirationImage.split(",");
              return {
                inspirationB64: b64 ?? "",
                inspirationMime: (header || "image/jpeg").split(":")[1]?.split(";")[0] ?? "image/jpeg",
              };
            })()
          : {}),
      });
      toast.success(`${result.successful} miniature(s) générée(s) !`);
      setPrompt("");
      refetchThumbs();
      refetchCredits();
      setActiveView("home");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, credits, quantity, style, generateMutation, refetchThumbs, refetchCredits]);

  const handleBatchGenerate = useCallback(async () => {
    const prompts = batchPrompts.split("\n").filter(p => p.trim().length >= 10);
    if (prompts.length === 0) {
      toast.error("Entre au moins une description par ligne (10 caractères minimum)");
      return;
    }
    if (credits && credits.credits < prompts.length) {
      toast.error(`Crédits insuffisants. Il te reste ${credits.credits} crédit(s) pour ${prompts.length} descriptions.`);
      return;
    }

    setIsBatchGenerating(true);
    try {
      const result = await batchMutation.mutateAsync({
        prompts,
        style: style as any,
      });
      toast.success(`${result.successful} sur ${prompts.length} miniatures générées !`);
      setBatchPrompts("");
      refetchThumbs();
      refetchCredits();
      setActiveView("home");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération en lot");
    } finally {
      setIsBatchGenerating(false);
    }
  }, [batchPrompts, credits, style, batchMutation, refetchThumbs, refetchCredits]);

  const handleDelete = (id: number) => deleteMutation.mutate({ id });

  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `minia-ia.png`;
    link.target = "_blank";
    link.click();
  };

  const handleLike = (thumbnailId: number) => {
    if (!isAuthenticated) return;
    likeMutation.mutate({ thumbnailId });
  };

  const handleCreateTask = (thumbnailId: number) => createTaskMutation.mutate({ thumbnailId, status: "pending" });

  const handleOpenPlan = (thumb: { id: number; imageUrl: string; prompt: string; youtubeTitle?: string | null }) => {
    setPlanTarget({ id: thumb.id, imageUrl: thumb.imageUrl, prompt: thumb.prompt });
    setPlanTitle(thumb.youtubeTitle?.trim() ? thumb.youtubeTitle || "" : "");
  };

  const handlePlanConfirm = async () => {
    if (!planTarget || !planTitle.trim()) {
      toast.error("Entre un titre pour ta vidéo YouTube");
      return;
    }
    await planMutation.mutateAsync({ thumbnailId: planTarget.id, title: planTitle.trim() });
  };

  const copyShare = async (thumbnailId: number, imageUrl: string) => {
    const url = `${window.location.origin}${imageUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien de l'image copié !");
    } catch {
      // Clipboard unavailable — noop
    }
  };

  const handlePlanCancel = () => {
    setPlanTarget(null);
    setPlanTitle("");
  };

  const [previewTarget, setPreviewTarget] = useState<{ id: number; imageUrl: string; prompt: string } | null>(null);

  const handleShare = async (thumbnailId: number, imageUrl: string, prompt: string) => {
    const shareUrl = `${window.location.origin}/gallery`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Miniature Minia IA", text: prompt, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Lien copié dans le presse-papiers !");
      }
    } catch {
      // User cancelled — no action needed
    }
  };

  const handleUpdateTask = (taskId: number, status: "pending" | "reviewing" | "approved" | "rejected" | "cancelled") => {
    updateTaskMutation.mutate({ taskId, status });
  };

  // ===== Loading state =====
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-zinc-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // ===== Not authenticated =====
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Tableau de bord</h1>
          <p className="text-zinc-500 text-sm mb-6">Connecte-toi pour accéder à ton espace de création.</p>
          <Button
            onClick={() => startLogin()}
            className="w-full py-5 text-base font-medium bg-white text-black hover:bg-white/90 rounded-xl"
          >
            Se connecter
          </Button>
          <Link href="/" className="block mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ===== Computed values =====
  const completedThumbnails = thumbnails?.filter(t => t.status === "completed") ?? [];
  const generatingThumbnails = thumbnails?.filter(t => t.status === "generating") ?? [];
  const failedThumbnails = thumbnails?.filter(t => t.status === "failed") ?? [];
  const totalGenerations = completedThumbnails.length + failedThumbnails.length;
  const recentThumbnails = [...thumbnails ?? []].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);
  const templateThumbnails = completedThumbnails.slice(0, 4);

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-[#000]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-sm text-zinc-300 font-medium">Tableau de bord</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181818] border border-white/5 text-xs text-zinc-300">
            <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
            {credits?.credits ?? 10} crédit{credits && credits.credits !== 1 ? "s" : ""}
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );

  // ===== Home View (default) =====
  const renderHomeView = () => (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      {/* Title */}
      <div className="pt-6 pb-6">
        <h1 className="text-lg font-semibold text-white">Tableau de bord</h1>
        <p className="text-xs text-zinc-500 mt-1">Aperçu de ton espace de création</p>
      </div>

      {/* Stat Cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-[#181818] rounded-xl p-4 relative">
          <Image className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">Miniatures</span>
          <p className="text-2xl font-bold text-white mt-2">{completedThumbnails.length}</p>
          <span className="text-[10px] text-zinc-600">Génération totale</span>
        </div>
        <div className="bg-[#181818] rounded-xl p-4 relative">
          <Sparkles className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">Générations</span>
          <p className="text-2xl font-bold text-white mt-2">{totalGenerations}</p>
          <span className="text-[10px] text-zinc-600">Tous les projets achevés</span>
        </div>
        <div className="bg-[#181818] rounded-xl p-4 relative">
          <UserCircle2 className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">Avatars</span>
          <p className="text-2xl font-bold text-white mt-2">0</p>
          <span className="text-[10px] text-zinc-600">Génération totale</span>
        </div>
        <div className="bg-[#181818] rounded-xl p-4 relative">
          <CreditCard className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">Crédits</span>
          <p className="text-2xl font-bold text-white mt-2">{credits?.credits ?? 10}</p>
          <span className="text-[10px] text-zinc-600">Disponible</span>
        </div>
      </div>

      {/* Vos personnes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Vos personnes</h2>
          <button
            onClick={() => setActiveView("team")}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Afficher tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* Self */}
          <div className="flex-shrink-0 w-40 bg-[#181818] rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-xs text-white font-medium truncate">{user?.name || "Créateur"}</p>
              <p className="text-[10px] text-zinc-500">Créateur</p>
            </div>
          </div>
          {/* Team members */}
          {teamMembers?.slice(0, 3).map(member => (
            <div key={member.id} className="flex-shrink-0 w-40 bg-[#181818] rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                {member.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-xs text-white font-medium truncate">{member.name || "Membre"}</p>
                <p className="text-[10px] text-zinc-500 capitalize">{member.role}</p>
              </div>
            </div>
          ))}
          {/* Add member */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-[#181818] border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Générations récentes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Générations récentes</h2>
          <button
            onClick={() => setActiveView("all-generations")}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Afficher tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {loadingThumbs ? (
          <div className="aspect-video rounded-xl bg-[#181818] animate-pulse" />
        ) : recentThumbnails.length === 0 ? (
          <div className="bg-[#181818] rounded-xl p-8 text-center">
            <Image className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Aucune miniature générée</p>
            <p className="text-[10px] text-zinc-600 mt-1">Va dans Générer pour créer ta première miniature !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentThumbnails.slice(0, 4).map(thumb => (
              <div key={thumb.id} className="relative aspect-video rounded-xl overflow-hidden bg-[#181818] group">
                {thumb.status === "generating" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                  </div>
                ) : thumb.status === "completed" && thumb.imageUrl ? (
                  <>
                    <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white/80 line-clamp-1">{thumb.prompt}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(thumb.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => setPreviewTarget(thumb)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Aperçu">
                        <Eye className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleDownload(thumb.imageUrl)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Télécharger">
                        <Download className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleLike(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-pink-500/20 transition-colors" title="Favori">
                        <Star className={`w-4 h-4 ${likedThumbs[thumb.id]?.liked ? "text-yellow-400 fill-yellow-400" : "text-white"}`} />
                      </button>
                      <button onClick={() => handleShare(thumb.id, thumb.imageUrl || "", thumb.prompt)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Partager">
                        <Share2 className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleCreateTask(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Valider (créer une tâche)">
                        <ListChecks className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => navigate(`/editor?image=${encodeURIComponent(thumb.imageUrl || "")}`)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Modifier (Canva)">
                        <Type className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleDelete(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modèles */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Modèles</h2>
          <Link href="/templates" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
            Afficher tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {templateThumbnails.length > 0 ? (
            templateThumbnails.map(thumb => (
              <div key={thumb.id} className="relative aspect-video rounded-xl overflow-hidden bg-[#181818] group cursor-pointer" onClick={() => thumb.imageUrl && handleDownload(thumb.imageUrl)}>
                {thumb.imageUrl && <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-[11px] text-white/80 line-clamp-1">{thumb.prompt}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-[#181818] rounded-xl p-4 text-center">
              <Image className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-[11px] text-zinc-500">Génère ta première miniature pour la retrouver ici comme modèle</p>
              <button onClick={() => setActiveView("generate")} className="mt-2 text-[11px] text-zinc-300 hover:text-white underline transition-colors">
                Créer maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Avatars récents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Avatars récents</h2>
          <button className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
            Afficher tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-14 h-14 rounded-full bg-[#181818] border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick generate CTA */}
      <button
        onClick={() => setActiveView("generate")}
        className="w-full py-4 rounded-xl bg-[#181818] border border-white/5 flex items-center justify-center gap-2 text-sm text-zinc-300 hover:text-white hover:border-white/10 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Générer une miniature
      </button>
    </div>
  );

  const handleInspirationSubmit = () => {
    if (!inspirationUrl.trim()) {
      toast.error("Entre une URL d'image ou un lien Pinterest");
      return;
    }
    // Try to extract image URL from Pinterest
    let imgUrl = inspirationUrl.trim();
    if (imgUrl.includes("pinterest.")) {
      // Pinterest links need to be resolved - use a placeholder approach
      toast.info("Lien Pinterest détecté — extraction de l'image en cours...");
      // For Pinterest, we'll use the URL directly as inspiration context
      setInspirationImage(imgUrl);
    } else {
      setInspirationImage(imgUrl);
      toast.success("Image d'inspiration chargée !");
    }
    // Auto-fill prompt with description hint
    if (!prompt.trim()) {
      setPrompt("Reproduis le style de cette image d'inspiration pour créer une miniature YouTube virale");
    }
  };

  const handleInspirationFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier non supporté — choisis une image (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 8 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setInspirationImage(String(reader.result || ""));
      setInspirationUrl("");
      toast.success("Image d'inspiration chargée !");
      if (!prompt.trim()) {
        setPrompt("Reproduis le style de cette image d'inspiration pour créer une miniature YouTube virale");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ===== Generate View =====
  const renderGenerateView = () => (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      <div className="pt-6 pb-4">
        <h1 className="text-lg font-semibold text-white">Générer</h1>
        <p className="text-xs text-zinc-500 mt-1">Crée ta miniature virale</p>
      </div>

      {/* Generate tabs */}
      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-[#181818] rounded-xl">
          <button
            onClick={() => setGenerateTab("text")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              generateTab === "text" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Type className="w-3.5 h-3.5 inline mr-1.5" />
            Texte
          </button>
          <button
            onClick={() => setGenerateTab("image")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              generateTab === "image" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Image className="w-3.5 h-3.5 inline mr-1.5" />
            Image inspirée
          </button>
        </div>
      </div>

      {/* Image inspiration tab */}
      {generateTab === "image" && (
        <div className="mb-6">
          <label className="block text-xs text-zinc-400 mb-2">Image d'inspiration (upload ou lien Pinterest)</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <button
              onClick={() => inspirationFileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#181818] border border-dashed border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400 text-xs transition-all flex-1"
            >
              <Upload className="w-3.5 h-3.5" /> Importer une image depuis mon appareil
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={inspirationUrl}
              onChange={(e) => setInspirationUrl(e.target.value)}
              placeholder="https://www.pinterest.com/pin/... ou URL directe d'une image"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#181818] border border-white/5 text-white placeholder:text-zinc-600 text-sm focus:border-white/10 outline-none transition-all"
            />
            <Button
              onClick={handleInspirationSubmit}
              className="h-10 px-4 text-xs bg-cyan-600 text-white hover:bg-cyan-700 rounded-xl"
            >
              Charger
            </Button>
          </div>
          <input ref={inspirationFileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/*" className="hidden" onChange={handleInspirationFileUpload} />
          {inspirationImage && (
            <div className="mt-3 relative rounded-xl overflow-hidden">
              <img src={inspirationImage} alt="Inspiration" className="w-full h-48 object-cover rounded-xl border border-white/5" />
              <button
                onClick={() => { setInspirationImage(null); setInspirationUrl(""); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-zinc-500 mt-1.5 text-right">Image utilisée comme référence de style</p>
            </div>
          )}
          <p className="text-[10px] text-zinc-600 mt-2">
            Importe une image depuis ton appareil ou colle un lien Pinterest / URL d'image pour t'en inspirer. L'IA reproduira le style, les couleurs et la composition.
          </p>
        </div>
      )}

      {/* Text tab */}
      {generateTab === "text" && (
        <>
      {/* Prompt input */}
      <div className="mb-6">
        <label className="block text-xs text-zinc-400 mb-2">Décris ta miniature</label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Un homme surpris avec un gros plan, fond bleu électrique, texte 'IL A GAGNÉ 100 000€' en gros..."
            className="w-full h-32 px-4 py-3 rounded-xl bg-[#181818] border border-white/5 text-white placeholder:text-zinc-600 text-sm focus:border-white/10 focus:ring-0 outline-none resize-none transition-all"
            maxLength={500}
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-zinc-600">{prompt.length}/500</span>
        </div>
      </div>
        </>
      )}

      {/* Prompt input always visible for image tab too */}
      {generateTab === "image" && !prompt && (
        <div className="mb-6">
          <label className="block text-xs text-zinc-400 mb-2">Instructions supplémentaires (optionnel)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Ajoute du texte 'TOP 10', rends-le plus dramatique..."
            className="w-full h-20 px-4 py-3 rounded-xl bg-[#181818] border border-white/5 text-white placeholder:text-zinc-600 text-sm focus:border-white/10 outline-none resize-none transition-all"
            maxLength={500}
          />
        </div>
      )}

      {/* Prompt input */}
      <div className="mb-6">
        <label className="block text-xs text-zinc-400 mb-2">Décris ta miniature</label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Un homme surpris avec un gros plan, fond bleu électrique, texte 'IL A GAGNÉ 100 000€' en gros..."
            className="w-full h-32 px-4 py-3 rounded-xl bg-[#181818] border border-white/5 text-white placeholder:text-zinc-600 text-sm focus:border-white/10 focus:ring-0 outline-none resize-none transition-all"
            maxLength={500}
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-zinc-600">{prompt.length}/500</span>
        </div>
      </div>

      {/* Style selector */}
      <div className="mb-6">
        <label className="block text-xs text-zinc-400 mb-2">Style</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                style === s.id
                  ? "bg-white text-black"
                  : "bg-[#181818] text-zinc-400 border border-white/5 hover:border-white/10"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-6">
        <label className="block text-xs text-zinc-400 mb-2">Quantité</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(q => (
            <button
              key={q}
              onClick={() => setQuantity(q)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                quantity === q
                  ? "bg-white text-black"
                  : "bg-[#181818] text-zinc-400 border border-white/5 hover:border-white/10"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Cost + Generate button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-600">
          Coût : {quantity} crédit{quantity > 1 ? "s" : ""} ({credits?.credits ?? 10} restants)
        </span>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || prompt.length < 10}
          className="bg-white text-black hover:bg-white/90 rounded-xl px-6 h-10 text-sm font-medium"
        >
          {isGenerating ? (
            <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Génération...</>
          ) : (
            <><Sparkles className="mr-2 w-4 h-4" />Générer</>
          )}
        </Button>
      </div>

      {/* Batch mode toggle */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <label className="block text-xs text-zinc-400 mb-2">Mode lot (une description par ligne)</label>
        <textarea
          value={batchPrompts}
          onChange={(e) => setBatchPrompts(e.target.value)}
          placeholder={`Un scientifique dans un labo futuriste\nUn chat sur un skateboard\nUn paysage de montagnes au coucher du soleil`}
          className="w-full h-40 px-4 py-3 rounded-xl bg-[#181818] border border-white/5 text-white placeholder:text-zinc-600 text-sm focus:border-white/10 outline-none resize-none transition-all font-mono text-xs"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-zinc-600">
            {batchPrompts.split("\n").filter(p => p.trim().length >= 10).length} miniature(s)
          </span>
          <Button
            onClick={handleBatchGenerate}
            disabled={isBatchGenerating || !batchPrompts.trim()}
            variant="outline"
            className="bg-[#181818] border-white/5 text-zinc-300 hover:text-white rounded-xl px-4 h-9 text-xs"
          >
            {isBatchGenerating ? <><Loader2 className="mr-1.5 w-3.5 h-3.5 animate-spin" />En cours...</> : "Générer le lot"}
          </Button>
        </div>
      </div>
    </div>
  );

  // ===== Team View =====
  const renderTeamView = () => (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Équipe</h1>
          <p className="text-xs text-zinc-500 mt-1">Gère tes collaborateurs</p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-white text-black hover:bg-white/90 rounded-lg h-8 text-xs font-medium px-3"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Inviter
        </Button>
      </div>

      {/* Members */}
      <div className="mb-6">
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Membres</h2>
        <div className="space-y-2">
          {/* Self */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#181818]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-xs text-white font-medium">{user?.name || "Moi"}</p>
                <p className="text-[10px] text-zinc-500">Propriétaire</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">Admin</span>
          </div>
          {teamMembers?.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-[#181818]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                  {member.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-xs text-white font-medium">{member.name || "Membre"}</p>
                  <p className="text-[10px] text-zinc-500">{member.email || ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${member.role === "admin" ? "bg-white/10 text-zinc-300" : "bg-[#09090B] text-zinc-500"}`}>
                  {member.role}
                </span>
                <button
                  onClick={() => removeMutation.mutate({ userId: member.userId })}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Tâches & Validation</h2>
        {teamTasks && teamTasks.length > 0 ? (
          <div className="space-y-2">
            {teamTasks.map(task => (
              <div key={task.id} className="p-3 rounded-xl bg-[#181818]">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    task.status === "approved" ? "bg-green-500/20 text-green-400" :
                    task.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    task.status === "reviewing" ? "bg-yellow-500/20 text-yellow-400" :
                    task.status === "cancelled" ? "bg-zinc-700 text-zinc-400" :
                    "bg-white/10 text-zinc-300"
                  }`}>
                    {task.status === "pending" ? "En attente" : task.status === "reviewing" ? "En révision" : task.status === "approved" ? "Approuvé" : task.status === "rejected" ? "Rejeté" : "Annulé"}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(task.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {task.comment && <p className="text-xs text-zinc-400 mb-2">{task.comment}</p>}
                <div className="flex gap-1.5 flex-wrap">
                  {task.status !== "approved" && task.status !== "cancelled" && (
                    <button onClick={() => handleUpdateTask(task.id, "approved")} className="px-2.5 py-1 rounded-md text-[10px] bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />Approuver
                    </button>
                  )}
                  {task.status !== "rejected" && task.status !== "cancelled" && (
                    <button onClick={() => handleUpdateTask(task.id, "rejected")} className="px-2.5 py-1 rounded-md text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <XCircle className="w-3 h-3 inline mr-1" />Rejeter
                    </button>
                  )}
                  {task.status === "pending" && (
                    <button onClick={() => handleUpdateTask(task.id, "reviewing")} className="px-2.5 py-1 rounded-md text-[10px] bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors">
                      En révision
                    </button>
                  )}
                  <button onClick={() => handleUpdateTask(task.id, "cancelled")} className="px-2.5 py-1 rounded-md text-[10px] bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ListChecks className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Aucune tâche en cours</p>
          </div>
        )}
      </div>
    </div>
  );

  // ===== All Generations View =====
  const displayThumbnails = (filteredThumbnails ?? []).filter(t => t.status === "completed");
  const renderAllGenerationsView = () => (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Toutes les générations</h1>
          <p className="text-xs text-zinc-500 mt-1">{displayThumbnails.length} miniature(s) affichée(s)</p>
        </div>
        <Button
          onClick={() => setActiveView("generate")}
          className="bg-white text-black hover:bg-white/90 rounded-lg h-8 text-xs font-medium px-3"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle
        </Button>
      </div>

      {/* v5 : search & filters */}
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Rechercher par description ou titre YouTube…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#181818] border border-white/5 text-white placeholder:text-zinc-600 text-sm focus:border-white/10 outline-none transition-all"
          />
          {filterQuery && (
            <button onClick={() => setFilterQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filterStyle} onChange={e => setFilterStyle(e.target.value)} className="px-3 py-2 rounded-lg bg-[#181818] border border-white/5 text-xs text-zinc-300 outline-none">
            <option value="all">Tous les styles</option>
            {STYLES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
          </select>
          <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-lg bg-[#181818] border border-white/5 text-xs text-zinc-300 outline-none">
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
          </select>
          <select value={filterYoutube} onChange={e => setFilterYoutube(e.target.value)} className="px-3 py-2 rounded-lg bg-[#181818] border border-white/5 text-xs text-zinc-300 outline-none">
            <option value="all">Tout statut</option>
            <option value="planned">Planifié YouTube</option>
            <option value="unplanned">Non planifié</option>
          </select>
        </div>
      </div>

      {loadingThumbs ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-[#181818] animate-pulse" />
          ))}
        </div>
      ) : completedThumbnails.length === 0 ? (
        <div className="text-center py-16">
          <Image className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Aucune miniature générée</p>
          <button onClick={() => setActiveView("generate")} className="mt-3 text-xs text-zinc-300 hover:text-white underline">
            Créer ta première miniature
          </button>
        </div>
      ) : displayThumbnails.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Aucun résultat pour ces filtres</p>
          <button onClick={() => { setFilterQuery(""); setFilterStyle("all"); setFilterDate("all"); setFilterYoutube("all"); }} className="mt-3 text-xs text-zinc-300 hover:text-white underline">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayThumbnails.map(thumb => (
            <div key={thumb.id} className="relative aspect-video rounded-xl overflow-hidden bg-[#181818] group">
              <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />
              {thumb.youtubeStatus === "planned" && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-cyan-500/30">
                  <CalendarClock className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-cyan-300 font-medium">Planifié</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs text-white/80 line-clamp-1">{thumb.prompt}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {STYLE_LABELS[thumb.style ?? "viral"] || thumb.style} · {new Date(thumb.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => setPreviewTarget(thumb)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Aperçu">
                  <Eye className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => handleDownload(thumb.imageUrl)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Télécharger">
                  <Download className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => handleOpenPlan(thumb)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Planifier pour YouTube">
                  <CalendarClock className={`w-4 h-4 ${thumb.youtubeStatus === "planned" ? "text-cyan-400" : "text-white"}`} />
                </button>
                <button onClick={() => handleLike(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-pink-500/20 transition-colors" title="Favori">
                  <Star className={`w-4 h-4 ${likedThumbs[thumb.id]?.liked ? "text-yellow-400 fill-yellow-400" : "text-white"}`} />
                </button>
                <button onClick={() => handleShare(thumb.id, thumb.imageUrl || "", thumb.prompt)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Partager">
                  <Share2 className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => handleCreateTask(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Valider (créer une tâche)">
                  <ListChecks className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => navigate(`/editor?image=${encodeURIComponent(thumb.imageUrl || "")}`)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Modifier (Canva)">
                  <Type className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => handleDelete(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 transition-colors" title="Supprimer">
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ===== Main render =====
  return (
    <div className="min-h-screen bg-[#000]">
      {renderHeader()}
      <main className="pt-2">
        {activeView === "home" && renderHomeView()}
        {activeView === "generate" && renderGenerateView()}
        {activeView === "team" && renderTeamView()}
        {activeView === "all-generations" && renderAllGenerationsView()}
      </main>

      {/* Floating nav (like Youthumb) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-[#181818] border border-white/5 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              activeView === "home" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Accueil</span>
          </button>
          <button
            onClick={() => setActiveView("generate")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              activeView === "generate" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Générer</span>
          </button>
          <button
            onClick={() => setActiveView("team")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              activeView === "team" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Équipe</span>
          </button>
        </div>
      </div>

      {/* Bottom spacing for floating nav */}
      <div className="h-24" />

      {/* v5 : YouTube Planning Dialog */}
      {planTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={handlePlanCancel}>
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" /> Planifier pour YouTube Studio
              </h3>
              <button onClick={handlePlanCancel} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-4 mb-4">
              <img src={planTarget.imageUrl} alt={planTarget.prompt} className="w-full aspect-video object-cover rounded-lg border border-white/10" />
              <div>
                <p className="text-xs text-zinc-400 line-clamp-4">{planTarget.prompt}</p>
                {displayThumbnails.find(t => t.id === planTarget.id)?.youtubeStatus === "planned" && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] text-cyan-300">
                    <CalendarClock className="w-3 h-3" /> Déjà planifiée
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Titre de la vidéo YouTube</label>
                <input
                  value={planTitle}
                  onChange={e => setPlanTitle(e.target.value)}
                  placeholder="Colle le titre de ta vidéo…"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-white/5 text-white text-sm placeholder:text-zinc-600 focus:border-white/10 outline-none"
                  maxLength={200}
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-zinc-600">
                Le titre et l'image PNG 1280×720 seront prêts à copier-coller dans YouTube Studio (Contenu → Importer).
              </p>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(planTitle.trim());
                    toast.success("Titre copié !");
                  } catch {
                    // Clipboard unavailable — noop
                  }
                }}
                disabled={!planTitle.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-zinc-300 transition-colors disabled:opacity-40"
              >
                <Copy className="w-3 h-3" /> Copier le titre de la vidéo
              </button>
              <div className="flex gap-2">
                <Button
                  onClick={handlePlanConfirm}
                  disabled={!planTitle.trim() || planMutation.isPending}
                  className="bg-white text-black hover:bg-white/90 rounded-xl flex-1 text-sm h-9"
                >
                  {planMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarClock className="w-4 h-4 mr-1.5" />}
                  Planifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyShare(planTarget.id, planTarget.imageUrl)}
                  className="border-white/5 text-zinc-300 rounded-xl text-sm h-9 px-3"
                >
                  Copier l'image
                </Button>
                {displayThumbnails.find(t => t.id === planTarget.id)?.youtubeStatus === "planned" && (
                  <Button
                    variant="outline"
                    onClick={() => { unplanMutation.mutate({ thumbnailId: planTarget.id }); handlePlanCancel(); }}
                    className="border-white/5 text-zinc-300 hover:text-red-400 rounded-xl text-sm h-9 px-3"
                  >
                    Annuler le plan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-4">Inviter un collaborateur</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">ID utilisateur</label>
                <input
                  type="number"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="Ex: 42"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09090B] border border-white/5 text-white text-sm placeholder:text-zinc-600 focus:border-white/10 outline-none"
                />
              </div>
              <p className="text-[10px] text-zinc-600">
                L'utilisateur doit déjà avoir un compte Minia IA. Trouve son ID dans la base de données.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const userId = parseInt(inviteEmail);
                    if (isNaN(userId)) {
                      toast.error("Entre un ID utilisateur valide (nombre)");
                      return;
                    }
                    inviteMutation.mutate({ userId });
                  }}
                  disabled={!inviteEmail || inviteMutation.isPending}
                  className="bg-white text-black hover:bg-white/90 rounded-xl flex-1 text-sm"
                >
                  {inviteMutation.isPending ? "Invitation..." : "Inviter"}
                </Button>
                <Button variant="outline" onClick={() => setShowInviteModal(false)} className="border-white/5 text-zinc-400 rounded-xl text-sm">
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview dialog (icône Aperçu sur les cartes) */}
      {previewTarget && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewTarget(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0a0a0a] border border-zinc-800 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewTarget.imageUrl}
              alt={previewTarget.prompt}
              className="w-full aspect-video object-cover"
            />
            <div className="p-4">
              <p className="text-sm text-white/90 line-clamp-2">{previewTarget.prompt}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleDownload(previewTarget.imageUrl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger
                </button>
                <button
                  onClick={() => navigate(`/editor?image=${encodeURIComponent(previewTarget.imageUrl || "")}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white transition-colors"
                >
                  <Type className="w-3.5 h-3.5" /> Modifier
                </button>
                <button
                  onClick={() => setPreviewTarget(null)}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
