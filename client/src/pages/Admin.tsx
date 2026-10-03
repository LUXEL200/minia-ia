import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Users, CreditCard, Image as ImageIcon, Bell, Settings, BarChart3, Activity, Database, Bug,
  Crown, Shield, Search, ChevronDown, Zap, Trash2, RefreshCw,
  Globe, Key, Layers, TrendingUp, AlertTriangle, Star, MessageSquare,
  CheckCircle2, XCircle, Clock, Download, FileText, Filter
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";


type TabId = "dashboard" | "operations" | "users" | "templates" | "api" | "notifications" | "settings" | "testimonials" | "access";

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map(row => headers.map(header => escape(row[header])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

function printPdf(title: string, rows: Record<string, unknown>[]) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const popup = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!popup) { toast.error("Autorise les fenêtres pop-up pour générer le PDF"); return; }
  const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] ?? char));
  popup.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f3f4f6}@media print{button{display:none}}</style></head><body><h1>${esc(title)}</h1><p>Export généré le ${new Date().toLocaleString("fr-FR")}</p><table><thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map(header => `<td>${esc(row[header])}</td>`).join("")}</tr>`).join("")}</tbody></table><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></body></html>`);
  popup.document.close(); popup.focus(); setTimeout(() => popup.print(), 250);
}

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
  const [supportUserId, setSupportUserId] = useState("");
  const [timelineKind, setTimelineKind] = useState<"all" | "account" | "generation" | "credit" | "notification" | "api_key">("all");
  const [timelineFrom, setTimelineFrom] = useState("");
  const [timelineTo, setTimelineTo] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportTitle, setSupportTitle] = useState("Message du support Minia IA");
  const [metricPlan, setMetricPlan] = useState<"all" | "free" | "pro" | "max">("all");
  const [metricUserId, setMetricUserId] = useState("");
  const [metricFrom, setMetricFrom] = useState("");
  const [metricTo, setMetricTo] = useState("");
  const [metricDays, setMetricDays] = useState("14");
  const [reportEmail, setReportEmail] = useState("");
  const [reportType, setReportType] = useState<"metrics" | "timeline">("metrics");
  const [reportFormat, setReportFormat] = useState<"csv" | "pdf">("csv");
  const [reportCron, setReportCron] = useState("0 0 9 * * *");
  const [accessUserId, setAccessUserId] = useState("");
  const [accessRole, setAccessRole] = useState<"support" | "analyst" | "operator">("analyst");


  const { data: adminAccess, isLoading: accessLoading } = trpc.admin.accessMe.useQuery(undefined, { enabled: !loading && isAuthenticated });
  const adminAllowed = user?.isAdminOwner === true || adminAccess?.enabled === true;

  // Guard: redirect if not an owner or enabled secondary admin
  useEffect(() => {
    if (!loading && !accessLoading && isAuthenticated && !adminAllowed) {
      navigate("/dashboard");
    }
  }, [loading, accessLoading, isAuthenticated, adminAllowed, navigate]);

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.admin.stats.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const { data: allUsers, refetch: refetchUsers } = trpc.admin.users.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const { data: allTemplates, refetch: refetchTemplates } = trpc.admin.templates.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const { data: models, refetch: refetchModels } = trpc.admin.models.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const { data: operations, refetch: refetchOperations } = trpc.admin.operations.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
    refetchInterval: 10000,
  });
  const knownIncidentIds = useRef<Set<number>>(new Set());
  useEffect(() => {
    const incidents = operations?.failedGenerations ?? [];
    const fresh = incidents.filter(item => !knownIncidentIds.current.has(item.id));
    if (knownIncidentIds.current.size > 0 && fresh.length > 0) toast.error(`${fresh.length} nouvel incident de génération`, { description: "Ouvre Centre Opérations pour diagnostiquer." });
    knownIncidentIds.current = new Set(incidents.map(item => item.id));
  }, [operations?.failedGenerations]);
  const metricInput = useMemo(() => ({
    days: Math.min(Math.max(Number(metricDays) || 14, 7), 90),
    planType: metricPlan === "all" ? undefined : metricPlan,
    userId: Number(metricUserId) > 0 ? Number(metricUserId) : undefined,
    from: metricFrom ? new Date(`${metricFrom}T00:00:00Z`) : undefined,
    to: metricTo ? new Date(`${metricTo}T23:59:59.999Z`) : undefined,
  }), [metricDays, metricPlan, metricUserId, metricFrom, metricTo]);
  const { data: historicalMetrics } = trpc.admin.historicalMetrics.useQuery(metricInput, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const supportInput = useMemo(() => {
    const id = Number.parseInt(supportUserId, 10);
    return Number.isInteger(id) && id > 0 ? { userId: id } : undefined;
  }, [supportUserId]);
  const { data: supportSnapshot, isFetching: supportLoading, error: supportError } = trpc.admin.userSupport.useQuery(
    supportInput as { userId: number },
    { enabled: !loading && isAuthenticated && user?.isAdminOwner === true && !!supportInput }
  );
  const filteredTimeline = useMemo(() => (supportSnapshot?.timeline ?? []).filter(event => {
    const after = !timelineFrom || new Date(event.timestamp) >= new Date(`${timelineFrom}T00:00:00`);
    const before = !timelineTo || new Date(event.timestamp) <= new Date(`${timelineTo}T23:59:59.999`);
    return (timelineKind === "all" || event.kind === timelineKind) && after && before;
  }), [supportSnapshot?.timeline, timelineKind, timelineFrom, timelineTo]);

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
    onSuccess: () => { toast.success("Notification envoyée à tous les utilisateurs"); setNotifTitle(""); setNotifMessage(""); refetchAuditLogs(); },
    onError: (e) => toast.error(e.message),
  });
  const bulkCreditsMut = trpc.admin.bulkCredits.useMutation({
    onSuccess: (data) => { toast.success(`${data.updated} utilisateurs mis à jour`); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const resetCreditsMut = trpc.admin.resetCredits.useMutation({
    onSuccess: (data) => { toast.success(`Solde réinitialisé à ${data.amount} crédits`); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const notifyUserMut = trpc.admin.notifyUser.useMutation({
    onSuccess: () => { toast.success("Notification ciblée envoyée"); setSupportMessage(""); },
    onError: (e) => toast.error(e.message),
  });
  const revokeSessionsMut = trpc.admin.revokeSessions.useMutation({
    onSuccess: () => toast.success("Toutes les sessions utilisateur ont été révoquées"),
    onError: (e) => toast.error(e.message),
  });
  const { data: legacyApiKeys, refetch: refetchLegacyApiKeys } = trpc.admin.legacyApiKeys.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const { data: auditLogs, refetch: refetchAuditLogs } = trpc.admin.auditLogs.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const { data: secondaryAccess, refetch: refetchSecondaryAccess } = trpc.admin.secondaryAccess.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const { data: scheduledExports, refetch: refetchScheduledExports } = trpc.admin.scheduledExports.useQuery(undefined, {
    enabled: !loading && isAuthenticated && adminAllowed,
    refetchInterval: 15000,
  });
  const { data: clientSettings, refetch: refetchClientSettings } = trpc.admin.clientSettings.useQuery(undefined, {
    enabled: !loading && isAuthenticated && adminAllowed,
  });
  const updateClientSettingMut = trpc.admin.updateClientSetting.useMutation({
    onSuccess: () => { toast.success("Paramètre client mis à jour"); refetchClientSettings(); },
    onError: (e) => toast.error(e.message),
  });
  const createScheduledExportMut = trpc.admin.createScheduledExport.useMutation({
    onSuccess: () => { toast.success("Export récurrent programmé"); setReportEmail(""); refetchScheduledExports(); },
    onError: (e) => toast.error(e.message),
  });
  const pauseScheduledExportMut = trpc.admin.pauseScheduledExport.useMutation({ onSuccess: () => { toast.success("Export mis en pause"); refetchScheduledExports(); }, onError: e => toast.error(e.message) });
  const deleteScheduledExportMut = trpc.admin.deleteScheduledExport.useMutation({ onSuccess: () => { toast.success("Export supprimé"); refetchScheduledExports(); }, onError: e => toast.error(e.message) });
  const grantAccessMut = trpc.admin.grantSecondaryAccess.useMutation({ onSuccess: () => { toast.success("Accès secondaire enregistré"); setAccessUserId(""); refetchSecondaryAccess(); }, onError: e => toast.error(e.message) });
  const revokeAccessMut = trpc.admin.revokeSecondaryAccess.useMutation({ onSuccess: () => { toast.success("Accès révoqué"); refetchSecondaryAccess(); }, onError: e => toast.error(e.message) });
  const migrateLegacyApiKeysMut = trpc.admin.migrateLegacyApiKeys.useMutation({
    onSuccess: (data) => { toast.success(`${data.revokedCount} ancienne(s) clé(s) désactivée(s)`, { description: `${data.notifiedUserCount} utilisateur(s) notifié(s).` }); refetchLegacyApiKeys(); refetchAuditLogs(); },
    onError: (e) => toast.error(e.message),
  });
  const createTemplateMut = trpc.templates.create.useMutation({
    onSuccess: () => { toast.success("Template créé"); refetchTemplates(); setShowNewTemplateForm(false); setNewTemplateTitle(""); setNewTemplateImageUrl(""); },
    onError: (e) => toast.error(e.message),
  });

  // Testimonial moderation
  const { data: allTestimonials, refetch: refetchTestimonials } = trpc.testimonials.list.useQuery(undefined, {
    enabled: !loading && isAuthenticated && user?.isAdminOwner === true,
  });
  const pendingTestimonials = (allTestimonials ?? []).filter(t => t.verified === "pending");
  const approvedTestimonials = (allTestimonials ?? []).filter(t => t.verified === "approved");
  const rejectedTestimonials = (allTestimonials ?? []).filter(t => t.verified === "rejected");
  const setVerifiedMut = trpc.testimonials.setVerified.useMutation({
    onSuccess: () => { toast.success("Décision de modération enregistrée"); refetchTestimonials(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTestimonialMut = trpc.testimonials.delete.useMutation({
    onSuccess: () => { toast.success("Avis supprimé"); refetchTestimonials(); },
    onError: (e) => toast.error(e.message),
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated || !adminAllowed) {
    return null;
  }

  const filteredUsers = (allUsers || []).filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Vue d'ensemble", icon: <BarChart3 size={18} /> },
    { id: "operations", label: "Opérations", icon: <Activity size={18} /> },
    { id: "users", label: "Utilisateurs", icon: <Users size={18} /> },
    { id: "templates", label: "Templates", icon: <Layers size={18} /> },
    { id: "api", label: "API & Modèles", icon: <Key size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "settings", label: "Paramètres", icon: <Settings size={18} /> },
    { id: "testimonials", label: "Avis", icon: <Star size={18} /> },
    { id: "access", label: "Accès & exports", icon: <FileText size={18} /> },
  ];

  const planColors: Record<string, string> = {
    free: "bg-gray-700 text-gray-300",
    pro: "bg-orange-500/30 text-orange-300",
    max: "bg-cyan-600/30 text-orange-300",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-border px-6 py-4">
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
              className="text-xs text-gray-400 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar — hidden on mobile, shown as drawer via Sheet */}
        <div className="hidden md:block w-56 border-r border-border min-h-[calc(100vh-73px)] p-3">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-muted/80 text-white font-medium"
                    : "text-gray-400 hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tab selector */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-t border-border">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-fit flex-1 text-[10px] transition-colors ${
                  activeTab === tab.id ? "text-orange-400" : "text-gray-500"
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
          {activeTab === "access" && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-orange-400">Gouvernance</p>
                <h2 className="text-2xl font-semibold mt-1">Accès & exports automatisés</h2>
                <p className="text-sm text-gray-400 mt-1">Les rapports sont exécutés en UTC par le planificateur et envoyés à l’adresse choisie.</p>
              </div>
              <div className="grid xl:grid-cols-2 gap-5">
                <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <div><h3 className="font-semibold">Nouvel export récurrent</h3><p className="text-xs text-gray-500 mt-1">Cron à 6 champs : secondes, minutes, heures, jour, mois, semaine.</p></div>
                  <input value={reportEmail} onChange={e => setReportEmail(e.target.value)} placeholder="email@client.com" type="email" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={reportType} onChange={e => setReportType(e.target.value as "metrics" | "timeline")} className="rounded-lg bg-background border border-border px-3 py-2 text-sm"><option value="metrics">Métriques</option><option value="timeline">Timeline utilisateur</option></select>
                    <select value={reportFormat} onChange={e => setReportFormat(e.target.value as "csv" | "pdf")} className="rounded-lg bg-background border border-border px-3 py-2 text-sm"><option value="csv">CSV</option><option value="pdf">PDF</option></select>
                  </div>
                  {reportType === "timeline" && <input value={supportUserId} onChange={e => setSupportUserId(e.target.value)} placeholder="ID utilisateur pour la timeline" inputMode="numeric" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm" />}
                  <div className="flex gap-3"><input value={reportCron} onChange={e => setReportCron(e.target.value)} className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm font-mono" /><button disabled={createScheduledExportMut.isPending || !reportEmail} onClick={() => createScheduledExportMut.mutate({ email: reportEmail, reportType, format: reportFormat, cron: reportCron, filters: reportType === "timeline" ? { userId: Number(supportUserId) } : { days: Number(metricDays) || 14, planType: metricPlan === "all" ? undefined : metricPlan } })} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Programmer</button></div>
                  {!adminAccess?.permissions.includes("reports.schedule") && !adminAccess?.owner && <p className="text-xs text-amber-400">Ton rôle peut consulter les exports, mais pas en créer. Demande la permission reports.schedule.</p>}
                </section>
                <section className="rounded-2xl border border-border bg-card p-5"><h3 className="font-semibold mb-3">Exports actifs</h3><div className="space-y-2">{(scheduledExports ?? []).length === 0 ? <p className="text-sm text-gray-500">Aucun export configuré.</p> : scheduledExports?.map(item => <div key={item.id} className="rounded-xl border border-border/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-medium">{item.reportType.toUpperCase()} · {item.format.toUpperCase()}</p><p className="text-xs text-gray-500">{item.email} · <span className="font-mono">{item.cron}</span></p><p className="text-xs mt-1 text-orange-300">{item.status === "active" ? "Actif" : item.status === "paused" ? "En pause" : "Erreur"}</p></div><div className="flex gap-2"><button onClick={() => item.scheduleTaskUid && pauseScheduledExportMut.mutate({ id: item.id, taskUid: item.scheduleTaskUid })} disabled={!item.scheduleTaskUid || item.status !== "active"} className="text-xs rounded-md border border-border px-2 py-1 disabled:opacity-40">Pause</button><button onClick={() => item.scheduleTaskUid && deleteScheduledExportMut.mutate({ id: item.id, taskUid: item.scheduleTaskUid })} disabled={!item.scheduleTaskUid} className="text-xs rounded-md border border-red-500/40 text-red-300 px-2 py-1 disabled:opacity-40">Supprimer</button></div></div>)}</div></section>
              </div>
              {adminAccess?.owner && <section className="rounded-2xl border border-border bg-card p-5 space-y-4"><div><h3 className="font-semibold">Rôles Super Admin secondaires</h3><p className="text-xs text-gray-500 mt-1">Seul le propriétaire peut accorder ou révoquer un accès.</p></div><div className="flex flex-col md:flex-row gap-3"><input value={accessUserId} onChange={e => setAccessUserId(e.target.value)} placeholder="ID utilisateur" inputMode="numeric" className="rounded-lg bg-background border border-border px-3 py-2 text-sm" /><select value={accessRole} onChange={e => setAccessRole(e.target.value as typeof accessRole)} className="rounded-lg bg-background border border-border px-3 py-2 text-sm"><option value="analyst">Analyste</option><option value="support">Support</option><option value="operator">Opérateur</option></select><button disabled={!Number(accessUserId) || grantAccessMut.isPending} onClick={() => grantAccessMut.mutate({ userId: Number(accessUserId), role: accessRole, permissions: accessRole === "support" ? ["users.support", "users.revoke_sessions", "monitoring.view"] : accessRole === "operator" ? ["reports.view", "reports.schedule", "monitoring.view", "monitoring.manage"] : ["reports.view", "monitoring.view"] })} className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-50">Accorder</button></div><div className="grid md:grid-cols-2 gap-3">{(secondaryAccess ?? []).map(item => <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 p-3"><div><p className="text-sm">Utilisateur #{item.userId} · <span className="text-orange-300">{item.role}</span></p><p className="text-xs text-gray-500">{Array.isArray(item.permissions) ? item.permissions.join(", ") : ""}</p></div><button onClick={() => revokeAccessMut.mutate({ userId: item.userId })} className="text-xs text-red-300">Révoquer</button></div>)}</div></section>}
            </div>
          )}
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users />} label="Utilisateurs" value={stats?.totalUsers ?? 0} color="cyan" />
                <StatCard icon={<ImageIcon />} label="Miniatures" value={stats?.totalThumbnails ?? 0} color="pink" />
                <StatCard icon={<CreditCard />} label="Crédits totaux" value={stats?.totalCredits ?? 0} color="purple" />
                <StatCard icon={<Layers />} label="Templates" value={stats?.totalTemplates ?? 0} color="orange" />
                <StatCard icon={<Globe />} label="Avatars" value={stats?.totalAvatars ?? 0} color="orange" />
                <StatCard icon={<Settings />} label="End Cards" value={stats?.totalEndCards ?? 0} color="blue" />
                <StatCard icon={<Key />} label="Clés API" value={stats?.totalApiKeys ?? 0} color="red" />
                <StatCard icon={<TrendingUp />} label="Plans Pro/Max" value={0} color="gold" />
              </div>

              <div className="bg-muted rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="font-semibold">Métriques historiques</h3><p className="text-xs text-gray-500 mt-1">14 derniers jours · UTC</p></div>
                  <div className="flex items-center gap-2"><button title="Exporter CSV" onClick={() => downloadCsv("minia-metrics.csv", (historicalMetrics ?? []) as unknown as Record<string, unknown>[])} className="text-xs bg-muted/80 hover:bg-muted border border-border rounded-lg px-2.5 py-2 flex items-center gap-1"><Download size={13} /> CSV</button><button title="Exporter PDF" onClick={() => printPdf("Métriques historiques Minia IA", (historicalMetrics ?? []) as unknown as Record<string, unknown>[])} className="text-xs bg-muted/80 hover:bg-muted border border-border rounded-lg px-2.5 py-2 flex items-center gap-1"><FileText size={13} /> PDF</button><Activity size={18} className="text-orange-400" /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
                  <label className="text-[11px] text-gray-500">Plan<select value={metricPlan} onChange={e => setMetricPlan(e.target.value as typeof metricPlan)} className="mt-1 w-full bg-black/40 border border-border rounded-lg px-2 py-2 text-xs text-white"><option value="all">Tous</option><option value="free">Free</option><option value="pro">Pro</option><option value="max">Max</option></select></label>
                  <label className="text-[11px] text-gray-500">Utilisateur<input value={metricUserId} onChange={e => setMetricUserId(e.target.value.replace(/\D/g, ""))} placeholder="ID" inputMode="numeric" className="mt-1 w-full bg-black/40 border border-border rounded-lg px-2 py-2 text-xs text-white" /></label>
                  <label className="text-[11px] text-gray-500">Du<input type="date" value={metricFrom} onChange={e => setMetricFrom(e.target.value)} className="mt-1 w-full bg-black/40 border border-border rounded-lg px-2 py-2 text-xs text-white" /></label>
                  <label className="text-[11px] text-gray-500">Au<input type="date" value={metricTo} onChange={e => setMetricTo(e.target.value)} className="mt-1 w-full bg-black/40 border border-border rounded-lg px-2 py-2 text-xs text-white" /></label>
                  <label className="text-[11px] text-gray-500">Période<select value={metricDays} onChange={e => setMetricDays(e.target.value)} className="mt-1 w-full bg-black/40 border border-border rounded-lg px-2 py-2 text-xs text-white"><option value="7">7 jours</option><option value="14">14 jours</option><option value="30">30 jours</option><option value="90">90 jours</option></select></label>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={historicalMetrics ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#273044" /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => String(v).slice(5)} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }} /><Legend /><Line type="monotone" dataKey="activeUsers" name="Utilisateurs actifs" stroke="#fb923c" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="generations" name="Générations" stroke="#60a5fa" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
                  <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={historicalMetrics ?? []}><CartesianGrid strokeDasharray="3 3" stroke="#273044" /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => String(v).slice(5)} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }} /><Legend /><Bar dataKey="errors" name="Erreurs" fill="#f87171" radius={[3, 3, 0, 0]} /><Bar dataKey="creditsConsumed" name="Crédits consommés" fill="#a78bfa" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-muted rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" /> Actions rapides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Attribuer des crédits (bulk)</h4>
                    <div className="flex gap-2">
                      <select
                        value={bulkPlan}
                        onChange={e => setBulkPlan(e.target.value as any)}
                        className="bg-black/50 border border-border rounded-lg px-3 py-2 text-sm flex-1"
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
                        className="bg-black/50 border border-border rounded-lg px-3 py-2 text-sm w-24"
                        placeholder="Qté"
                      />
                      <button
                        onClick={() => bulkCreditsMut.mutate({
                          planType: bulkPlan === "all" ? undefined : bulkPlan,
                          amount: parseInt(bulkAmount) || 10,
                        })}
                        disabled={bulkCreditsMut.isPending}
                        className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {bulkCreditsMut.isPending ? "..." : "Ajouter"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Notification globale</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={notifTitle}
                        onChange={e => setNotifTitle(e.target.value)}
                        placeholder="Titre"
                        className="bg-black/50 border border-border rounded-lg px-3 py-2 text-sm flex-1"
                      />
                      <button
                        onClick={() => {
                          if (!notifTitle.trim()) { toast.error("Titre requis"); return; }
                          sendNotifMut.mutate({ title: notifTitle, message: notifMessage || undefined });
                        }}
                        disabled={sendNotifMut.isPending}
                        className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {sendNotifMut.isPending ? "..." : "Envoyer"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Models */}
              <div className="bg-muted rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Key size={16} className="text-orange-400" /> Modèles IA disponibles
                  </h3>
                  <button onClick={() => refetchModels()} className="text-gray-400 hover:text-foreground">
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(models?.models || []).map((m: any, i: number) => (
                    <span key={i} className="bg-muted/80 text-gray-300 text-xs px-3 py-1.5 rounded-full">
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

          {/* Operations / support tab */}
          {activeTab === "operations" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Activity size={18} className="text-orange-400" /> Centre Opérations</h2>
                  <p className="text-xs text-gray-500 mt-1">Surveille l’API, les incidents de génération et aide un utilisateur sans exposer ses secrets.</p>
                </div>
                <button onClick={() => refetchOperations()} className="text-xs bg-muted border border-border px-3 py-2 rounded-lg flex items-center gap-2"><RefreshCw size={13} /> Actualiser</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted border border-border rounded-xl p-4">
                  <Database className="text-emerald-400 mb-2" size={18} />
                  <p className="text-xs text-gray-500">Base de données</p>
                  <p className="font-semibold mt-1">{operations?.database === "ok" ? "Opérationnelle" : "Indisponible"}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Dernier contrôle : {operations?.checkedAt ? new Date(operations.checkedAt).toLocaleTimeString("fr-FR") : "—"}</p>
                </div>
                <div className="bg-muted border border-red-500/20 rounded-xl p-4">
                  <Bug className="text-red-400 mb-2" size={18} />
                  <p className="text-xs text-gray-500">Générations en échec</p>
                  <p className="font-semibold mt-1">{operations?.failedGenerations.length ?? 0}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Dernières erreurs conservées pour diagnostic</p>
                </div>
                <div className="bg-muted border border-orange-500/20 rounded-xl p-4">
                  <CreditCard className="text-orange-400 mb-2" size={18} />
                  <p className="text-xs text-gray-500">Mouvements récents</p>
                  <p className="font-semibold mt-1">{operations?.recentCredits.length ?? 0}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Débits, remboursements et recharges</p>
                </div>
              </div>

              <div className="bg-muted border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3">Dépannage utilisateur</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={supportUserId} onChange={e => setSupportUserId(e.target.value.replace(/[^0-9]/g, ""))} placeholder="ID utilisateur (ex. 42)" className="flex-1 bg-black/40 border border-border rounded-lg px-3 py-2 text-sm" inputMode="numeric" />
                  <button onClick={() => { if (!supportInput) toast.error("Saisis un ID utilisateur valide"); }} className="bg-orange-500 hover:bg-orange-400 px-4 py-2 rounded-lg text-sm font-medium">Diagnostiquer</button>
                </div>
                {supportLoading && <p className="text-xs text-gray-500 mt-3">Analyse du compte…</p>}
                {supportError && <p className="text-xs text-red-400 mt-3">{supportError.message}</p>}
                {supportSnapshot && (
                  <>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-xs text-gray-500">Compte</p><p className="truncate">{supportSnapshot.user.name || supportSnapshot.user.email || `#${supportSnapshot.user.id}`}</p></div>
                      <div><p className="text-xs text-gray-500">Crédits / plan</p><p>{supportSnapshot.credits?.credits ?? 0} · {supportSnapshot.credits?.planType ?? "free"}</p></div>
                      <div><p className="text-xs text-gray-500">Miniatures</p><p>{supportSnapshot.thumbnails.length}</p></div>
                      <div><p className="text-xs text-gray-500">Alertes non lues</p><p>{supportSnapshot.unreadNotifications}</p></div>
                    </div>
                    <div className="mt-5 border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2"><Activity size={15} className="text-orange-400" /> Timeline utilisateur</h4>
                        <div className="flex items-center gap-2"><button onClick={() => downloadCsv(`minia-timeline-user-${supportSnapshot.user.id}.csv`, filteredTimeline as unknown as Record<string, unknown>[])} className="text-[11px] bg-muted/80 border border-border rounded px-2 py-1 flex items-center gap-1"><Download size={11} /> CSV</button><button onClick={() => printPdf(`Timeline utilisateur #${supportSnapshot.user.id}`, filteredTimeline as unknown as Record<string, unknown>[])} className="text-[11px] bg-muted/80 border border-border rounded px-2 py-1 flex items-center gap-1"><FileText size={11} /> PDF</button><span className="text-[11px] text-gray-500">{filteredTimeline.length} événements</span></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                        <select value={timelineKind} onChange={e => setTimelineKind(e.target.value as typeof timelineKind)} className="bg-black/40 border border-border rounded-lg px-3 py-2 text-xs">
                          <option value="all">Tous les types</option><option value="account">Compte</option><option value="generation">Générations</option><option value="credit">Crédits</option><option value="notification">Notifications</option><option value="api_key">Clés API</option>
                        </select>
                        <input type="date" value={timelineFrom} onChange={e => setTimelineFrom(e.target.value)} className="bg-black/40 border border-border rounded-lg px-3 py-2 text-xs" aria-label="Date de début" />
                        <input type="date" value={timelineTo} onChange={e => setTimelineTo(e.target.value)} className="bg-black/40 border border-border rounded-lg px-3 py-2 text-xs" aria-label="Date de fin" />
                      </div>
                      {filteredTimeline.length === 0 ? <p className="text-xs text-gray-500">Aucun événement pour ces filtres.</p> : (
                        <div className="relative ml-2 border-l border-border pl-5 space-y-4 max-h-[420px] overflow-y-auto pr-2">
                          {filteredTimeline.map((event) => (
                            <div key={event.id} className="relative">
                              <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-orange-400 ring-4 ring-muted" />
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{event.title}</p>
                                  <p className="text-xs text-gray-500 break-words">{event.description}</p>
                                </div>
                                <time className="text-[11px] text-gray-500 shrink-0" dateTime={new Date(event.timestamp).toISOString()}>
                                  {new Date(event.timestamp).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                                </time>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-5 border-t border-border pt-4">
                      <h4 className="text-sm font-semibold mb-3">Actions de support contrôlées</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        <button onClick={() => { const answer = window.prompt(`Action sensible : le solde de ${supportSnapshot.user.email || `l'utilisateur #${supportSnapshot.user.id}`} sera remplacé par 10. Tape RESET pour confirmer.`); if (answer === "RESET") resetCreditsMut.mutate({ userId: supportSnapshot.user.id, amount: 10 }); else if (answer !== null) toast.error("Confirmation incorrecte — aucune action effectuée"); }} disabled={resetCreditsMut.isPending} className="rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 px-3 py-2 text-xs font-medium">Réinitialiser à 10 crédits</button>
                        <button onClick={() => { const answer = window.prompt(`Action critique : toutes les sessions de ${supportSnapshot.user.email || `l'utilisateur #${supportSnapshot.user.id}`} seront invalidées. Tape REVOKE pour confirmer.`); if (answer === "REVOKE") revokeSessionsMut.mutate({ userId: supportSnapshot.user.id }); else if (answer !== null) toast.error("Confirmation incorrecte — aucune action effectuée"); }} disabled={revokeSessionsMut.isPending} className="rounded-lg bg-red-500/80 hover:bg-red-500 disabled:opacity-50 px-3 py-2 text-xs font-medium">Révoquer les sessions</button>
                        <button onClick={() => { if (!supportMessage.trim()) toast.error("Message requis"); else notifyUserMut.mutate({ userId: supportSnapshot.user.id, title: supportTitle, message: supportMessage, type: "system" }); }} disabled={notifyUserMut.isPending} className="rounded-lg bg-blue-500/80 hover:bg-blue-500 disabled:opacity-50 px-3 py-2 text-xs font-medium">Envoyer la notification</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={supportTitle} onChange={e => setSupportTitle(e.target.value)} placeholder="Titre de notification" className="bg-black/40 border border-border rounded-lg px-3 py-2 text-xs" />
                        <input value={supportMessage} onChange={e => setSupportMessage(e.target.value)} placeholder="Message ciblé à l'utilisateur" className="bg-black/40 border border-border rounded-lg px-3 py-2 text-xs" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-muted border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-3">Incidents récents</h3>
                {(operations?.failedGenerations ?? []).length === 0 ? <p className="text-sm text-gray-500">Aucun échec récent.</p> : (
                  <div className="space-y-2">{operations?.failedGenerations.map((incident) => (
                    <div key={incident.id} className="flex items-center gap-3 border-b border-border/60 pb-2 last:border-0">
                      <Bug size={14} className="text-red-400 shrink-0" />
                      <span className="text-xs flex-1 truncate">#{incident.id} · {incident.prompt}</span>
                      <span className="text-[11px] text-gray-500">user {incident.userId}</span>
                    </div>
                  ))}</div>
                )}
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
                    className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm"
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
                  className="bg-orange-500 hover:bg-orange-400 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  + Ajouter un template
                </button>
              </div>

              {showNewTemplateForm && (
                <div className="bg-muted border border-border rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={newTemplateTitle}
                    onChange={e => setNewTemplateTitle(e.target.value)}
                    placeholder="Titre du template"
                    className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="url"
                    value={newTemplateImageUrl}
                    onChange={e => setNewTemplateImageUrl(e.target.value)}
                    placeholder="URL de l'image (Unsplash/Pexels/autre)"
                    className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={newTemplateCategory}
                    onChange={e => setNewTemplateCategory(e.target.value)}
                    className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-sm"
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
                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {createTemplateMut.isPending ? "Création..." : "Créer le template"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(allTemplates || []).map(t => (
                  <div key={t.id} className="relative group bg-muted border border-border rounded-lg overflow-hidden">
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
              <div className="bg-muted rounded-xl border border-border p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Key size={16} className="text-orange-400" /> Modèles de génération IA
                </h3>
                <div className="space-y-3">
                  {(models?.models || []).map((m: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-black/40 rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Zap size={14} className="text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.model || m.id || "Unknown"}</p>
                          <p className="text-xs text-gray-500">Modèle Forge</p>
                        </div>
                      </div>
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Actif</span>
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

              <div className="bg-muted rounded-xl border border-border p-5">
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
              <div className="bg-muted border border-border rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Titre</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    placeholder="Ex: Nouvelle fonctionnalité disponible !"
                    className="w-full bg-black/50 border border-border rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Message (optionnel)</label>
                  <textarea
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    placeholder="Détails de la notification..."
                    rows={3}
                    className="w-full bg-black/50 border border-border rounded-lg px-4 py-2.5 text-sm resize-none"
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
                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    {sendNotifMut.isPending ? "Envoi..." : "Envoyer à tous"}
                  </button>
                </div>
              </div>

              <div className="bg-muted border border-border rounded-xl p-5">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Types de notifications disponibles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {["system", "credit", "generation", "team"].map(type => (
                    <span key={type} className="bg-black/40 text-gray-400 text-xs px-3 py-2 rounded-lg capitalize">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-muted border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3"><div><h4 className="text-sm font-medium text-gray-300">Journal d’audit</h4><p className="text-xs text-gray-500 mt-1">Historique des révocations et notifications sensibles.</p></div><span className="text-[11px] text-gray-500">{auditLogs?.length ?? 0} entrées</span></div>
                <div className="space-y-2 max-h-72 overflow-auto">
                  {(auditLogs ?? []).length === 0 ? <p className="text-xs text-gray-500 py-4">Aucune action enregistrée.</p> : (auditLogs ?? []).map((log) => {
                    const detail = log.details ? (() => { try { return JSON.parse(log.details); } catch { return {}; } })() : {};
                    return <div key={log.id} className="flex items-start gap-3 rounded-lg bg-black/30 px-3 py-2.5 text-xs"><span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${log.action === "legacy_keys_revoked" ? "bg-orange-400" : "bg-cyan-400"}`} /><div className="min-w-0 flex-1"><p className="text-gray-200">{log.action === "legacy_keys_revoked" ? "Révocation de clés API héritées" : "Notification envoyée"}</p><p className="text-gray-500 mt-0.5">{detail.revokedCount ? `${detail.revokedCount} clé(s)` : detail.scope === "global" ? `Globale · ${detail.title ?? ""}` : `Utilisateur #${log.targetUserId ?? "—"}`} · {new Date(log.createdAt).toLocaleString("fr-FR")}</p></div></div>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Paramètres Super Admin</h3>
              <div className="bg-muted border border-orange-500/20 rounded-xl p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-orange-300">Pilotage des fonctionnalités client</h4>
                  <p className="text-xs text-gray-500 mt-1">Ces réglages sont persistants et s’appliquent immédiatement à l’environnement utilisateur.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {([
                    ["client.generationEnabled", "Génération authentifiée", "Autoriser les utilisateurs connectés à générer des miniatures."],
                    ["client.batchEnabled", "Génération en lot", "Afficher et autoriser le workflow Batch Upload."],
                    ["client.freeWatermark", "Filigrane plan gratuit", "Appliquer le filigrane Minia IA aux exports gratuits."],
                    ["client.guestDemoEnabled", "Démo invitée", "Autoriser la génération réelle depuis la landing sans compte."],
                  ] as const).map(([key, label, description]) => {
                    const enabled = clientSettings?.[key] === "yes";
                    return <button key={key} type="button" onClick={() => updateClientSettingMut.mutate({ key, value: enabled ? "no" : "yes" })} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3 text-left hover:border-orange-400/50 transition-colors">
                      <span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-[11px] text-gray-500">{description}</span></span>
                      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-orange-500" : "bg-gray-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} /></span>
                    </button>;
                  })}
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/60 p-3">
                  <span><span className="block text-sm font-medium">Quota démo invitée</span><span className="mt-1 block text-[11px] text-gray-500">Nombre maximal de générations réelles par adresse IP et par 24 h (1 à 5).</span></span>
                  <select value={clientSettings?.["client.guestDailyLimit"] ?? "2"} onChange={event => updateClientSettingMut.mutate({ key: "client.guestDailyLimit", value: event.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>
                </div>
              </div>
              <div className="bg-muted border border-orange-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-orange-400 mt-0.5 shrink-0" size={18} />
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium">Migration des anciennes clés API</h4>
                    <p className="text-xs text-gray-500 mt-1">Les anciennes clés au format texte sont détectées sans être affichées. La migration les révoque et informe chaque utilisateur concerné.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-300">{legacyApiKeys?.keyCount ?? 0} clé(s) active(s) héritée(s) · {legacyApiKeys?.userCount ?? 0} utilisateur(s)</p>
                  <button type="button" disabled={!legacyApiKeys?.keyCount || migrateLegacyApiKeysMut.isPending} onClick={() => migrateLegacyApiKeysMut.mutate()} className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-400 disabled:opacity-50">
                    {migrateLegacyApiKeysMut.isPending ? "Migration…" : "Révoquer et notifier"}
                  </button>
                </div>
              </div>
              <div className="bg-muted border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Crédits par défaut (nouvel utilisateur)</p>
                    <p className="text-xs text-gray-500">Nombre de crédits attribués à l'inscription</p>
                  </div>
                  <span className="text-sm text-orange-400">10</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Plan gratuit — crédits</p>
                    <p className="text-xs text-gray-500">Crédits mensuels pour le plan Free</p>
                  </div>
                  <span className="text-sm text-gray-400">10</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Plan Pro — crédits</p>
                    <p className="text-xs text-gray-500">Crédits mensuels pour le plan Pro</p>
                  </div>
                  <span className="text-sm text-orange-400">100</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Plan Max — crédits</p>
                    <p className="text-xs text-gray-500">Crédits mensuels pour le plan Max</p>
                  </div>
                  <span className="text-sm text-orange-400">500</span>
                </div>
              </div>

              <div className="bg-muted border border-border rounded-xl p-5">
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

          {/* Testimonials Tab (moderation) */}
          {activeTab === "testimonials" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Modération des avis réels</h3>
              <p className="text-xs text-gray-400">
                Les avis soumis via le formulaire public sont "pending" par défaut. Valide-les pour qu'ils apparaissent sur la landing.
              </p>

              {/* Pending */}
              <div>
                <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2 mb-3">
                  <Clock size={14} /> À modérer ({pendingTestimonials.length})
                </h4>
                <div className="space-y-3">
                  {pendingTestimonials.length === 0 && (
                    <div className="bg-muted border border-dashed border-border rounded-xl p-6 text-center text-xs text-gray-500">
                      Aucun avis en attente de modération.
                    </div>
                  )}
                  {(pendingTestimonials || []).map(t => (
                    <div key={t.id} className="bg-muted border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-white">{t.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {t.authorName || "Anonyme"}{t.authorChannel ? ` • @${t.authorChannel}` : ""} • {t.rating}/5 ★
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setVerifiedMut.mutate({ id: t.id, verified: "approved" })}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                          >
                            <CheckCircle2 size={12} /> Valider
                          </button>
                          <button
                            onClick={() => setVerifiedMut.mutate({ id: t.id, verified: "rejected" })}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <XCircle size={12} /> Refuser
                          </button>
                          <button
                            onClick={() => deleteTestimonialMut.mutate({ id: t.id })}
                            className="text-xs p-1.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved */}
              <div>
                <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} /> Validés et affichés ({approvedTestimonials.length})
                </h4>
                <div className="space-y-3">
                  {(approvedTestimonials || []).map(t => (
                    <div key={t.id} className="bg-muted border border-orange-500/20 rounded-xl p-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-white">{t.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t.authorName || "Anonyme"}{t.authorChannel ? ` • @${t.authorChannel}` : ""} • {t.rating}/5 ★
                        </p>
                      </div>
                      <button
                        onClick={() => setVerifiedMut.mutate({ id: t.id, verified: "pending" })}
                        className="text-xs px-3 py-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors shrink-0"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejected */}
              {rejectedTestimonials.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-3">
                    <XCircle size={14} /> Refusés ({rejectedTestimonials.length})
                  </h4>
                  <div className="space-y-3">
                    {(rejectedTestimonials || []).map(t => (
                      <div key={t.id} className="bg-muted border border-border rounded-xl p-4 flex items-start justify-between gap-3 opacity-60">
                        <div className="flex-1">
                          <p className="text-sm text-white">{t.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{t.authorName || "Anonyme"}</p>
                        </div>
                        <button
                          onClick={() => setVerifiedMut.mutate({ id: t.id, verified: "pending" })}
                          className="text-xs px-3 py-1.5 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors shrink-0"
                        >
                          Réviser
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
    cyan: "border-orange-400/30",
    pink: "border-orange-400/30",
    purple: "border-orange-400/30",
    teal: "border-orange-500/30",
    orange: "border-orange-500/30",
    blue: "border-blue-500/30",
    red: "border-red-500/30",
    gold: "border-yellow-500/30",
  };
  const iconColorMap: Record<string, string> = {
    cyan: "text-orange-400", pink: "text-pink-400", purple: "text-purple-400",
    teal: "text-orange-400", orange: "text-orange-400", blue: "text-blue-400",
    red: "text-red-400", gold: "text-yellow-400",
  };

  return (
    <div className={`bg-muted rounded-xl border ${colorMap[color]} p-4`}>
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
    <div className="flex items-center gap-3 bg-muted rounded-lg border border-border p-3">
      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
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
              className="text-xs bg-orange-500 text-white px-2 py-1 rounded"
            >
              ✓
            </button>
            <button
              onClick={() => setEditCredits(false)}
              className="text-xs bg-muted/80 text-gray-400 px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditCredits(true)}
            className="text-xs text-gray-400 w-16 text-right hover:text-orange-400 transition-colors"
          >
            {userCredits} crédits
          </button>
        )}
        <div className="flex gap-1">
          <button
            onClick={() => onUpdatePlan(userPlan === "free" ? "pro" : userPlan === "pro" ? "max" : "free")}
            className="text-xs bg-muted/80 hover:bg-white/20 px-2 py-1 rounded transition-colors"
            title="Changer le plan"
          >
            <Crown size={12} />
          </button>
          <button
            onClick={() => onUpdateRole(user.role === "admin" ? "user" : "admin")}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              user.role === "admin" ? "bg-red-500/20 text-red-400" : "bg-muted/80 hover:bg-white/20 text-gray-300"
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
