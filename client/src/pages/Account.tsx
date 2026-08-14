import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { ArrowLeft, User, Coins, Shield } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const { data: credits } = trpc.thumbnail.credits.useQuery();

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
          title="Compte"
          subtitle="Gère tes informations personnelles"
          breadcrumb={[{ label: "Compte" }]}
        />

        {/* Profile Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#ff0050] flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <p className="text-sm text-zinc-400">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                {user?.role === "admin" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-[#ff0050] text-white px-2 py-0.5 rounded-full">
                    <Shield size={10} /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                    <User size={10} /> Créateur
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="text-[#ff0050]" size={16} />
                  <span className="text-xs text-zinc-400">Crédits disponibles</span>
                </div>
                <p className="text-2xl font-bold">{credits?.credits ?? 0}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="text-[#ff0050]" size={16} />
                  <span className="text-xs text-zinc-400">Membre depuis</span>
                </div>
                <p className="text-lg font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Informations</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Nom</span>
              <span>{user?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Email</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">ID</span>
              <span className="font-mono text-xs text-zinc-500">{user?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
