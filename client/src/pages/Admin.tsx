import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Users, CreditCard, Image as ImageIcon, Bell, Settings, BarChart3,
  Crown, Shield, Search, ChevronDown, Zap, Trash2, RefreshCw,
  Globe, Key, Layers, TrendingUp, AlertTriangle
} from "lucide-react";


type TabId = "dashboard" | "users" | "templates" | "api" | "notifications" | "settings";

export default function AdminPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [bulkAmount, setBulkAmount] = useState("10");
  const [bulkPlan, setBulkPlan] = useState<"free" | "pro" | "max" | "all">("all");
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateImageUrl, setNewTemplateImageUrl] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("viral");


  // Guard: redirect if not admin
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, user, navigate]);

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.admin.stats.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.role === "admin",
  });
  const { data: allUsers, refetch: refetchUsers } = trpc.admin.users.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.role === "admin",
  });
  const { data: allTemplates, refetch: refetchTemplates } = trpc.admin.templates.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.role === "admin",
  });
  const { data: models, refetch: refetchModels } = trpc.admin.models.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.role === "admin",
  });

  // Mutations
  const updateRoleMut = trpc.admin.updateRole.useMutation({
    onSuccess: () => { toast.success("Rôle mis à jour"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const updateCreditsMut = trpc.admin.updateCredits.useMutation({
    onSuccess: () => { toast.success("Crédits mis à jour"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const updatePlanMut = trpc.admin.updatePlan.useMutation({
    onSuccess: () => { toast.success("Plan mis à jour"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTemplateMut = trpc.admin.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Template supprimé"); refetchTemplates(); },
    onError: (e) => toast.error(e.message),
  });
  const sendNotifMut = trpc.admin.sendNotification.useMutation({
    onSuccess: () => { toast.success("Notification envoyée à tous les utilisateurs"); setNotifTitle(""); setNotifMessage(""); },
    onError: (e) => toast.error(e.message),
  });
  const bulkCreditsMut = trpc.admin.bulkCredits.useMutation({
    onSuccess: (data) => { toast.success(`${data.updated} utilisateurs mis à jour`); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const createTemplateMut = trpc.templates.create.useMutation({
    onSuccess: () => { toast.success("Template créé"); refetchTemplates(); setShowNewTemplateForm(false); setNewTemplateTitle(""); setNewTemplateImageUrl(""); },
    onError: (e) => toast.error(e.message),
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const filteredUsers = (allUsers || []).filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Vue d'ensemble", icon: <BarChart3 size={18} /> },
    { id: "users", label: "Utilisateurs", icon: <Users size={18} /> },
    { id: "templates", label: "Templates", icon: <Layers size={18} /> },
    { id: "api", label: "API & Modèles", icon: <Key size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "settings", label: "Paramètres", icon: <Settings size={18} /> },
  ];

  const planColors: Record<string, string> = {
    free: "bg-gray-700 text-gray-300",
    pro: "bg-purple-600/30 text-purple-300",
    max: "bg-cyan-600/30 text-cyan-300",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
            <h1 className="text-xl font-bold">Super Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">Panneau d'administration Minia IA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full flex items-center gap-1">
              <Shield size={12} /> Admin
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar — hidden on mobile, shown as drawer via Sheet */}
        <div className="hidden md:block w-56 border-r border-white/10 min-h-[calc(100vh-73px)] p-3">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tab selector */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-t border-white/10">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-fit flex-1 text-[10px] transition-colors ${
                  activeTab === tab.id ? "text-cyan-400" : "text-gray-500"
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 pb-24 md:pb-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users />} label="Utilisateurs" value={stats?.totalUsers ?? 0} color="cyan" />
                <StatCard icon={<ImageIcon />} label="Miniatures" value={stats?.totalThumbnails ?? 0} color="pink" />
                <StatCard icon={<CreditCard />} label="Crédits totaux" value={stats?.totalCredits ?? 0} color="purple" />
                <StatCard icon={<Layers />} label="Templates" value={stats?.totalTemplates ?? 0} color="green" />
                <StatCard icon={<Globe />} label="Avatars" value={stats?.totalAvatars ?? 0} color="orange" />
                <StatCard icon={<Settings />} label="End Cards" value={stats?.totalEndCards ?? 0} color="blue" />
                <StatCard icon={<Key />} label="Clés API" value={stats?.totalApiKeys ?? 0} color="red" />
                <StatCard icon={<TrendingUp />} label="Plans Pro/Max" value={0} color="gold" />
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" /> Actions rapides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Attribuer des crédits (bulk)</h4>
                    <div className="flex gap-2">
                      <select
                        value={bulkPlan}
                        onChange={e => setBulkPlan(e.target.value as any)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm flex-1"
                      >
                        <option value="all">Tous les plans</option>
                        <option value="free">Free uniquement</option>
                        <option value="pro">Pro uniquement</option>
                        <option value="max">Max uniquement</option>
                      </select>
                      <input
                        type="number"
                        value={bulkAmount}
                        onChange={e => setBulkAmount(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm w-24"
                        placeholder="Qté"
                      />
                      <button
                        onClick={() => bulkCreditsMut.mutate({
                          planType: bulkPlan === "all" ? undefined : bulkPlan,
                          amount: parseInt(bulkAmount) || 10,
                        })}
                        disabled={bulkCreditsMut.isPending}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {bulkCreditsMut.isPending ? "..." : "Ajouter"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Notification globale</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={notifTitle}
                        onChange={e => setNotifTitle(e.target.value)}
                        placeholder="Titre"
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm flex-1"
                      />
                      <button
                        onClick={() => {
                          if (!notifTitle.trim()) { toast.error("Titre requis"); return; }
                          sendNotifMut.mutate({ title: notifTitle, message: notifMessage || undefined });
                        }}
                        disabled={sendNotifMut.isPending}
                        className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {sendNotifMut.isPending ? "..." : "Envoyer"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Models */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key size={16} className="text-green-400" /> Modèles IA disponibles
                  </h3>
                  <button onClick={() => refetchModels()} className="text-gray-400 hover:text-white">
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(models?.models || []).map((m: any, i: number) => (
                    <span key={i} className="bg-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full">
                      {m.model || m.id || "unknown"}
                    </span>
                  ))}
                  {(models?.models || []).length === 0 && (
                    <span className="text-gray-500 text-sm">Aucun modèle disponible — vérifier la config API</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredUsers.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onUpdateRole={(role) => updateRoleMut.mutate({ userId: u.id, role })}
                    onUpdateCredits={(credits) => updateCreditsMut.mutate({ userId: u.id, credits })}
                    onUpdatePlan={(planType) => updatePlanMut.mutate({ userId: u.id, planType })}
                    planColors={planColors}
                  />
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">Aucun utilisateur trouvé</div>
                )}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Templates d'inspiration ({allTemplates?.length ?? 0})</h3>
                <button
                  onClick={() => setShowNewTemplateForm(!showNewTemplateForm)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  + Ajouter un template
                </button>
              </div>

              {showNewTemplateForm && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={newTemplateTitle}
                    onChange={e => setNewTemplateTitle(e.target.value)}
                    placeholder="Titre du template"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    value={newTemplateImageUrl}
                    onChange={e => setNewTemplateImageUrl(e.target.value)}
                    placeholder="URL de l'image (Unsplash/Pexels/autre)"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={newTemplateCategory}
                    onChange={e => setNewTemplateCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="viral">Viral</option>
                    <option value="mrbeast">MrBeast</option>
                    <option value="minimalist">Minimaliste</option>
                    <option value="dramatic">Dramatic</option>
                    <option value="tech">Tech</option>
                    <option value="retro">Retro</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!newTemplateTitle.trim() || !newTemplateImageUrl.trim()) {
                        toast.error("Titre et URL requis");
                        return;
                      }
                      createTemplateMut.mutate({
                        title: newTemplateTitle,
                        imageUrl: newTemplateImageUrl,
                        category: newTemplateCategory,
                        source: "unsplash",
                      });
                    }}
                    disabled={createTemplateMut.isPending}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {createTemplateMut.isPending ? "Création..." : "Créer le template"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(allTemplates || []).map(t => (
                  <div key={t.id} className="relative group bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    <img src={t.imageUrl} alt={t.title} className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      <p className="text-[10px] text-gray-400">{t.category}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce template ?")) {
                          deleteTemplateMut.mutate({ id: t.id });
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {(allTemplates || []).length === 0 && (
                <div className="text-center py-12 text-gray-500">Aucun template — ajoute des miniatures d'inspiration</div>
              )}
            </div>
          )}

          {/* API Tab */}
          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Key size={16} className="text-green-400" /> Modèles de génération IA
                </h3>
                <div className="space-y-3">
                  {(models?.models || []).map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-black/40 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Zap size={14} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.model || m.id || "Unknown"}</p>
                          <p className="text-xs text-gray-500">Modèle Forge</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Actif</span>
                    </div>
                  ))}
                  {(models?.models || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle size={24} className="mx-auto mb-2 text-yellow-500" />
                      Aucun modèle disponible. Vérifie la configuration BUILT_IN_FORGE_API_KEY.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <h3 className="font-semibold mb-4">Configuration actuelle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Modèle par défaut</p>
                    <p className="font-mono">MODEL_GPT_IMAGE_2</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Qualité par défaut</p>
                    <p className="font-mono">high</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Endpoint</p>
                    <p className="font-mono text-xs truncate">images.v1.ImageService/GenerateImage</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Stockage</p>
                    <p className="font-mono text-xs">S3 (Manus Storage)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h3 className="font-semibold">Notification globale</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Titre</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    placeholder="Ex: Nouvelle fonctionnalité disponible !"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Message (optionnel)</label>
                  <textarea
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    placeholder="Détails de la notification..."
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Cette notification sera envoyée à tous les {stats?.totalUsers ?? 0} utilisateurs
                  </p>
                  <button
                    onClick={() => {
                      if (!notifTitle.trim()) { toast.error("Titre requis"); return; }
                      sendNotifMut.mutate({ title: notifTitle, message: notifMessage || undefined });
                    }}
                    disabled={sendNotifMut.isPending || !notifTitle.trim()}
                    className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    {sendNotifMut.isPending ? "Envoi..." : "Envoyer à tous"}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Types de notifications disponibles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {["system", "credit", "generation", "team"].map(type => (
                    <span key={type} className="bg-black/40 text-gray-400 text-xs px-3 py-2 rounded-lg capitalize">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Paramètres Super Admin</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <p className="text-sm font-medium">Crédits par défaut (nouvel utilisateur)</p>
                    <p className="text-xs text-gray-500">Nombre de crédits attribués à l'inscription</p>
                  </div>
                  <span className="text-sm text-cyan-400">10</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <p className="text-sm font-medium">Plan gratuit — crédits</p>
                    <p className="text-xs text-gray-500">Crédits mensuels pour le plan Free</p>
                  </div>
                  <span className="text-sm text-gray-400">10</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <p className="text-sm font-medium">Plan Pro — crédits</p>
                    <p className="text-xs text-gray-500">Crédits mensuels pour le plan Pro</p>
                  </div>
                  <span className="text-sm text-purple-400">100</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Plan Max — crédits</p>
                    <p className="text-xs text-gray-500">Crédits mensuels pour le plan Max</p>
                  </div>
                  <span className="text-sm text-cyan-400">500</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Informations système</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-500">Version</p>
                    <p className="text-white font-mono">1.0.0</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-500">Base de données</p>
                    <p className="text-white font-mono">MySQL/TiDB</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-500">Stockage</p>
                    <p className="text-white font-mono">S3 (Manus)</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <p className="text-gray-500">IA</p>
                    <p className="text-white font-mono">Forge API</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: "border-cyan-500/30",
    pink: "border-pink-500/30",
    purple: "border-purple-500/30",
    green: "border-green-500/30",
    orange: "border-orange-500/30",
    blue: "border-blue-500/30",
    red: "border-red-500/30",
    gold: "border-yellow-500/30",
  };
  const iconColorMap: Record<string, string> = {
    cyan: "text-cyan-400", pink: "text-pink-400", purple: "text-purple-400",
    green: "text-green-400", orange: "text-orange-400", blue: "text-blue-400",
    red: "text-red-400", gold: "text-yellow-400",
  };

  return (
    <div className={`bg-white/5 rounded-xl border ${colorMap[color]} p-4`}>
      <div className={`mb-2 ${iconColorMap[color]}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function UserRow({ user, onUpdateRole, onUpdateCredits, onUpdatePlan, planColors }: {
  user: any;
  onUpdateRole: (role: "user" | "admin") => void;
  onUpdateCredits: (credits: number) => void;
  onUpdatePlan: (planType: "free" | "pro" | "max") => void;
  planColors: Record<string, string>;
}) {
  const [editCredits, setEditCredits] = useState(false);
  const [creditsValue, setCreditsValue] = useState(user.credits?.toString() || "10");

  const userCredits = user.credits ?? user.creditAmount ?? 10;
  const userPlan = user.planType ?? "free";
  useEffect(() => { setCreditsValue(userCredits.toString()); }, [userCredits]);

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-lg border border-white/10 p-3">
      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
        {(user.name || user.email || "?").charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name || user.email || "Utilisateur"}</p>
        <p className="text-xs text-gray-500 truncate">{user.email || "—"}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${planColors[userPlan] || planColors.free}`}>
          {userPlan}
        </span>
        {editCredits ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={creditsValue}
              onChange={e => setCreditsValue(e.target.value)}
              className="w-16 bg-black/50 border border-white/20 rounded px-2 py-1 text-xs"
            />
            <button
              onClick={() => { onUpdateCredits(parseInt(creditsValue) || 0); setEditCredits(false); }}
              className="text-xs bg-cyan-600 text-white px-2 py-1 rounded"
            >
              ✓
            </button>
            <button
              onClick={() => setEditCredits(false)}
              className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditCredits(true)}
            className="text-xs text-gray-400 w-16 text-right hover:text-cyan-400 transition-colors"
          >
            {userCredits} crédits
          </button>
        )}
        <div className="flex gap-1">
          <button
            onClick={() => onUpdatePlan(userPlan === "free" ? "pro" : userPlan === "pro" ? "max" : "free")}
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
            title="Changer le plan"
          >
            <Crown size={12} />
          </button>
          <button
            onClick={() => onUpdateRole(user.role === "admin" ? "user" : "admin")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              user.role === "admin" ? "bg-red-500/20 text-red-400" : "bg-white/10 hover:bg-white/20 text-gray-300"
            }`}
            title={user.role === "admin" ? "Retirer admin" : "Donner admin"}
          >
            <Shield size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
