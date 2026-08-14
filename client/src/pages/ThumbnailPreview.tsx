import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, ZoomIn, ZoomOut, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function ThumbnailPreviewPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const { data: thumbnails, isLoading } = trpc.thumbnail.list.useQuery();
  const [selected, setSelected] = useState<any>(null);
  const [zoom, setZoom] = useState(100);

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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <PageHeader
          title="Aperçu miniature"
          subtitle="Visualise tes miniatures en plein écran"
          breadcrumb={[{ label: "Aperçu" }]}
        />

        {/* Thumbnails Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : thumbnails?.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Eye className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucune miniature</p>
            <p className="text-sm">Génère ta première miniature pour la prévisualiser ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {thumbnails?.map((t: any) => (
              <div
                key={t.id}
                onClick={() => { setSelected(t); setZoom(100); }}
                className="group relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
              >
                <img src={t.imageUrl} alt={t.prompt || "Thumbnail"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Eye className="opacity-0 group-hover:opacity-100 transition-opacity text-white" size={24} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={(e) => { e.stopPropagation(); setZoom(Math.max(50, zoom - 25)); }}
              className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm text-zinc-400 w-12 text-center">{zoom}%</span>
            <button
              onClick={(e) => { e.stopPropagation(); setZoom(Math.min(200, zoom + 25)); }}
              className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
            <a
              href={selected.imageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-[#ff0050] rounded-lg hover:bg-[#e60048] transition-colors"
            >
              <Download size={18} />
            </a>
          </div>

          <img
            src={selected.imageUrl}
            alt={selected.prompt || "Thumbnail"}
            className="max-w-[90vw] max-h-[75vh] object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />

          <p className="text-sm text-zinc-400 mt-4 text-center max-w-md truncate px-4">
            {selected.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
