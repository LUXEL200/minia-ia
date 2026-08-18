import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useActionEffect } from "@/components/ActionEffects";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import {
  Plus,
  Trash2,
  Shield,
  ImageIcon,
  Search,
  X,
  ArrowLeft,
  User,
  Pencil,
} from "lucide-react";

const categories = [
  { id: "all", label: "Tous" },
  { id: "viral", label: "Viral" },
  { id: "minimalist", label: "Minimaliste" },
  { id: "dramatic", label: "Dramatic" },
  { id: "tech", label: "Tech" },
  { id: "retro", label: "Retro" },
  { id: "mrbeast", label: "MrBeast" },
];

export default function Templates() {
  const { user, isAuthenticated, loading } = useAuth();
  const { triggerFlash, triggerShake } = useActionEffect();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const [category, setCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [source, setSource] = useState<"unsplash" | "pexels" | "custom" | "user">("custom");
  const [uploadCategory, setUploadCategory] = useState("viral");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery({ category });
  const createTemplate = trpc.templates.create.useMutation();
  const deleteTemplate = trpc.templates.delete.useMutation();

  const isAdmin = user?.isAdminOwner === true;

  const handleUpload = () => {
    if (!title.trim()) { toast.error("Titre requis"); return; }
    if (!imageUrl.trim()) { toast.error("URL d'image requise"); return; }
    createTemplate.mutate(
      { title: title.trim(), imageUrl: imageUrl.trim(), source, category: uploadCategory },
      {
        onSuccess: () => {
          triggerFlash();
          toast.success("Template ajouté !");
          setShowUpload(false);
          setTitle("");
          setImageUrl("");
          refetch();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteTemplate.mutate(
      { id },
      {
        onSuccess: () => {
          triggerShake();
          toast.success("Template supprimé");
          refetch();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const filtered = templates?.filter((t: any) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <PageHeader
          title="Templates"
          subtitle="Miniatures d'inspiration — ajoutées par l'admin et les utilisateurs"
          breadcrumb={[{ label: "Templates" }]}
          right={
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-[#ff0050] hover:bg-[#e60048] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Ajouter</span>
            </button>
          }
        />

        {/* Category Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat.id
                  ? "bg-white text-black"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un template..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-zinc-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <ImageIcon className="mx-auto mb-4" size={48} />
            <p className="text-lg mb-2">Aucun template trouvé</p>
            <p className="text-sm">Sois le premier à ajouter un template d'inspiration !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered?.map((t: any) => (
              <div key={t.id} className="group relative aspect-video rounded-lg overflow-hidden bg-zinc-900">
                <img
                  src={t.imageUrl}
                  alt={t.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-medium truncate">{t.title}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[10px] text-zinc-400">{t.category}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/template-editor?templateId=${t.id}`);
                          }}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                          title="Personnaliser ce template"
                        >
                          <Pencil size={14} />
                        </button>
                        {(isAdmin || t.userId === user?.id) && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {t.userId ? (
                  <div className="absolute top-2 right-2">
                    {isAdmin ? (
                      <span className="bg-[#ff0050] text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Shield size={10} /> Admin
                      </span>
                    ) : (
                      <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <User size={10} /> User
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="absolute top-2 right-2">
                    <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded">
                      {t.source === "unsplash" ? "Unsplash" : t.source === "pexels" ? "Pexels" : "Custom"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ajouter un template</h2>
              <button onClick={() => setShowUpload(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Miniature gaming viral"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">URL de l'image</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  Utilise des images libres de droits (Unsplash, Pexels, etc.)
                </p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value="custom">Personnalisé</option>
                  <option value="unsplash">Unsplash</option>
                  <option value="pexels">Pexels</option>
                  <option value="user">Créé par l'utilisateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Catégorie</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                >
                  {categories.filter(c => c.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleUpload}
                disabled={createTemplate.isPending}
                className="w-full bg-[#ff0050] hover:bg-[#e60048] disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {createTemplate.isPending ? "Ajout..." : "Ajouter le template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
