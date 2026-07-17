/**
 * Dashboard Page — Minia IA
 * User dashboard for generating thumbnails
 * Uses DashboardLayout from the template
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Image, Users, CreditCard, Settings } from "lucide-react";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      startLogin();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#EC4899]" />
          <p className="text-zinc-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Connexion en cours...</p>
          <Button onClick={startLogin} className="bg-[#06B6D4] text-black">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Miniatures générées", value: "12", icon: Image, color: "#06B6D4" },
    { label: "Personas", value: "1", icon: Users, color: "#EC4899" },
    { label: "Crédits restants", value: "8", icon: CreditCard, color: "#22C55E" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/90 backdrop-blur-xl border-b border-[#27272A]">
        <nav className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-base font-bold text-white">
              Minia<span className="text-[#06B6D4]">IA</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              {user.name || user.email}
            </span>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Welcome */}
          <div className="mb-10">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Bienvenue, <span className="text-[#06B6D4]">{user.name || user.email}</span>
            </h1>
            <p className="text-zinc-400">Créez votre prochaine miniature virale.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-[#18181B] border border-[#27272A] flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Generate Card */}
          <div className="rounded-xl bg-[#18181B] border border-[#06B6D4]/20 p-8 text-center mb-10">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center mx-auto mb-6">
              <Image className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-3">
              Créer une nouvelle miniature
            </h2>
            <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
              Sélectionnez votre Persona, collez un lien d'inspiration, et générez 4 variations en moins de 30 secondes.
            </p>
            <Button
              size="lg"
              className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-bold"
            >
              <Zap className="mr-2 w-4 h-4" />
              Générer une miniature
            </Button>
          </div>

          {/* Recent generations placeholder */}
          <div className="rounded-xl bg-[#18181B] border border-[#27272A] p-6">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              Miniatures récentes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg bg-[#09090B] border border-[#27272A] flex items-center justify-center"
                >
                  <p className="text-xs text-zinc-600">Aucune génération</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
