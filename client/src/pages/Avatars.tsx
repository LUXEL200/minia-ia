import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Trash2,
  Download,
  Zap,
} from "lucide-react";

const styles = [
  { id: "professional", label: "Professionnel" },
  { id: "gaming", label: "Gaming" },
  { id: "anime", label: "Anime" },
  { id: "photorealistic", label: "Photo réaliste" },
  { id: "minimal", label: "Minimal" },
];

export default function AvatarsPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: avatars, isLoading, refetch } = trpc.avatars.list.useQuery();
  const generateAvatar = trpc.avatars.generate.useMutation();
  const deleteAvatar = trpc.avatars.delete.useMutation();

  const handleGenerate = () => {
    if (prompt.trim().length < 10) {
      toast.error("Décris ton avatar (minimum 10 caractères)");
      return;
    }
    setIsGenerating(true);
    generateAvatar.mutate(
      { prompt: prompt.trim(), style },
      {
        onSuccess: () => {
          toast.success("Avatar généré !");
          setPrompt("");
          refetch();
          setTimeout(() => setIsGenerating(false), 1500);
        },
        onError: (err) => {
          setIsGenerating(false);
          toast.error(err.message);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteAvatar.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Avatar supprimé");
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Avatars</h1>
          <p className="text-sm text-zinc-500 mt-1">Génère des avatars IA pour tes chaînes</p>
        </div>

        {/* Generate Form */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User className="text-[#ff0050]" size={20} />
            <h2 className="font-semibold">Nouvel avatar</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Un personnage cyberpunk avec des lunettes néon, cheveux roses..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Style</label>
              <div className="flex gap-2 flex-wrap">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      style === s.id
                        ? "bg-[#ff0050] text-white"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Zap size={16} />
              {isGenerating ? "Génération..." : "Générer l'avatar"}
            </button>
          </div>
        </div>

        {/* Avatars Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : avatars?.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <User className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucun avatar</p>
            <p className="text-sm">Génère ton premier avatar IA !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {avatars?.map((a: any) => (
              <div key={a.id} className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.prompt} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-zinc-500 text-sm text-center p-4">Génération en cours...</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {a.imageUrl && (
                    <a href={a.imageUrl} download target="_blank" rel="noopener noreferrer" className="bg-white text-black p-2 rounded-full hover:bg-zinc-200 transition-colors">
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
