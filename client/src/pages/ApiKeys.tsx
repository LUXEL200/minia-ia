import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Key,
  Plus,
  X,
  Trash2,
  Copy,
} from "lucide-react";

export default function ApiKeysPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.list.useQuery();
  const createKey = trpc.apiKeys.create.useMutation();
  const revokeKey = trpc.apiKeys.revoke.useMutation();

  const handleCreate = () => {
    if (!keyName.trim()) {
      toast.error("Nom de la clé requis");
      return;
    }
    createKey.mutate(
      { name: keyName.trim() },
      {
        onSuccess: (result: any) => {
          const key = result?.apiKey || result?.key || result;
          setGeneratedKey(typeof key === "string" ? key : JSON.stringify(key));
          toast.success("Clé API créée !");
          refetch();
          setShowCreate(false);
          setKeyName("");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleRevoke = (id: number) => {
    revokeKey.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Clé révoquée");
          refetch();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Clé copiée !");
  };

  if (!isAuthenticated) {
    navigate("/dashboard");
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Clés API</h1>
            <p className="text-sm text-zinc-500 mt-1">Génère des clés pour accéder à Minia IA depuis des scripts</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#ff0050] hover:bg-[#e60048] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Créer
          </button>
        </div>

        {/* API Keys List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : apiKeys?.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Key className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucune clé API</p>
            <p className="text-sm">Crée ta première clé pour intégrer Minia IA à tes outils</p>
          </div>
        ) : (
          <div className="space-y-2">
            {apiKeys?.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{k.name}</p>
                  <p className="text-xs text-zinc-500 font-mono truncate mt-1">
                    {k.key ? `${k.key.slice(0, 8)}...${k.key.slice(-4)}` : "••••••••"}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    Créée le {new Date(k.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(k.key || "")}
                    className="text-zinc-400 hover:text-white p-1.5 transition-colors"
                    title="Copier"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="text-red-400 hover:text-red-300 p-1.5 transition-colors"
                    title="Révoquer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generated Key Modal */}
        {generatedKey && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Clé API créée</h2>
                <button onClick={() => setGeneratedKey(null)} className="text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-zinc-400 mb-3">Copie cette clé maintenant, elle ne sera plus affichée :</p>
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 font-mono text-xs break-all mb-4">
                {generatedKey}
              </div>
              <button
                onClick={() => handleCopy(generatedKey)}
                className="w-full flex items-center justify-center gap-2 bg-[#ff0050] hover:bg-[#e60048] py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Copy size={14} /> Copier la clé
              </button>
            </div>
          </div>
        )}

        {/* Create Key Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Créer une clé API</h2>
                <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nom de la clé</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Mon script automation"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={createKey.isPending}
                  className="w-full bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {createKey.isPending ? "Création..." : "Créer la clé"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
