import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Bell,
  Eye,
  Palette,
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
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Retour au dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure ton expérience Minia IA</p>
        </div>

        {/* Notifications */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-[#ff0050]" size={18} />
            <h2 className="font-semibold text-sm">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Notifications email</p>
                <p className="text-xs text-zinc-500">Recevoir un email quand une miniature est prête</p>
              </div>
              <button
                onClick={() => { setEmailNotifs(!emailNotifs); toast.success("Paramètre mis à jour"); }}
                className={`w-10 h-5 rounded-full relative transition-colors ${emailNotifs ? "bg-[#ff0050]" : "bg-zinc-700"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${emailNotifs ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Notifications push</p>
                <p className="text-xs text-zinc-500">Alertes en temps réel dans le navigateur</p>
              </div>
              <button
                onClick={() => { setPushNotifs(!pushNotifs); toast.success("Paramètre mis à jour"); }}
                className={`w-10 h-5 rounded-full relative transition-colors ${pushNotifs ? "bg-[#ff0050]" : "bg-zinc-700"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${pushNotifs ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="text-[#ff0050]" size={18} />
            <h2 className="font-semibold text-sm">Affichage</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Téléchargement auto</p>
                <p className="text-xs text-zinc-500">Télécharger automatiquement après génération</p>
              </div>
              <button
                onClick={() => { setAutoDownload(!autoDownload); toast.success("Paramètre mis à jour"); }}
                className={`w-10 h-5 rounded-full relative transition-colors ${autoDownload ? "bg-[#ff0050]" : "bg-zinc-700"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoDownload ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
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
            <Globe className="text-[#ff0050]" size={18} />
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
