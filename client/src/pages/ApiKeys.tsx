import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppSidebar";
import {
  Key,
  Plus,
  X,
  Trash2,
  Copy,
} from "lucide-react";

export default function ApiKeysPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [expiryMonths, setExpiryMonths] = useState("6");

  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.list.useQuery();
  const createKey = trpc.apiKeys.create.useMutation();
  const revokeKey = trpc.apiKeys.revoke.useMutation();

  const handleCreate = () => {
    if (!keyName.trim()) {
      toast.error("Nom de la clé requis");
      return;
    }
    createKey.mutate(
      { name: keyName.trim(), expiryMonths: parseInt(expiryMonths) },
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
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <AppHeader pageLabel="Api-keys" showCredits />
        <div className="mt-8 mb-6">
          <h1 className="text-2xl font-bold">Clés API</h1>
          <p className="text-sm text-zinc-400 mt-1">Gérez vos clés API pour les intégrations externes</p>
        </div>

        {/* Management card */}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold">Gestion des clés API</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Créez et gérez des clés API pour accéder à votre compte par programmation.
            </p>
          </div>

          {/* Create button (full-width red, Youthumb style) */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#ff0050] hover:bg-[#e60048] py-3 rounded-xl text-sm font-medium transition-colors mb-5"
          >
            <Plus size={16} /> Créer une clé API
          </button>

          {/* Table card */}
          <div className="bg-black/40 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 text-xs border-b border-zinc-800">
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Créé</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Expire</th>
                    <th className="px-4 py-3 font-medium text-right">Actes</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8">
                        <div className="animate-pulse bg-zinc-900 rounded-lg h-10" />
                      </td>
                    </tr>
                  ) : apiKeys?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-zinc-400 text-sm">
                        Aucune clé API trouvée. Créez votre première clé API pour commencer.
                      </td>
                    </tr>
                  ) : (
                    apiKeys?.map((k: any) => {
                      const expires = k.expiresAt ? new Date(k.expiresAt) : null;
                      const expired = expires && expires.getTime() < Date.now();
                      return (
                        <tr key={k.id} className="border-t border-zinc-800/60 hover:bg-white/[0.02]">
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-sm">{k.name}</p>
                            {k.key ? (
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {k.key.slice(0, 10)}••••••••••••••••
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3.5 text-zinc-400 text-xs hidden sm:table-cell">
                            {new Date(k.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3.5 text-zinc-400 text-xs hidden md:table-cell">
                            {expires ? (
                              <span className={expired ? "text-red-400" : ""}>
                                {expires.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                {expired ? " (expirée)" : ""}
                              </span>
                            ) : (
                              <span className="text-zinc-600">Jamais</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleCopy(k.key || "")}
                                className="text-zinc-400 hover:text-white p-1.5 transition-colors"
                                title="Copier la clé"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => handleRevoke(k.id)}
                                className="text-zinc-400 hover:text-red-400 p-1.5 transition-colors"
                                title="Révoquer la clé"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Clé API créée</h2>
              <button onClick={() => setGeneratedKey(null)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-3">Copie cette clé maintenant, elle ne sera plus affichée :</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-xs break-all mb-4">
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
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Créer une clé API</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  placeholder="Ex: Mon script automation"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Expiration</label>
                <select
                  value={expiryMonths}
                  onChange={e => setExpiryMonths(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600"
                >
                  <option value="1">1 mois</option>
                  <option value="3">3 mois</option>
                  <option value="6">6 mois</option>
                  <option value="12">12 mois</option>
                </select>
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
  );
}
