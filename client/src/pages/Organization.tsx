/**
 * Organisation — gestion de l'espace de travail :
 * profil de l'organisation (avatar, nom, @slug, description), panneau d'usage
 * (crédits / personnes / modèles avec barres de progression), membres de l'équipe,
 * informations détaillées, actes (quitter), et onglet « Modifier l'organisation ».
 */
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import {
  Upload, Save, Trash2, Copy, CalendarDays, Users, Zap,
  ChevronLeft, UserPlus, KeyRound, ArrowLeft,
} from "lucide-react";

type Tab = "overview" | "edit";

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copié !"));
}

export default function OrganizationPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/dashboard");
  }, [loading, isAuthenticated, navigate]);

  const utils = trpc.useUtils();
  const { data: org, isLoading: orgLoading } = trpc.org.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const orgQuery = trpc.useUtils().org.me;
  const { data: usage } = trpc.org.usage.useQuery(undefined, { enabled: isAuthenticated });
  const updateOrg = trpc.org.update.useMutation();
  const removeMember = trpc.org.removeMember.useMutation();
  const leaveOrg = trpc.org.leaveOrg.useMutation();
  const uploadLogo = trpc.thumbnail.saveFromBase64.useMutation();

  // ===== Edit form state =====
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoDirty, setLogoDirty] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name || "");
      setSlug(org.slug || "");
      setDescription(org.description || "");
      setLogoDataUrl(org.logoUrl || null);
    }
  }, [org]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Format image requis (WebP, JPEG, PNG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 2 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(reader.result as string);
      setLogoDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast.error("La limace doit contenir uniquement des lettres minuscules, des chiffres et des tirets");
      return;
    }
    setSaving(true);
    const finish = (logoUrl: string | null) => {
      updateOrg.mutate(
        { name: name.trim(), slug: slug.trim(), description: description.trim(), logoUrl },
        {
          onSuccess: () => {
            toast.success("Organisation enregistrée");
            utils.org.me.invalidate();
          },
          onError: (err) => toast.error(err.message),
          onSettled: () => setSaving(false),
        }
      );
    };
    if (logoDirty && logoDataUrl) {
      uploadLogo.mutate(
        { b64: logoDataUrl.split(",")[1] || logoDataUrl, mime: "image/png", title: "Logo organisation" },
        {
          onSuccess: async (res) => {
            const thumb = await utils.thumbnail.get.fetch({ id: res.id });
            finish(thumb?.imageUrl || null);
            setLogoDirty(false);
          },
          onError: (err) => {
            toast.error(`Échec de l'upload du logo : ${err.message}`);
            setSaving(false);
          },
        }
      );
    } else {
      finish(logoDataUrl);
    }
  };

  const handleRemoveMember = (userId: number) => {
    removeMember.mutate(
      { userId },
      {
        onSuccess: () => {
          toast.success("Membre révoqué");
          utils.org.me.invalidate();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const memberCount = org?.members?.length ?? 0;
  const isOwner = org?.role === "owner";
  const creditsUsed = usage?.credits ?? 0;
  const creditsLimit = usage?.creditsLimit ?? 0;
  const membersUsed = usage?.memberCount ?? 0;
  const membersLimit = usage?.membersLimit ?? 2;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title={tab === "edit" ? "Modifier l'organisation" : "Organisation"}
          subtitle="Gérez le profil, l'usage et les membres de votre organisation"
          breadcrumb={tab === "edit" ? [{ label: "Organisation", href: "/organisation" }, { label: "Modifier" }] : [{ label: "Organisation" }]}
          right={
            tab === "overview" ? (
              <button
                onClick={() => setTab("edit")}
                className="hidden sm:flex items-center gap-2 bg-[#ff0050] hover:bg-[#e60048] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <KeyRound size={14} /> <span className="hidden sm:inline">Modifier</span>
              </button>
            ) : (
              <button
                onClick={() => setTab("overview")}
                className="hidden sm:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <ArrowLeft size={14} /> <span className="hidden sm:inline">Retour</span>
              </button>
            )
          }
        />

        {orgLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-2xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <>
            {/* ===== OVERVIEW TAB ===== */}
            {tab === "overview" && (
              <div className="space-y-4">
                {/* Org profile card */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    {org?.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt="Logo"
                        className="w-14 h-14 rounded-2xl object-cover bg-zinc-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {(org?.name || "O").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-base font-semibold truncate">{org?.name || "Mon organisation"}</p>
                      <p className="text-[11px] text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-0.5 inline-block mt-1">
                        @{org?.slug || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-800/60 space-y-2 text-xs">
                    <div>
                      <p className="text-zinc-500 mb-1">Description</p>
                      <p className="text-zinc-300">{org?.description || <span className="text-zinc-600">Aucune description</span>}</p>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CalendarDays size={13} />
                      Créé le {org?.createdAt ? new Date(org.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Users size={13} />
                      {memberCount} membre{memberCount > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Usage card */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={15} className="text-yellow-400" />
                      <p className="text-sm font-semibold">Usage</p>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-300 rounded px-2 py-0.5">
                      {(usage?.planType || org?.plan)?.toUpperCase() || "GRATUIT"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <UsageBar label="Crédits" current={creditsUsed} limit={creditsLimit || 1} />
                    <UsageBar label="Personnes" current={membersUsed} limit={membersLimit} />
                    <UsageBar label="Modèles" current={0} limit={100} />
                  </div>
                </div>

                {/* Team members card */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={15} />
                    <p className="text-sm font-semibold">Membres de l'équipe</p>
                  </div>
                  <div className="space-y-2">
                    {(org?.members ?? []).length === 0 ? (
                      <p className="text-xs text-zinc-600 py-4 text-center">Aucun membre</p>
                    ) : (
                      (org?.members ?? []).map((m: any) => (
                        <div key={m.userId} className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(m.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{m.name || m.email}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{m.email}</p>
                          </div>
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 rounded px-2 py-0.5 flex-shrink-0">
                            {m.role === "owner" ? "propriétaire" : m.role === "admin" ? "admin" : "membre"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Detailed info card */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
                  <p className="text-sm font-semibold mb-4">Informations détaillées</p>
                  <div className="space-y-4 text-xs">
                    <div>
                      <p className="text-zinc-500 mb-1">Identifiant unique</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] truncate">
                          {org?.id || "—"}
                        </code>
                        <button onClick={() => copyText(String(org?.id ?? ""))} className="text-zinc-400 hover:text-white p-1.5">
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Identifiant de l'organisation</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] truncate">
                          @{org?.slug || "—"}
                        </code>
                        <button onClick={() => copyText(org?.slug ?? "")} className="text-zinc-400 hover:text-white p-1.5">
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Dernière mise à jour</p>
                      <p className="text-zinc-300">
                        {org?.updatedAt ? new Date(org.updatedAt).toLocaleDateString("fr-FR") : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acts card */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
                  <p className="text-sm font-semibold mb-4">Actes</p>
                  <button
                    onClick={() => {
                      if (isOwner) {
                        toast.error("Le propriétaire ne peut pas quitter l'organisation");
                        return;
                      }
                      if (window.confirm("Êtes-vous sûr de vouloir quitter cette organisation ? Vous n'aurez plus accès à ses ressources partagées.")) {
                        leaveOrg.mutate(undefined, {
                          onSuccess: () => {
                            toast.success("Vous avez quitté l'organisation");
                            orgQuery.refetch();
                          },
                          onError: (err) => toast.error(err.message),
                        });
                      }
                    }}
                    disabled={leaveOrg.isPending}
                    className="bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 px-5 py-2.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    {leaveOrg.isPending ? "Départ..." : "Quitter l'organisation"}
                  </button>
                </div>
              </div>
            )}

            {/* ===== EDIT TAB ===== */}
            {tab === "edit" && (
              <div className="space-y-4">
                {/* Logo preview */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5 flex justify-center">
                  <div className="w-32 h-32 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center overflow-hidden">
                    {logoDataUrl ? (
                      <img src={logoDataUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={20} className="text-zinc-600 mb-2" />
                        <span className="text-[10px] text-zinc-600">Aucune image</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-center text-zinc-500">
                  {org?.name || "Mon organisation"} · @{org?.slug || "—"}
                </p>

                {/* Upload box */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5 text-center">
                  <p className="text-xs font-semibold mb-1">Télécharger une image</p>
                  <p className="text-[10px] text-zinc-500 mb-4">
                    Glissez-déposez votre image ici ou cliquez pour la télécharger (WebP, JPEG, PNG)
                  </p>
                  <label className="inline-flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors">
                    <Upload size={18} className="text-zinc-400" />
                    <input
                      type="file"
                      accept="image/webp,image/jpeg,image/png,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {/* Fields */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Nom</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Limace</label>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Utilisé dans l'URL de l'organisation. Doit contenir uniquement des lettres minuscules, des chiffres et des tirets.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || updateOrg.isPending}
                    className="bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 px-5 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    {saving || updateOrg.isPending ? "Enregistrement..." : "Économiser"}
                  </button>
                </div>

                {/* Members management */}
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold">Membres</p>
                    <button
                      onClick={() => navigate("/invitations")}
                      className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-[11px] text-zinc-300 hover:text-white transition-colors"
                    >
                      <UserPlus size={13} /> Ajouter un membre
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase text-zinc-500 border-b border-zinc-800">
                          <th className="text-left py-2 pr-2 font-medium">Avatar</th>
                          <th className="text-left py-2 pr-2 font-medium">Nom</th>
                          <th className="text-left py-2 pr-2 font-medium">Rôle</th>
                          <th className="text-right py-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(org?.members ?? []).map((m: any) => (
                          <tr key={m.userId} className="border-b border-zinc-800/50 last:border-0">
                            <td className="py-2.5 pr-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">
                                {(m.name || "U").charAt(0).toUpperCase()}
                              </div>
                            </td>
                            <td className="py-2.5 pr-2">
                              <p className="truncate max-w-[160px]">{m.name || m.email}</p>
                              <p className="text-[10px] text-zinc-500 truncate">{m.email}</p>
                            </td>
                            <td className="py-2.5 pr-2 text-zinc-400">{m.role}</td>
                            <td className="py-2.5 text-right">
                              {m.role !== "owner" && (
                                <button
                                  onClick={() => handleRemoveMember(m.userId)}
                                  disabled={removeMember.isPending}
                                  className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                  title="Révoquer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const pct = Math.min(100, limit > 0 ? Math.round((current / limit) * 100) : 0);
  const exhausted = current >= limit && limit > 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300">{current} / {limit}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${exhausted ? "bg-[#ff0050]" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
