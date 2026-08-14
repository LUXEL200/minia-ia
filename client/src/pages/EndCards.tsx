import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  CreditCard,
  Trash2,
  Download,
  Zap,
} from "lucide-react";

const styles = [
  { id: "viral", label: "Viral" },
  { id: "minimalist", label: "Minimaliste" },
  { id: "gaming", label: "Gaming" },
  { id: "podcast", label: "Podcast" },
  { id: "tutorial", label: "Tutoriel" },
];

export default function EndCardsPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("viral");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: endCards, isLoading, refetch } = trpc.endCards.list.useQuery();
  const generateEndCard = trpc.endCards.generate.useMutation();
  const deleteEndCard = trpc.endCards.delete.useMutation();

  const handleGenerate = () => {
    if (prompt.trim().length < 10) {
      toast.error("Décris ta carte YouTube (minimum 10 caractères)");
      return;
    }
    setIsGenerating(true);
    generateEndCard.mutate(
      { prompt: prompt.trim(), style },
      {
        onSuccess: () => {
          toast.success("Carte YouTube générée !");
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
    deleteEndCard.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Carte supprimée");
          refetch();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  if (!isAuthenticated) {
    navigate("/dashboard");
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
          <h1 className="text-2xl font-bold">Générateur de cartes YouTube</h1>
          <p className="text-sm text-zinc-500 mt-1">Crée des cartes de fin de vidéo (end cards) professionnelles</p>
        </div>

        {/* Generate Form */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-[#ff0050]" size={20} />
            <h2 className="font-semibold">Nouvelle carte</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Carte de fin avec bouton s'abonner, 2 suggestions vidéo, fond sombre avec effet néon..."
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
              {isGenerating ? "Génération..." : "Générer la carte"}
            </button>
          </div>
        </div>

        {/* End Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : endCards?.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <CreditCard className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucune carte</p>
            <p className="text-sm">Génère ta première carte YouTube !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {endCards?.map((c: any) => (
              <div key={c.id} className="group relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.prompt} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-zinc-500 text-sm text-center p-4">Génération en cours...</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {c.imageUrl && (
                    <a href={c.imageUrl} download target="_blank" rel="noopener noreferrer" className="bg-white text-black p-2 rounded-full hover:bg-zinc-200 transition-colors">
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(c.id)}
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
