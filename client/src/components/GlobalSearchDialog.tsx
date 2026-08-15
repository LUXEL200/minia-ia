import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Image as ImageIcon, Heart, GalleryHorizontalEnd, Trash2, Loader2, X, Download, Eye } from "lucide-react";

/**
 * GlobalSearchDialog — recherche multi-pages (Historique / Favoris / Galerie / Poubelle).
 * Recherche côté serveur via trpc.search.global (min 1 caractère).
 */
export function GlobalSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const debouncedQuery = useDebounce(query, 250);
  const { data: results, isLoading } = trpc.search.global.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 1 && open }
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const count =
    (results?.thumbnails.length ?? 0) +
    (results?.favorites.length ?? 0) +
    (results?.gallery.length ?? 0) +
    (results?.trash.length ?? 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-[10vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#181818] border border-white/5 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[70vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-white/5">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher dans toutes tes miniatures, favoris, galerie et poubelle…"
            className="flex-1 py-3.5 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          {isLoading && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!debouncedQuery && (
            <div className="text-center py-10">
              <Search className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Tape au moins un caractère pour rechercher partout.</p>
              <p className="text-[10px] text-zinc-600 mt-1">Historique · Favoris · Galerie publique · Poubelle</p>
            </div>
          )}

          {debouncedQuery && count === 0 && !isLoading && (
            <div className="text-center py-10">
              <Search className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Aucun résultat pour « {debouncedQuery} »</p>
            </div>
          )}

          {results && (
            <>
              <ResultSection
                title="Historique"
                icon={<ImageIcon className="w-3.5 h-3.5" />}
                items={(results.thumbnails ?? []).map((t: any) => ({ id: t.id, imageUrl: t.imageUrl, prompt: t.prompt }))}
                empty={query.length >= 1 && count === 0}
                onOpen={url => navigate(`/editor?image=${encodeURIComponent(url)}`)}
                onCopy={async (url) => {
                  try { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); } catch { /* noop */ }
                }}
              />
              <ResultSection
                title="Favoris"
                icon={<Heart className="w-3.5 h-3.5 text-pink-400" />}
                items={(results.favorites ?? []).map((t: any) => ({ id: t.id, imageUrl: t.imageUrl, prompt: t.prompt }))}
                empty={false}
                emptyAll
                onOpen={url => navigate(`/editor?image=${encodeURIComponent(url)}`)}
                onCopy={async (url) => {
                  try { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); } catch { /* noop */ }
                }}
              />
              <ResultSection
                title="Galerie publique"
                icon={<GalleryHorizontalEnd className="w-3.5 h-3.5 text-cyan-400" />}
                items={(results.gallery ?? []).map((t: any) => ({ id: t.id, imageUrl: t.imageUrl, prompt: t.prompt }))}
                empty={false}
                emptyAll
                onOpen={url => navigate(`/editor?image=${encodeURIComponent(url)}`)}
                onCopy={async (url) => {
                  try { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); } catch { /* noop */ }
                }}
              />
              <ResultSection
                title="Poubelle"
                icon={<Trash2 className="w-3.5 h-3.5 text-zinc-500" />}
                items={(results.trash ?? []).map((t: any) => ({ id: t.id, imageUrl: t.imageUrl, prompt: t.prompt }))}
                empty={false}
                emptyAll
                onOpen={url => navigate(`/editor?image=${encodeURIComponent(url)}`)}
                onCopy={async (url) => {
                  try { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); } catch { /* noop */ }
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultSection({
  title,
  icon,
  items,
  empty,
  emptyAll,
  onOpen,
  onCopy,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: number; imageUrl: string | null; prompt?: string | null }[];
  empty?: boolean;
  emptyAll?: boolean;
  onOpen: (url: string) => void;
  onCopy: (url: string) => void;
}) {
  if (!items || items.length === 0) {
    if (emptyAll) return null; // pas de section vide (0 favoris = pas de bloc)
    return (
      <div>
        <h3 className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          {icon} {title}
        </h3>
        <p className="text-[11px] text-zinc-600 text-center py-3">Rien ici</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
        {icon} {title} <span className="text-zinc-700 ml-auto">{items.length}</span>
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {items.slice(0, 6).map(item => (
          <div key={item.id} className="group relative aspect-video rounded-lg overflow-hidden bg-[#09090B] border border-white/5">
            {item.imageUrl ? (
              <>
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => onOpen(item.imageUrl!)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20" title="Modifier">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={() => onCopy(item.imageUrl!)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20" title="Copier le lien">
                    <Download className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
              </div>
            )}
            {item.prompt && (
              <p className="absolute bottom-0 left-0 right-0 text-[9px] text-white/80 bg-black/70 px-1.5 py-1 line-clamp-1">{item.prompt}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hook debounce léger */
function useDebounce<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
