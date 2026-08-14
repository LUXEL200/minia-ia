import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  ImageOff,
} from "lucide-react";

export default function TrashPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const { data: trashed, isLoading, refetch } = trpc.trash.list.useQuery();
  const restoreMutation = trpc.trash.restore.useMutation();
  const emptyMutation = trpc.trash.empty.useMutation();

  const handleRestore = (trashId: number) => {
    restoreMutation.mutate(
      { trashId },
      {
        onSuccess: () => {
          toast.success("Miniature restaurée !");
          refetch();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleEmpty = () => {
    emptyMutation.mutate(undefined as any,
      {
        onSuccess: () => {
          toast.success("Poubelle vidée");
          refetch();
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Poubelle</h1>
            <p className="text-sm text-zinc-500 mt-1">Miniatures supprimées — restaure-les avant suppression définitive</p>
          </div>
          {trashed && trashed.length > 0 && (
            <button
              onClick={handleEmpty}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              <Trash2 size={16} /> Vider la poubelle
            </button>
          )}
        </div>

        {/* Trash List */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : trashed?.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <ImageOff className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Poubelle vide</p>
            <p className="text-sm">Les miniatures supprimées apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {trashed?.map((t: any) => (
              <div key={t.id} className="group relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <img src={t.imageUrl} alt={t.prompt || "Thumbnail"} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-zinc-400 mb-2 truncate px-2 max-w-full">{t.prompt}</p>
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={() => handleRestore(t.id)}
                        className="flex items-center gap-1 bg-white text-black text-xs px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        <RotateCcw size={12} /> Restaurer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
