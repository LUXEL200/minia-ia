import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, Image, CreditCard, Download, Trash2, Loader2, Sparkles,
  ChevronDown, Play, Clock, CheckCircle2, XCircle, Heart, Users,
  ListChecks, Send, X, Plus, MessageSquare, Filter,
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

type Tab = "generate" | "batch" | "team" | "history";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("viral");
  const [quantity, setQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  // Batch state
  const [batchPrompts, setBatchPrompts] = useState("");
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // Team state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // Likes state
  const [likedThumbs, setLikedThumbs] = useState<Record<number, { count: number; liked: boolean }>>({});

  // tRPC queries
  const { data: thumbnails, isLoading: loadingThumbs, refetch: refetchThumbs } = trpc.thumbnail.list.useQuery();
  const { data: credits, refetch: refetchCredits } = trpc.thumbnail.credits.useQuery();
  const { data: teamMembers, refetch: refetchTeam } = trpc.team.members.useQuery();
  const { data: teamTasks, refetch: refetchTasks } = trpc.team.tasks.useQuery();
  const { data: likesData } = trpc.likes.bulk.useQuery(
    { thumbnailIds: thumbnails?.filter(t => t.status === "completed").map(t => t.id) ?? [] },
    { enabled: (thumbnails?.filter(t => t.status === "completed").length ?? 0) > 0 }
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      startLogin();
    }
  }, [authLoading, isAuthenticated]);

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
      toast.success(`${result.successful} miniature(s) générée(s) !`);
      setPrompt("");
      refetchThumbs();
      refetchCredits();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
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
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération en lot");
    } finally {
      setIsBatchGenerating(false);
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

  const handleLike = (thumbnailId: number) => {
    if (!isAuthenticated) return;
    likeMutation.mutate({ thumbnailId });
  };

  const handleCreateTask = (thumbnailId: number) => {
    createTaskMutation.mutate({ thumbnailId, status: "pending" });
  };

  const handleUpdateTask = (taskId: number, status: "pending" | "reviewing" | "approved" | "rejected" | "cancelled") => {
    updateTaskMutation.mutate({ taskId, status });
  };

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

  const completedThumbnails = thumbnails?.filter(t => t.status === "completed") ?? [];
  const generatingThumbnails = thumbnails?.filter(t => t.status === "generating") ?? [];

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
            <Link href="/" className="ml-4 text-sm text-zinc-500 hover:text-white transition-colors">
              ← Retour au site
            </Link>
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
      <main className="pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-[#18181B] rounded-lg p-1 border border-[#27272A]">
            {[
              { key: "generate" as Tab, label: "Générer", icon: Sparkles },
              { key: "batch" as Tab, label: "Batch", icon: ListChecks },
              { key: "team" as Tab, label: "Équipe", icon: Users },
              { key: "history" as Tab, label: "Historique", icon: Clock },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-[#06B6D4] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* GENERATE TAB */}
          {activeTab === "generate" && (
            <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6">
              <h2 className="text-lg font-bold text-white mb-4">Crée ta miniature virale</h2>

              {/* Prompt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Décris ta miniature</label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Un homme surpris avec un gros plan, fond bleu électrique, texte 'IL A GAGNÉ 100 000€' en gros..."
                    className="w-full h-28 px-4 py-3 rounded-lg bg-[#09090B] border border-[#27272A] text-white placeholder:text-zinc-600 focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/20 outline-none resize-none transition-all"
                    maxLength={500}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-zinc-600">{prompt.length}/500</span>
                </div>
              </div>

              {/* Style + Quantity */}
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
                        {STYLES.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setStyle(s.id); setShowStyleDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#09090B] transition-colors ${style === s.id ? "bg-[#06B6D4]/10" : ""}`}
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
                    {QUANTITY_OPTIONS.map(opt => (
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

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || prompt.length < 10}
                  className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-bold px-6 h-11"
                >
                  {isGenerating ? (
                    <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Génération...</>
                  ) : (
                    <><Sparkles className="mr-2 w-4 h-4" />Générer {quantity} miniature{quantity > 1 ? "s" : ""}</>
                  )}
                </Button>
                <span className="text-xs text-zinc-500">
                  Coût : {quantity} crédit{quantity > 1 ? "s" : ""} ({credits?.credits ?? 10} restants)
                </span>
              </div>
            </div>
          )}

          {/* BATCH TAB */}
          {activeTab === "batch" && (
            <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6">
              <h2 className="text-lg font-bold text-white mb-2">Génération en lot (Batch)</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Colle une description par ligne. Chaque ligne = 1 miniature. Jusqu'à 20 descriptions.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Descriptions (une par ligne)</label>
                <textarea
                  value={batchPrompts}
                  onChange={(e) => setBatchPrompts(e.target.value)}
                  placeholder={`Exemple :\nUn scientifique dans un labo futuriste, texte 'L'IA DU FUTUR'\nUn chat sur un skateboard, fond néon, texte 'INCROYABLE'\nUn paysage de montagnes au coucher du soleil, texte 'AVENTURE'`}
                  className="w-full h-64 px-4 py-3 rounded-lg bg-[#09090B] border border-[#27272A] text-white placeholder:text-zinc-600 focus:border-[#06B6D4]/50 focus:ring-1 focus:ring-[#06B6D4]/20 outline-none resize-none transition-all font-mono text-sm"
                />
              </div>

              {/* Style selector for batch */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Style</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        style === s.id
                          ? "bg-[#06B6D4] text-black"
                          : "bg-[#09090B] border border-[#27272A] text-zinc-400 hover:border-[#06B6D4]/30"
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleBatchGenerate}
                  disabled={isBatchGenerating || !batchPrompts.trim()}
                  className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-bold px-6 h-11"
                >
                  {isBatchGenerating ? (
                    <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Génération en cours...</>
                  ) : (
                    <><ListChecks className="mr-2 w-4 h-4" />Générer le lot ({batchPrompts.split("\n").filter(p => p.trim().length >= 10).length} miniatures)</>
                  )}
                </Button>
                <span className="text-xs text-zinc-500">
                  Coût : {batchPrompts.split("\n").filter(p => p.trim().length >= 10).length} crédit(s) ({credits?.credits ?? 10} restants)
                </span>
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === "team" && (
            <div className="space-y-6">
              {/* Team Members */}
              <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#06B6D4]" />
                    Membres de l'équipe
                  </h2>
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-[#06B6D4] text-black font-bold h-9 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Inviter
                  </Button>
                </div>

                {teamMembers && teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-[#09090B] border border-[#27272A]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white">
                            {member.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm text-white">{member.name || "Utilisateur"}</p>
                            <p className="text-xs text-zinc-500">{member.email || ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === "admin" ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-700 text-zinc-400"}`}>
                            {member.role === "admin" ? "Admin" : "Membre"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMutation.mutate({ userId: member.userId })}
                            className="text-zinc-500 hover:text-red-400 h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Aucun membre dans l'équipe</p>
                    <p className="text-zinc-600 text-xs mt-1">Invite des collaborateurs pour travailler ensemble.</p>
                  </div>
                )}
              </div>

              {/* Team Tasks */}
              <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <ListChecks className="w-5 h-5 text-[#06B6D4]" />
                  Tâches & Validation
                </h2>

                {teamTasks && teamTasks.length > 0 ? (
                  <div className="space-y-3">
                    {teamTasks.map(task => (
                      <div key={task.id} className="p-4 rounded-lg bg-[#09090B] border border-[#27272A]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              task.status === "approved" ? "bg-green-500/20 text-green-400" :
                              task.status === "rejected" ? "bg-red-500/20 text-red-400" :
                              task.status === "reviewing" ? "bg-yellow-500/20 text-yellow-400" :
                              task.status === "cancelled" ? "bg-zinc-600 text-zinc-400" :
                              "bg-cyan-500/20 text-cyan-400"
                            }`}>
                              {task.status === "pending" ? "En attente" : task.status === "reviewing" ? "En révision" : task.status === "approved" ? "Approuvé" : task.status === "rejected" ? "Rejeté" : "Annulé"}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-600">
                            {new Date(task.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        {task.comment && (
                          <p className="text-sm text-zinc-400 mb-3">{task.comment}</p>
                        )}
                        <div className="flex gap-2">
                          {task.status !== "approved" && task.status !== "cancelled" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTask(task.id, "approved")}
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 h-8 text-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Approuver
                            </Button>
                          )}
                          {task.status !== "rejected" && task.status !== "cancelled" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTask(task.id, "rejected")}
                              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 h-8 text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Rejeter
                            </Button>
                          )}
                          {task.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTask(task.id, "reviewing")}
                              className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 h-8 text-xs"
                            >
                              En révision
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTask(task.id, "cancelled")}
                            className="bg-zinc-700 text-zinc-400 hover:bg-zinc-600 h-8 text-xs"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ListChecks className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Aucune tâche en cours</p>
                    <p className="text-zinc-600 text-xs mt-1">Crée des tâches depuis l'historique pour collaborer.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historique des miniatures
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
                  <p className="text-zinc-500 text-sm">Aucune miniature générée</p>
                  <p className="text-zinc-600 text-xs mt-1">Va dans l'onglet "Générer" pour créer ta première miniature !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {thumbnails.map(thumb => (
                    <div
                      key={thumb.id}
                      className="rounded-lg bg-[#09090B] border border-[#27272A] overflow-hidden group hover:border-[#06B6D4]/30 transition-all"
                    >
                      <div className="aspect-video relative">
                        {thumb.status === "generating" ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#09090B]">
                            <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" />
                          </div>
                        ) : thumb.status === "completed" ? (
                          <>
                            <img src={thumb.imageUrl} alt={thumb.prompt} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button onClick={() => handleDownload(thumb.imageUrl, thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <Download className="w-5 h-5 text-white" />
                              </button>
                              <button onClick={() => handleLike(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-pink-500/20 transition-colors">
                                <Heart className={`w-5 h-5 ${likedThumbs[thumb.id]?.liked ? "text-pink-500 fill-pink-500" : "text-white"}`} />
                              </button>
                              <button onClick={() => handleCreateTask(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-cyan-500/20 transition-colors" title="Créer une tâche">
                                <ListChecks className="w-5 h-5 text-white" />
                              </button>
                              <button onClick={() => handleDelete(thumb.id)} className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 transition-colors">
                                <Trash2 className="w-5 h-5 text-white" />
                              </button>
                            </div>
                            {/* Like count badge */}
                            {likedThumbs[thumb.id] && likedThumbs[thumb.id].count > 0 && (
                              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full">
                                <Heart className={`w-3 h-3 ${likedThumbs[thumb.id].liked ? "text-pink-500 fill-pink-500" : "text-white"}`} />
                                <span className="text-xs text-white">{likedThumbs[thumb.id].count}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#09090B]">
                            <XCircle className="w-8 h-8 text-red-500" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#18181B] text-zinc-400 capitalize">{thumb.style}</span>
                          <span className="text-xs text-zinc-600">
                            {thumb.status === "completed" ? (
                              <span className="flex items-center gap-1 text-[#22C55E]"><CheckCircle2 className="w-3 h-3" /> Terminé</span>
                            ) : thumb.status === "generating" ? (
                              <span className="flex items-center gap-1 text-[#06B6D4]"><Play className="w-3 h-3" /> En cours...</span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" /> Échoué</span>
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
          )}
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Inviter un collaborateur</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Email de l'utilisateur</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#09090B] border border-[#27272A] text-white placeholder:text-zinc-600 focus:border-[#06B6D4]/50 outline-none"
                />
              </div>
              <p className="text-xs text-zinc-500">
                L'utilisateur doit déjà avoir un compte Minia IA. Tu peux ensuite l'ajouter par son ID utilisateur.
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
                  className="bg-[#06B6D4] text-black font-bold flex-1"
                >
                  {inviteMutation.isPending ? "Invitation..." : "Inviter"}
                </Button>
                <Button variant="outline" onClick={() => setShowInviteModal(false)} className="border-[#27272A] text-zinc-400">
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
