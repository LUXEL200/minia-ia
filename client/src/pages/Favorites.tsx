import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Heart, Download } from "lucide-react";

export default function FavoritesPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const { data: favorites, isLoading } = trpc.favorites.list.useQuery();

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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Retour au dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Favoris</h1>
          <p className="text-sm text-zinc-500 mt-1">Tes miniatures préférées</p>
        </div>

        {/* Favorites Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : favorites?.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Heart className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucun favori</p>
            <p className="text-sm">Like une miniature depuis la galerie pour la retrouver ici !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {favorites?.map((f: any) => (
              <div key={f.id} className="group relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <img src={f.imageUrl} alt={f.prompt || "Thumbnail"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a
                    href={f.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black p-2 rounded-full hover:bg-zinc-200 transition-colors"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
