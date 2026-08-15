import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CalendarView from "@/components/CalendarView";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { toastRich } from "@/lib/toasts";
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
  const [activeView, setActiveView] = useState<"home" | "generate">("home");
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

  // v8 : YouTube planning dialog state + upcoming schedules countdown
  const [planTarget, setPlanTarget] = useState<{ id: number; imageUrl: string; prompt: string } | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [planWhen, setPlanWhen] = useState<"tomorrow" | "in2h" | "+1week">("tomorrow");

  const defaultScheduleAt = useCallback((when: "tomorrow" | "in2h" | "+1week") => {
    const d = new Date();
    if (when === "in2h") d.setHours(d.getHours() + 2);
    else if (when === "+1week") d.setDate(d.getDate() + 7);
    else { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); }
    return d;
  }, []);

  // tick pour le compte à rebours live
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // v8 : rappels de planification (schedules)
  const { data: upcomingSchedules, refetch: refetchSchedules } = trpc.schedules.list.useQuery(undefined, { enabled: isAuthed });
  const deleteSchedule = trpc.schedules.delete.useMutation({
    onSuccess: () => {
      refetchSchedules();
      refetchThumbs();
      utils.schedules.list.invalidate();
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toastRich("warning", "Planification annulée", { description: "La miniature a été retirée du calendrier." });
    },
    onError: () => toastRich("error", "Erreur lors de l'annulation"),
  });
  const createSchedule = trpc.schedules.create.useMutation({
    onSuccess: () => {
      refetchSchedules();
      utils.schedules.list.invalidate();
      utils.schedules.listMonth.invalidate();
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toastRich("success", "Nouvelle planification créée", { description: "Un rappel J-1 sera affiché dans la cloche." });
    },
    onError: (err) => toastRich("error", "Impossible de créer la planification", { description: err.message }),
  });

  /** Formate un compte à rebours : "dans 1j 4h 12m" ou "En retard !" */
  const countdownOf = (scheduledAt: Date) => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return "En retard !";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `dans ${d}j ${h}h ${m}m`;
    if (h > 0) return `dans ${h}h ${m}m`;
    return `dans ${m}m`;
  };
  const planMutation = trpc.thumbnail.planYoutube.useMutation({
    onSuccess: () => {
      refetchThumbs();
      refetchSchedules();
      utils.schedules.list.invalidate();
      toastRich("success", "Miniature planifiée !", { description: "Elle apparaît dans le calendrier. Ouvre YouTube Studio pour l'importer." });
    },
    onError: (err) => toastRich("error", "Impossible de planifier", { description: err.message || "Une erreur est survenue" }),
  });
  const unplanMutation = trpc.thumbnail.unplanYoutube.useMutation({
    onSuccess: () => {
      refetchThumbs();
      utils.schedules.list.invalidate();
      toastRich("warning", "Planification annulée", { description: "La miniature a été retirée du calendrier." });
    },
    onError: () => toastRich("error", "Impossible d'annuler la planification"),
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

  const utils = trpc.useUtils();
  const trashRestoreMutation = trpc.trash.restore.useMutation();
  const generateMutation = trpc.thumbnail.generate.useMutation();
  const batchMutation = trpc.batch.generate.useMutation();
  const deleteMutation = trpc.thumbnail.delete.useMutation({
    onSuccess: (_data, vars) => {
      refetchThumbs();
      refetchCredits();
      toastRich("success", "Miniature supprimée", {
        description: "Elle est dans la Poubelle et peut être restaurée.",
        undo: {
          onClick: async () => {
            try {
              const trashedList = await utils.trash.list.fetch();
              const trashedItem = trashedList.find((t: any) => t.thumbnailId === vars.id || t.id === vars.id);
              if (!trashedItem) throw new Error("Introuvable dans la poubelle");
              await trashRestoreMutation.mutateAsync({ trashId: trashedItem.id });
              refetchThumbs();
              toastRich("success", "Miniature restaurée");
            } catch {
              toastRich("error", "Impossible de restaurer la miniature");
            }
          },
        },
      });
    },
    onError: () => toastRich("error", "Erreur lors de la suppression"),
  });
  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: (data, vars) => {
      setLikedThumbs(prev => ({ ...prev, [vars.thumbnailId]: { count: data.count, liked: data.liked } }));
      toastRich(data.liked ? "success" : "info", data.liked ? "Ajouté aux favoris" : "Retiré des favoris");
    },
    onError: () => toastRich("error", "Impossible de mettre à jour le favori"),
  });
  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => { refetchTeam(); setShowInviteModal(false); setInviteEmail(""); toastRich("success", "Membre invité !", { description: "L'invitation a été envoyée par e-mail." }); },
    onError: (err) => toastRich("error", "Invitation échouée", { description: err.message || "Une erreur est survenue" }),
  });
  const removeMutation = trpc.team.remove.useMutation({
    onSuccess: () => { refetchTeam(); toastRich("success", "Membre retiré"); },
    onError: () => toastRich("error", "Impossible de retirer le membre"),
  });
  const createTaskMutation = trpc.team.createTask.useMutation({
    onSuccess: () => { refetchTasks(); toastRich("success", "Tâche de validation créée", { description: "Les membres de l'équipe peuvent maintenant la valider ou la refuser." }); },
    onError: () => toastRich("error", "Impossible de créer la tâche"),
  });
  const updateTaskMutation = trpc.team.updateTask.useMutation({
    onSuccess: (_d, vars) => {
      refetchTasks();
      const labels = { pending: "En attente", reviewing: "En revue", approved: "Validée", rejected: "Refusée", cancelled: "Annulée" } as const;
      toastRich(vars.status === "approved" ? "success" : vars.status === "rejected" || vars.status === "cancelled" ? "warning" : "info", `Statut : ${labels[vars.status]}`);
    },
    onError: () => toastRich("error", "Impossible de mettre à jour le statut"),
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
    // v8 : créer aussi le rappel de publication avec date/heure
    const scheduledAt = defaultScheduleAt(planWhen);
    try {
      await createSchedule.mutateAsync({
        thumbnailId: planTarget.id,
        youtubeTitle: planTitle.trim(),
        scheduledAt: scheduledAt.toISOString(),
      });
    } catch (err: any) {
      // Le rappel échoue sans bloquer la planification du titre
      toast.error(`Rappel : ${err.message || "non enregistré"}`);
    }
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
          <p className="text-muted-foreground text-sm">Chargement...</p>
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
          <p className="text-muted-foreground text-sm mb-6">Connecte-toi pour accéder à ton espace de création.</p>
          <Button
            onClick={() => startLogin()}
            className="w-full py-5 text-base font-medium bg-white text-black hover:bg-white/90 rounded-[20px]"
          >
            Se connecter
          </Button>
          <Link href="/" className="block mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium">Tableau de bord</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-foreground">
            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
            {credits?.credits ?? 10} crédit{credits && credits.credits !== 1 ? "s" : ""}
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
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
        <p className="text-xs text-muted-foreground mt-1">Aperçu de ton espace de création</p>
      </div>

      {/* Stat Cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-muted rounded-[20px] p-4 relative">
          <Image className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Miniatures</span>
          <p className="text-2xl font-bold text-white mt-2">{completedThumbnails.length}</p>
          <span className="text-[10px] text-muted-foreground">Génération totale</span>
        </div>
        <div className="bg-muted rounded-[20px] p-4 relative">
          <Sparkles className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Générations</span>
          <p className="text-2xl font-bold text-white mt-2">{totalGenerations}</p>
          <span className="text-[10px] text-muted-foreground">Tous les projets achevés</span>
        </div>
        <div className="bg-muted rounded-[20px] p-4 relative">
          <UserCircle2 className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Avatars</span>
          <p className="text-2xl font-bold text-white mt-2">0</p>
          <span className="text-[10px] text-muted-foreground">Génération totale</span>
        </div>
        <div className="bg-muted rounded-[20px] p-4 relative">
          <CreditCard className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Crédits</span>
          <p className="text-2xl font-bold text-white mt-2">{credits?.credits ?? 10}</p>
          <span className="text-[10px] text-muted-foreground">Disponible</span>
        </div>
      </div>

      {/* v8 : Miniatures planifiées avec compte à rebours */}
      {(upcomingSchedules ?? []).length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-cyan-400" /> À publier bientôt
            </h2>
            <span className="text-[10px] text-muted-foreground">Rappels automatiques</span>
          </div>
          <div className="space-y-2">
            {(upcomingSchedules ?? []).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-muted border border-border rounded-[20px]">
                <div className="w-24 flex-shrink-0">
                  {s.imageUrl && <img src={s.imageUrl} alt="" className="w-full aspect-video object-cover rounded-lg" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{s.youtubeTitle || s.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(s.scheduledAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-cyan-500/15 text-[10px] text-cyan-300">
                    <CalendarClock className="w-3 h-3" /> {countdownOf(s.scheduledAt)}
                  </span>
                </div>
                <button
                  onClick={() => deleteSchedule.mutate({ id: s.id })}
                  className="p-2 text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                  title="Annuler la planification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* v9 : Vue Calendrier des publications planifiées */}
      <CalendarView />

      {/* Vos personnes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Vos personnes</h2>
          <button
            onClick={() => navigate("/personnes")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Afficher tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* Self */}
          <div className="flex-shrink-0 w-40 bg-muted rounded-[20px] p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-xs text-white font-medium truncate">{user?.name || "Créateur"}</p>
              <p className="text-[10px] text-muted-foreground">Créateur</p>
            </div>
          </div>
          {/* Team members */}
          {teamMembers?.slice(0, 3).map(member => (
            <div key={member.id} className="flex-shrink-0 w-40 bg-muted rounded-[20px] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                {member.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-xs text-white font-medium truncate">{member.name || "Membre"}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
              </div>
            </div>
          ))}
          {/* Add member */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
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
            onClick={() => navigate("/miniatures")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Afficher tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {loadingThumbs ? (
          <div className="aspect-video rounded-[20px] bg-muted animate-pulse" />
        ) : recentThumbnails.length === 0 ? (
          <div className="bg-muted rounded-[20px] p-8 text-center">
            <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Aucune miniature générée</p>
            <p className="text-[10px] text-muted-foreground mt-1">Va dans Générer pour créer ta première miniature !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentThumbnails.slice(0, 4).map(thumb => (
              <div key={thumb.id} className="relative aspect-video rounded-[20px] overflow-hidden bg-muted group">
                {thumb.status === "generating" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  </div>
                ) : thumb.status === "completed" && thumb.imageUrl ? (
                  <>
                    <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white/80 line-clamp-1">{thumb.prompt}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(thumb.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => setPreviewTarget(thumb)} className="p-2 rounded-full bg-muted/80 hover:bg-white/20 transition-colors" title="Aperçu">
                        <Eye className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleDownload(thumb.imageUrl)} className="p-2 rounded-full bg-muted/80 hover:bg-white/20 transition-colors" title="Télécharger">
                        <Download className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleLike(thumb.id)} className="p-2 rounded-full bg-muted/80 hover:bg-pink-500/20 transition-colors" title="Favori">
                        <Star className={`w-4 h-4 ${likedThumbs[thumb.id]?.liked ? "text-yellow-400 fill-yellow-400" : "text-white"}`} />
                      </button>
                      <button onClick={() => handleShare(thumb.id, thumb.imageUrl || "", thumb.prompt)} className="p-2 rounded-full bg-muted/80 hover:bg-white/20 transition-colors" title="Partager">
                        <Share2 className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleCreateTask(thumb.id)} className="p-2 rounded-full bg-muted/80 hover:bg-cyan-500/20 transition-colors" title="Valider (créer une tâche)">
                        <ListChecks className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => navigate(`/editor?image=${encodeURIComponent(thumb.imageUrl || "")}`)} className="p-2 rounded-full bg-muted/80 hover:bg-cyan-500/20 transition-colors" title="Modifier (Canva)">
                        <Type className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleDelete(thumb.id)} className="p-2 rounded-full bg-muted/80 hover:bg-red-500/20 transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-muted-foreground" />
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
          <Link href="/templates" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Afficher tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {templateThumbnails.length > 0 ? (
            templateThumbnails.map(thumb => (
              <div key={thumb.id} className="relative aspect-video rounded-[20px] overflow-hidden bg-muted group cursor-pointer" onClick={() => thumb.imageUrl && handleDownload(thumb.imageUrl)}>
                {thumb.imageUrl && <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-[11px] text-white/80 line-clamp-1">{thumb.prompt}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-muted rounded-[20px] p-4 text-center">
              <Image className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground">Génère ta première miniature pour la retrouver ici comme modèle</p>
              <button onClick={() => setActiveView("generate")} className="mt-2 text-[11px] text-foreground hover:text-foreground underline transition-colors">
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
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Afficher tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-14 h-14 rounded-full bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick generate CTA */}
      <button
        onClick={() => setActiveView("generate")}
        className="w-full py-4 rounded-[20px] bg-muted border border-border flex items-center justify-center gap-2 text-sm text-foreground hover:text-foreground hover:border-border transition-all"
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
        <p className="text-xs text-muted-foreground mt-1">Crée ta miniature virale</p>
      </div>

      {/* Generate tabs */}
      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-muted rounded-[20px]">
          <button
            onClick={() => setGenerateTab("text")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              generateTab === "text" ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="w-3.5 h-3.5 inline mr-1.5" />
            Texte
          </button>
          <button
            onClick={() => setGenerateTab("image")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              generateTab === "image" ? "bg-white text-black" : "text-muted-foreground hover:text-foreground"
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
          <label className="block text-xs text-muted-foreground mb-2">Image d'inspiration (upload ou lien Pinterest)</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <button
              onClick={() => inspirationFileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[20px] bg-muted border border-dashed border-border text-foreground hover:text-foreground hover:border-primary text-xs transition-all flex-1"
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
              className="flex-1 px-4 py-2.5 rounded-[20px] bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-border outline-none transition-all"
            />
            <Button
              onClick={handleInspirationSubmit}
              className="h-10 px-4 text-xs bg-cyan-600 text-white hover:bg-cyan-700 rounded-[20px]"
            >
              Charger
            </Button>
          </div>
          <input ref={inspirationFileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/*" className="hidden" onChange={handleInspirationFileUpload} />
          {inspirationImage && (
            <div className="mt-3 relative rounded-[20px] overflow-hidden">
              <img src={inspirationImage} alt="Inspiration" className="w-full h-48 object-cover rounded-[20px] border border-border" />
              <button
                onClick={() => { setInspirationImage(null); setInspirationUrl(""); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-right">Image utilisée comme référence de style</p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">
            Importe une image depuis ton appareil ou colle un lien Pinterest / URL d'image pour t'en inspirer. L'IA reproduira le style, les couleurs et la composition.
          </p>
        </div>
      )}

      {/* Text tab */}
      {generateTab === "text" && (
        <>
      {/* Prompt input */}
      <div className="mb-6">
        <label className="block text-xs text-muted-foreground mb-2">Décris ta miniature</label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Un homme surpris avec un gros plan, fond bleu électrique, texte 'IL A GAGNÉ 100 000€' en gros..."
            className="w-full h-32 px-4 py-3 rounded-[20px] bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-border focus:ring-0 outline-none resize-none transition-all"
            maxLength={500}
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{prompt.length}/500</span>
        </div>
      </div>
        </>
      )}

      {/* Prompt input always visible for image tab too */}
      {generateTab === "image" && !prompt && (
        <div className="mb-6">
          <label className="block text-xs text-muted-foreground mb-2">Instructions supplémentaires (optionnel)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Ajoute du texte 'TOP 10', rends-le plus dramatique..."
            className="w-full h-20 px-4 py-3 rounded-[20px] bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-border outline-none resize-none transition-all"
            maxLength={500}
          />
        </div>
      )}

      {/* Prompt input */}
      <div className="mb-6">
        <label className="block text-xs text-muted-foreground mb-2">Décris ta miniature</label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Un homme surpris avec un gros plan, fond bleu électrique, texte 'IL A GAGNÉ 100 000€' en gros..."
            className="w-full h-32 px-4 py-3 rounded-[20px] bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-border focus:ring-0 outline-none resize-none transition-all"
            maxLength={500}
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{prompt.length}/500</span>
        </div>
      </div>

      {/* Style selector */}
      <div className="mb-6">
        <label className="block text-xs text-muted-foreground mb-2">Style</label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                style === s.id
                  ? "bg-white text-black"
                  : "bg-muted text-muted-foreground border border-border hover:border-border"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-6">
        <label className="block text-xs text-muted-foreground mb-2">Quantité</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(q => (
            <button
              key={q}
              onClick={() => setQuantity(q)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                quantity === q
                  ? "bg-white text-black"
                  : "bg-muted text-muted-foreground border border-border hover:border-border"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Cost + Generate button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Coût : {quantity} crédit{quantity > 1 ? "s" : ""} ({credits?.credits ?? 10} restants)
        </span>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || prompt.length < 10}
          className="bg-white text-black hover:bg-white/90 rounded-[20px] px-6 h-10 text-sm font-medium"
        >
          {isGenerating ? (
            <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Génération...</>
          ) : (
            <><Sparkles className="mr-2 w-4 h-4" />Générer</>
          )}
        </Button>
      </div>

      {/* Batch mode toggle */}
      <div className="mt-8 pt-6 border-t border-border">
        <label className="block text-xs text-muted-foreground mb-2">Mode lot (une description par ligne)</label>
        <textarea
          value={batchPrompts}
          onChange={(e) => setBatchPrompts(e.target.value)}
          placeholder={`Un scientifique dans un labo futuriste\nUn chat sur un skateboard\nUn paysage de montagnes au coucher du soleil`}
          className="w-full h-40 px-4 py-3 rounded-[20px] bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-border outline-none resize-none transition-all font-mono text-xs"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            {batchPrompts.split("\n").filter(p => p.trim().length >= 10).length} miniature(s)
          </span>
          <Button
            onClick={handleBatchGenerate}
            disabled={isBatchGenerating || !batchPrompts.trim()}
            variant="outline"
            className="bg-muted border-border text-foreground hover:text-foreground rounded-[20px] px-4 h-9 text-xs"
          >
            {isBatchGenerating ? <><Loader2 className="mr-1.5 w-3.5 h-3.5 animate-spin" />En cours...</> : "Générer le lot"}
          </Button>
        </div>
      </div>
    </div>
  );

  // v8 : les vues "Toutes les générations" et "Équipe" sont maintenant des pages dédiées (/miniatures, /personnes)
  const displayThumbnails = [...completedThumbnails];
  const renderAllGenerationsView = () => null;
  const renderTeamView = () => null;
  // ===== Main render =====
  return (
    <div className="min-h-screen bg-[#000]">
      {renderHeader()}
      <main className="pt-2">
        {activeView === "home" && renderHomeView()}
        {activeView === "generate" && renderGenerateView()}
      </main>

      {/* Floating nav (like Youthumb) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-[20px] bg-muted border border-border shadow-2xl shadow-black/50 backdrop-blur-xl">
          <button
            onClick={() => setActiveView("home")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-[20px] transition-all ${
              activeView === "home" ? "bg-muted/80 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Accueil</span>
          </button>
          <button
            onClick={() => setActiveView("generate")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-[20px] transition-all ${
              activeView === "generate" ? "bg-muted/80 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Générer</span>
          </button>
          <button
            onClick={() => navigate("/miniatures")}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-[20px] transition-all text-muted-foreground hover:text-foreground"
          >
            <Image className="w-5 h-5" />
            <span className="text-[10px] font-medium">Miniatures</span>
          </button>
        </div>
      </div>

      {/* Bottom spacing for floating nav */}
      <div className="h-24" />

      {/* v5 : YouTube Planning Dialog */}
      {planTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={handlePlanCancel}>
          <div className="bg-muted border border-border rounded-[20px] p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" /> Planifier pour YouTube Studio
              </h3>
              <button onClick={handlePlanCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-4 mb-4">
              <img src={planTarget.imageUrl} alt={planTarget.prompt} className="w-full aspect-video object-cover rounded-lg border border-border" />
              <div>
                <p className="text-xs text-muted-foreground line-clamp-4">{planTarget.prompt}</p>
                {displayThumbnails.find(t => t.id === planTarget.id)?.youtubeStatus === "planned" && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] text-cyan-300">
                    <CalendarClock className="w-3 h-3" /> Déjà planifiée
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Titre de la vidéo YouTube</label>
                <input
                  value={planTitle}
                  onChange={e => setPlanTitle(e.target.value)}
                  placeholder="Colle le titre de ta vidéo…"
                  className="w-full px-4 py-2.5 rounded-[20px] bg-[#09090B] border border-border text-white text-sm placeholder:text-muted-foreground focus:border-border outline-none"
                  maxLength={200}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Date de publication (rappel)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { key: "in2h", label: "Dans 2h" },
                    { key: "tomorrow", label: "Demain 10h" },
                    { key: "+1week", label: "Dans 7 jours" },
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setPlanWhen(opt.key)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                        planWhen === opt.key
                          ? "bg-white text-black border-white"
                          : "bg-[#09090B] text-muted-foreground border-border hover:border-white/15 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Publication prévue : {defaultScheduleAt(planWhen).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} (avec rappel sur le Tableau de bord).
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">
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
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-[11px] text-foreground transition-colors disabled:opacity-40"
              >
                <Copy className="w-3 h-3" /> Copier le titre de la vidéo
              </button>
              <div className="flex gap-2">
                <Button
                  onClick={handlePlanConfirm}
                  disabled={!planTitle.trim() || planMutation.isPending}
                  className="bg-white text-black hover:bg-white/90 rounded-[20px] flex-1 text-sm h-9"
                >
                  {planMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarClock className="w-4 h-4 mr-1.5" />}
                  Planifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyShare(planTarget.id, planTarget.imageUrl)}
                  className="border-border text-foreground rounded-[20px] text-sm h-9 px-3"
                >
                  Copier l'image
                </Button>
                {displayThumbnails.find(t => t.id === planTarget.id)?.youtubeStatus === "planned" && (
                  <Button
                    variant="outline"
                    onClick={() => { unplanMutation.mutate({ thumbnailId: planTarget.id }); handlePlanCancel(); }}
                    className="border-border text-foreground hover:text-red-400 rounded-[20px] text-sm h-9 px-3"
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
          <div className="bg-muted border border-border rounded-[20px] p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-4">Inviter un collaborateur</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">ID utilisateur</label>
                <input
                  type="number"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="Ex: 42"
                  className="w-full px-4 py-2.5 rounded-[20px] bg-[#09090B] border border-border text-white text-sm placeholder:text-muted-foreground focus:border-border outline-none"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
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
                  className="bg-white text-black hover:bg-white/90 rounded-[20px] flex-1 text-sm"
                >
                  {inviteMutation.isPending ? "Invitation..." : "Inviter"}
                </Button>
                <Button variant="outline" onClick={() => setShowInviteModal(false)} className="border-border text-muted-foreground rounded-[20px] text-sm">
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
            className="relative max-w-2xl w-full bg-[#0a0a0a] border border-zinc-800 rounded-[20px] overflow-hidden"
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
    </div>
  );
}
