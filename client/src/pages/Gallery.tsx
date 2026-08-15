import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, ImageIcon, Sparkles, Filter, Heart, TrendingUp, Clock, Pencil, Share2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const STYLES = [
  { key: "all", label: "Tous" },
  { key: "viral", label: "Viral" },
  { key: "mrbeast", label: "MrBeast" },
  { key: "minimalist", label: "Minimaliste" },
  { key: "dramatic", label: "Dramatique" },
  { key: "tech", label: "Tech" },
  { key: "retro", label: "Rétro" },
];

const STYLE_LABELS: Record<string, string> = {
  viral: "Viral",
  mrbeast: "MrBeast",
  minimalist: "Minimaliste",
  dramatic: "Dramatique",
  tech: "Tech",
  retro: "Rétro",
};

export default function Gallery() {
  const { isAuthenticated } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [likedThumbs, setLikedThumbs] = useState<Record<number, { count: number; liked: boolean }>>({});

  const { data: thumbnails, isLoading } = trpc.gallery.thumbnails.useQuery({
    style: selectedStyle === "all" ? undefined : selectedStyle,
    limit: 48,
    sortBy,
  });

  const { data: stats } = trpc.gallery.stats.useQuery();

  // Likes
  const { data: likesData } = trpc.likes.bulk.useQuery(
    { thumbnailIds: thumbnails?.filter(t => t.imageUrl).map(t => t.id) ?? [] },
    { enabled: (thumbnails?.filter(t => t.imageUrl).length ?? 0) > 0 }
  );

  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: (data, vars) => {
      setLikedThumbs(prev => ({ ...prev, [vars.thumbnailId]: { count: data.count, liked: data.liked } }));
      if (!data.liked) {
        toast.success("Like retiré");
      }
    },
  });

  useEffect(() => {
    if (likesData) {
      const mapped: Record<number, { count: number; liked: boolean }> = {};
      for (const [id, data] of Object.entries(likesData ?? {})) {
        mapped[Number(id)] = data as any;
      }
      setLikedThumbs(mapped);
    }
  }, [likesData]);

  const handleLike = (thumbnailId: number) => {
    if (!isAuthenticated) {
      toast.error("Connecte-toi pour liker des miniatures");
      return;
    }
    likeMutation.mutate({ thumbnailId });
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 pb-16">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-400/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-orange-400/8 rounded-full blur-[100px] pointer-events-none" />

          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-[#A1A1AA]">
                  {stats?.total ? `${stats.total.toLocaleString("fr-FR")}` : "0"} miniatures générées
                </span>
              </div>

              <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-4">
                Galerie{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                  Communautaire
                </span>
              </h1>

              <p className="text-lg text-[#A1A1AA] max-w-xl mx-auto">
                Explore les meilleures miniatures générées par la communauté Minia IA.
                Filtre par style, vote pour tes préférées, et laisse-toi inspirer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters + Sort */}
        <section className="container pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            {/* Style filter */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <Filter className="w-4 h-4 text-[#71717A] shrink-0" />
              {STYLES.map(style => (
                <button
                  key={style.key}
                  onClick={() => setSelectedStyle(style.key)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedStyle === style.key
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-400/25"
                      : "bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-orange-400/30 hover:text-white"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy("recent")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sortBy === "recent" ? "bg-cyan-500/20 text-orange-400" : "text-[#71717A] hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Récentes
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sortBy === "popular" ? "bg-orange-500/20 text-orange-400" : "text-[#71717A] hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Populaires
            </button>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="container pb-24">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-video bg-[#18181B] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : thumbnails && thumbnails.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {thumbnails.map((thumb, index) => (
                <motion.div
                  key={thumb.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A] hover:border-orange-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-400/10"
                >
                  {thumb.imageUrl ? (
                    <img
                      src={thumb.imageUrl}
                      alt={`Miniature ${STYLE_LABELS[thumb.style ?? "viral"]}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-[#3F3F46]" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-block px-2 py-1 bg-cyan-500/20 border border-orange-400/30 rounded text-xs text-orange-400 font-medium">
                          {STYLE_LABELS[thumb.style ?? "viral"]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLike(thumb.id); }}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-orange-400/20 transition-colors"
                            title="Ajouter aux favoris"
                          >
                            <Heart className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard?.writeText(`${window.location.origin}/gallery`).then(
                                () => toast.success("Lien copié dans le presse-papiers !"),
                                () => toast.error("Impossible de copier le lien"),
                              );
                            }}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
                            title="Partager"
                          >
                            <Share2 className="w-4 h-4 text-white" />
                          </button>
                          <Link
                            href={`/editor?image=${encodeURIComponent(thumb.imageUrl || "")}`}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
                            title="Modifier avec l'éditeur"
                          >
                            <Pencil className="w-4 h-4 text-white" />
                          </Link>
                          <a
                            href={thumb.imageUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!thumb.imageUrl) e.preventDefault();
                            }}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      </div>
                      {thumb.prompt && (
                        <p className="mt-2 text-xs text-white/70 line-clamp-2">
                          {thumb.prompt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Style badge always visible */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-block px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-xs text-[#A1A1AA]">
                      {STYLE_LABELS[thumb.style ?? "viral"]}
                    </span>
                  </div>

                  {/* Like button */}
                  {isAuthenticated && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(thumb.id); }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm transition-all ${
                        likedThumbs[thumb.id]?.liked
                          ? "bg-orange-500/30 hover:bg-orange-500/50"
                          : "bg-black/40 hover:bg-black/60"
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-all ${
                        likedThumbs[thumb.id]?.liked
                          ? "text-orange-500 fill-orange-500 scale-110"
                          : "text-white"
                      }`} />
                    </button>
                  )}

                  {/* Like count badge */}
                  {likedThumbs[thumb.id] && likedThumbs[thumb.id].count > 0 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full">
                      <Heart className={`w-3 h-3 ${likedThumbs[thumb.id].liked ? "text-orange-500 fill-orange-500" : "text-white"}`} />
                      <span className="text-xs text-white">{likedThumbs[thumb.id].count}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#18181B] rounded-2xl mb-4">
                <ImageIcon className="w-8 h-8 text-[#3F3F46]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Aucune miniature pour ce filtre
              </h3>
              <p className="text-[#71717A] mb-6">
                {selectedStyle === "all"
                  ? "La galerie se remplit au fur et à mesure des générations."
                  : `Aucune miniature de style "${STYLE_LABELS[selectedStyle]}" pour le moment.`}
              </p>
              {isAuthenticated ? (
                <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
                  <Sparkles className="w-4 h-4" />
                  Générer des miniatures
                </Link>
              ) : (
                <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
                  Essayer gratuitement
                  <span className="text-lg">→</span>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="container pb-24">
          <div className="relative bg-gradient-to-r from-orange-400/10 to-orange-300/10 border border-orange-400/20 rounded-2xl p-8 md:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-300/5 rounded-2xl" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Prêt à créer ta propre{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
                  miniature virale
                </span>
                ?
              </h2>
              <p className="text-[#A1A1AA] mb-6 max-w-lg mx-auto">
                Rejoins des milliers de créateurs qui génèrent leurs miniatures en 30 secondes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isAuthenticated ? (
                  <Link href="/dashboard" className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
                    Ouvrir le Dashboard →
                  </Link>
                ) : (
                  <Link href="/" className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
                    Essayer gratuitement →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
