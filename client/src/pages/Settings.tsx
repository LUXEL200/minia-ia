import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Settings,
  Bell,
  Eye,
  Globe,
} from "lucide-react";

export default function SettingsPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const [emailNotifs, setEmailNotifs] = useState<boolean>(() => localStorage.getItem("minia-email-notifs") !== "0");
  const [pushNotifs, setPushNotifs] = useState<boolean>(() => localStorage.getItem("minia-push-notifs") !== "0");
  const [autoDownload, setAutoDownload] = useState<boolean>(() => localStorage.getItem("minia-auto-download") === "1");
  const [animSound, setAnimSound] = useState<boolean>(() => localStorage.getItem("minia-anim-sound") !== "0");
  const [defaultStyle, setDefaultStyle] = useState("viral");
  const [language, setLanguage] = useState("fr");

  const styles = [
    { id: "viral", label: "Viral" },
    { id: "minimalist", label: "Minimaliste" },
    { id: "dramatic", label: "Dramatic" },
    { id: "tech", label: "Tech" },
    { id: "retro", label: "Retro" },
    { id: "mrbeast", label: "MrBeast" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <PageHeader
          title="Paramètres"
          subtitle="Configure ton expérience Minia IA"
          breadcrumb={[{ label: "Paramètres" }]}
        />

        {/* Notifications */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-orange-400" size={18} />
            <h2 className="font-semibold text-sm">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Notifications email</p>
                <p className="text-xs text-zinc-500">Recevoir un email quand une miniature est prête</p>
              </div>
              <Switch
                checked={emailNotifs}
                onCheckedChange={(v) => { setEmailNotifs(v); localStorage.setItem("minia-email-notifs", v ? "1" : "0"); toast.success("Notifications email activées"); }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Notifications push</p>
                <p className="text-xs text-zinc-500">Alertes en temps réel dans le navigateur</p>
              </div>
              <Switch
                checked={pushNotifs}
                onCheckedChange={(v) => { setPushNotifs(v); localStorage.setItem("minia-push-notifs", v ? "1" : "0"); toast.success("Notifications push activées"); }}
              />
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="text-orange-400" size={18} />
            <h2 className="font-semibold text-sm">Affichage</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Téléchargement auto</p>
                <p className="text-xs text-zinc-500">Télécharger automatiquement après génération</p>
              </div>
              <Switch
                checked={autoDownload}
                onCheckedChange={(v) => { setAutoDownload(v); localStorage.setItem("minia-auto-download", v ? "1" : "0"); toast.success("Téléchargement automatique activé"); }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Sons d'animation</p>
                <p className="text-xs text-zinc-500">Effet sonore lors de la révélation de l'ours IA</p>
              </div>
              <Switch
                checked={animSound}
                onCheckedChange={(v) => { setAnimSound(v); localStorage.setItem("minia-anim-sound", v ? "1" : "0"); toast.success(v ? "Sons d'animation activés" : "Sons d'animation désactivés"); }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Style par défaut</p>
                <p className="text-xs text-zinc-500">Style pré-sélectionné à la génération</p>
              </div>
              <select
                value={defaultStyle}
                onChange={(e) => { setDefaultStyle(e.target.value); toast.success("Paramètre mis à jour"); }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* General */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-orange-400" size={18} />
            <h2 className="font-semibold text-sm">Général</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Langue</p>
                <p className="text-xs text-zinc-500">Langue de l'interface</p>
              </div>
              <select
                value={language}
                onChange={(e) => { setLanguage(e.target.value); toast.success("Langue mise à jour"); }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
