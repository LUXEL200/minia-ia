import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Image, CreditCard, Download, Trash2, Loader2, Sparkles,
  ArrowRight, Home, MessageSquare, Plus, Users, ListChecks,
  Heart, CheckCircle2, XCircle, ChevronRight, UserCircle2,
  Menu, LayoutDashboard, UserRound, Grid3X3, Eye,
  RectangleHorizontal, Star, Trash, Zap, Sun, Key,
  Settings, Bell, LogOut, Type, Shield,
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarPlatform, setSidebarPlatform] = useState<"compte" | "miniatures" | "personnes" | "modèles">("compte");
  const [likedThumbs, setLikedThumbs] = useState<Record<number, { count: number; liked: boolean }>>({});
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [generateTab, setGenerateTab] = useState<"text" | "image">("text");
  const [inspirationUrl, setInspirationUrl] = useState("");
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);

  // Theme
  const { theme, toggleTheme } = useTheme();

  // Auth gate
  const isAuthed = !authLoading && isAuthenticated && !!user;

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

  // ===== Hamburger Sidebar =====
  const renderSidebar = () => (
    <>
      {/* Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-[300px] max-w-[85vw] z-[70] bg-[#111] border-r border-white/5 shadow-2xl transition-transform duration-300 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pb-4">
          {/* Org info */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{user?.name || "Mon organisation"}</p>
                <p className="text-[10px] text-zinc-500 truncate">Organisation pour {user?.email || "moi"}</p>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="ml-auto text-zinc-500 hover:text-white transition-colors p-1"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Create thumbnail CTA */}
          <div className="p-4 border-b border-white/5">
            <button
              onClick={() => { setShowSidebar(false); setActiveView("generate"); }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Créer une miniature
            </button>
          </div>

          {/* Platform selector */}
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Plate-forme</p>
            <button
              onClick={() => setSidebarPlatform("compte")}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#181818] border border-white/5 text-xs text-zinc-300"
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Compte
              </span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
            </button>
          </div>

          {/* YouThumb section */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Minia IA</p>
            <nav className="space-y-1">
              <button
                onClick={() => { setShowSidebar(false); setActiveView("home"); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Tableau de bord
              </button>
              <button
                onClick={() => { setShowSidebar(false); setActiveView("all-generations"); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <Image className="w-4 h-4" />
                Miniatures
              </button>
              <button
                onClick={() => { setShowSidebar(false); setActiveView("team"); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <UserRound className="w-4 h-4" />
                Personnes
              </button>
              <button
                onClick={() => { setShowSidebar(false); setActiveView("home"); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                Modèles
              </button>
            </nav>
          </div>

          {/* Extra tools section */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Outils supplémentaires</p>
            <nav className="space-y-1">
              <Link
                href="/avatars"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <UserCircle2 className="w-4 h-4" />
                Avatars
              </Link>
              <Link
                href="/preview"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <Eye className="w-4 h-4" />
                Aperçu miniature
              </Link>
              <Link
                href="/endcards"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <RectangleHorizontal className="w-4 h-4" />
                Générateur de cartes YouTube
              </Link>
              <Link
                href="/favorites"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <Star className="w-4 h-4" />
                Favoris
              </Link>
              <Link
                href="/trash"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
              >
                <Trash className="w-4 h-4" />
                Poubelle
              </Link>
            </nav>
          </div>

          {/* Upgrade CTA */}
          <div className="mt-auto px-4 pt-4">
            <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-white font-medium mb-1">Passez à la version Pro</p>
              <p className="text-[10px] text-zinc-500 mb-3">Débloquez toutes les fonctionnalités et améliorez vos vignettes.</p>
              <Link
                href="/pricing"
                onClick={() => setShowSidebar(false)}
                className="block w-full py-2.5 rounded-lg bg-gradient-to-r from-[#EC4899] to-[#F43F5E] text-white text-xs font-medium text-center hover:opacity-90 transition-opacity"
              >
                <Zap className="w-3 h-3 inline mr-1" />
                Mise à niveau
              </Link>
            </div>
          </div>

          {/* User profile with dropdown */}
          <div className="px-4 pt-3 mt-auto border-t border-white/5 relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#181818] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-medium truncate">{user?.name || "Moi"}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email || ""}</p>
              </div>
              <svg className="w-3 h-3 text-zinc-500 flex-shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showProfileMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-1 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-80">
                {/* User info in dropdown */}
                <div className="p-3 border-b border-white/5">
                  <p className="text-xs text-white font-medium">{user?.name || "Moi"}</p>
                  <p className="text-[10px] text-zinc-500">{user?.email || ""}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/pricing"
                    onClick={() => { setShowProfileMenu(false); setShowSidebar(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-[#181818] transition-colors"
                  >
                    <Zap className="w-4 h-4 text-pink-500" />
                    <span className="font-medium">Passez à la version Pro</span>
                  </Link>
                </div>

                <div className="py-1 border-t border-white/5">
                  <button
                    onClick={() => { setShowProfileMenu(false); if (toggleTheme) { toggleTheme(); toast.success(theme === "dark" ? "Mode clair activé" : "Mode sombre activé"); } }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                  >
                    <Sun className="w-4 h-4" />
                    Mode clair
                  </button>
                  <Link
                    href="/account"
                    onClick={() => { setShowProfileMenu(false); setShowSidebar(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                  >
                    <UserRound className="w-4 h-4" />
                    Compte
                  </Link>
                  <Link
                    href="/api-keys"
                    onClick={() => { setShowProfileMenu(false); setShowSidebar(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Clés API
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => { setShowProfileMenu(false); setShowSidebar(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                  <Link
                    href="/billing"
                    onClick={() => { setShowProfileMenu(false); setShowSidebar(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Facturation
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => { setShowProfileMenu(false); setShowSidebar(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                    <span className="ml-auto bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</span>
                  </Link>
                </div>

                {/* Admin link — visible only to admins */}
                {user?.role === "admin" && (
                  <div className="py-1 border-t border-white/5">
                    <Link
                      href="/admin"
                      onClick={() => { setShowProfileMenu(false); setShowSidebar(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Super Admin
                      <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">ADMIN</span>
                    </Link>
                  </div>
                )}

                <div className="py-1 border-t border-white/5">
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowSidebar(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );

  // ===== Header =====
  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-[#000]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSidebar(true)} className="text-zinc-400 hover:text-white transition-colors p-1">
            <Menu className="w-5 h-5" />
          </button>
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
                      <button onClick={() => handleDownload(thumb.imageUrl)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Télécharger">
                        <Download className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleLike(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-pink-500/20 transition-colors" title="Favori">
                        <Heart className={`w-4 h-4 ${likedThumbs[thumb.id]?.liked ? "text-pink-500 fill-pink-500" : "text-white"}`} />
                      </button>
                      <button onClick={() => navigate(`/editor?image=${encodeURIComponent(thumb.imageUrl || "")}`)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Éditer">
                        <Type className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => handleCreateTask(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Créer une tâche">
                        <ListChecks className="w-4 h-4 text-white" />
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
          <label className="block text-xs text-zinc-400 mb-2">URL d'inspiration (image ou lien Pinterest)</label>
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
            Collez un lien Pinterest ou une URL d'image pour vous en inspirer. L'IA reproduira le style, les couleurs et la composition.
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
  const renderAllGenerationsView = () => (
    <div className="max-w-2xl mx-auto px-4 pb-8">
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Toutes les générations</h1>
          <p className="text-xs text-zinc-500 mt-1">{completedThumbnails.length} miniature(s) créée(s)</p>
        </div>
        <Button
          onClick={() => setActiveView("generate")}
          className="bg-white text-black hover:bg-white/90 rounded-lg h-8 text-xs font-medium px-3"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle
        </Button>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {completedThumbnails.map(thumb => (
            <div key={thumb.id} className="relative aspect-video rounded-xl overflow-hidden bg-[#181818] group">
              <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-xs text-white/80 line-clamp-1">{thumb.prompt}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {STYLE_LABELS[thumb.style ?? "viral"] || thumb.style} · {new Date(thumb.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => handleDownload(thumb.imageUrl)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Télécharger">
                  <Download className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => handleLike(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-pink-500/20 transition-colors" title="Favori">
                  <Heart className={`w-4 h-4 ${likedThumbs[thumb.id]?.liked ? "text-pink-500 fill-pink-500" : "text-white"}`} />
                </button>
                <button onClick={() => navigate(`/editor?image=${encodeURIComponent(thumb.imageUrl || "")}`)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Éditer">
                  <Type className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => handleCreateTask(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Créer une tâche">
                  <ListChecks className="w-4 h-4 text-white" />
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
      {renderSidebar()}
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
    </div>
  );
}
