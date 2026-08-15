import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toPng } from "html-to-image";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft, Type, Smile, Square, Eraser, Palette, Bold, Plus,
  Save, Download, Trash2, Move,
} from "lucide-react";


type EditorElement = {
  id: string;
  type: "text" | "emoji" | "shape";
  content: string;
  x: number; // percent
  y: number; // percent
  fontSize: number;
  color: string;
  bold: boolean;
  bg?: string; // shape color
};

const CANVAS_W = 1280;
const CANVAS_H = 720;

const presetColors = [
  "#ffffff", "#000000", "#ff0050", "#00d4ff", "#ffe600",
  "#7c3aed", "#22c55e", "#f97316", "#3b82f6", "#ec4899",
];

const presetEmojis = ["🔥", "⚡", "💥", "👀", "🚀", "💰", "😱", "🎯", "⭐", "✅", "❌", "🏆"];

const presetShapes = [
  { name: "Carré", shape: "rect" as const, color: "#ff0050" },
  { name: "Bandeau", shape: "banner" as const, color: "#00d4ff" },
  { name: "Cercle", shape: "circle" as const, color: "#ffe600" },
];

export default function TemplateEditor() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const templateId = Number(new URLSearchParams(search).get("templateId") || "0");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/dashboard");
  }, [loading, isAuthenticated, navigate]);

  const { data: template, isLoading: templateLoading } = trpc.templates.list.useQuery();
  const currentTemplate = template?.find((t: any) => t.id === templateId);

  const createCustomization = trpc.customizations.create.useMutation();
  const saveToGallery = trpc.thumbnail.saveFromBase64.useMutation();
  const utils = trpc.useUtils();

  // No template → go back to the templates library
  useEffect(() => {
    if (!loading && !templateLoading && template && !currentTemplate) {
      toast("Template introuvable — retour à la bibliothèque");
      navigate("/templates");
    }
  }, [loading, templateLoading, template, currentTemplate, navigate]);

  const [elements, setElements] = useState<EditorElement[]>([]);
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title] = useState(currentTemplate?.title || "Ma miniature");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [showColors, setShowColors] = useState(false);


  // Load saved customization via query param ?customId
  const customId = Number(new URLSearchParams(search).get("customId") || "0");
  const { data: savedCustom } = trpc.customizations.get.useQuery({ id: customId }, { enabled: customId > 0 });
  useEffect(() => {
    if (savedCustom) {
      const el = savedCustom.elements as unknown as EditorElement[];
      setElements(Array.isArray(el) ? el : []);
      if (savedCustom.backgroundColor) setBackgroundColor(savedCustom.backgroundColor);
    }
  }, [savedCustom]);

  const selected = elements.find((e) => e.id === selectedId);

  // Pointer drag on canvas
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const el = elements.find((x) => x.id === id);
    if (!el || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDrag({ id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((e.clientX - drag.startX) / rect.width) * 100;
      const dy = ((e.clientY - drag.startY) / rect.height) * 100;
      setElements((prev) =>
        prev.map((el) =>
          el.id === drag.id
            ? { ...el, x: Math.max(0, Math.min(100, drag.elX + dx)), y: Math.max(0, Math.min(100, drag.elY + dy)) }
            : el
        )
      );
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag]);

  const addText = () => {
    const el: EditorElement = {
      id: `t-${Date.now()}`, type: "text", content: "Ton texte",
      x: 50, y: 50, fontSize: 72, color: "#ffffff", bold: true,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  const addEmoji = (emoji: string) => {
    const el: EditorElement = {
      id: `e-${Date.now()}`, type: "emoji", content: emoji,
      x: 50, y: 40, fontSize: 120, color: "#ffffff", bold: false,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  const addShape = (shape: "rect" | "banner" | "circle", color: string) => {
    const el: EditorElement = {
      id: `s-${Date.now()}`, type: "shape", content: shape,
      x: 50, y: 50, fontSize: 0, color: "#ffffff", bold: false, bg: color,
    };
    setElements((p) => [...p, el]);
    setSelectedId(el.id);
  };

  const updateSelected = (patch: Partial<EditorElement>) => {
    if (!selectedId) return;
    setElements((p) => p.map((e) => (e.id === selectedId ? { ...e, ...patch } : e)));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setElements((p) => p.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  };

  const renderElement = (el: EditorElement) => {
    const isSelected = el.id === selectedId;
    const base = "absolute select-none cursor-move" + (isSelected ? " ring-2 ring-cyan-400" : "");
    if (el.type === "shape") {
      let shape: React.CSSProperties = { backgroundColor: el.bg || "#ff0050" };
      if (el.content === "rect") Object.assign(shape, { width: "22%", height: "22%", left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%,-50%)", borderRadius: 12 });
      else if (el.content === "banner") Object.assign(shape, { width: "70%", height: "12%", left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%,-50%)", borderRadius: 9999 });
      else Object.assign(shape, { width: "16%", height: "30%", left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%,-50%)", borderRadius: "50%" });
      return <div key={el.id} className={base} style={shape} onPointerDown={(e) => handlePointerDown(e, el.id)} />;
    }
    if (el.type === "emoji") {
      return (
        <div key={el.id} className={base} style={{ left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%,-50%)", fontSize: el.fontSize, lineHeight: 1 }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
          {el.content}
        </div>
      );
    }
    return (
      <div key={el.id} className={base} style={{ left: `${el.x}%`, top: `${el.y}%`, transform: "translate(-50%,-50%)", fontSize: el.fontSize, fontWeight: el.bold ? 800 : 500, color: el.color, textShadow: "2px 2px 0 rgba(0,0,0,.8)", lineHeight: 1.1, whiteSpace: "nowrap" }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
        {el.content}
      </div>
    );
  };

  const handleSaveCustomization = async () => {
    if (!currentTemplate) return;
    try {
      const res = await createCustomization.mutateAsync({
        templateId: currentTemplate.id,
        title: title || "Personnalisation",
        elements,
        backgroundColor,
      });
      toast.success("Personnalisation enregistrée !");
      navigate(`/template-editor?customId=${res.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const exportPng = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { width: CANVAS_W, height: CANVAS_H, pixelRatio: 1, backgroundColor: backgroundColor, cacheBust: true });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${(title || "miniature").replace(/[^a-z0-9]+/gi, "-")}.png`;
      link.click();
      toast.success("Miniature exportée en PNG (1280×720) !");
    } catch {
      toast.error("Export échoué");
    }
  };

  const handleSaveToGallery = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { width: CANVAS_W, height: CANVAS_H, pixelRatio: 1, backgroundColor: backgroundColor, cacheBust: true });
      const b64 = dataUrl.split(",")[1];
      await saveToGallery.mutateAsync({ b64, mime: "image/png", title: currentTemplate?.title ? `Template — ${currentTemplate.title}` : "Ma miniature personnalisée" });
      toast.success("Ajoutée à vos miniatures !");
      navigate("/dashboard");
    } catch {
      toast.error("Échec de l'enregistrement");
    }
  };

  if (loading) return null;
  if (!isAuthenticated) return null;

  const imageLoaded = templateLoading ? false : !!currentTemplate;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/templates" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm sm:text-base font-medium truncate max-w-[200px] sm:max-w-none">
            Éditeur de template {currentTemplate ? `— ${currentTemplate.title}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={handleSaveCustomization} disabled={createCustomization.isPending}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm transition-colors">
            <Save size={14} /> <span className="hidden sm:inline">Enregistrer</span>
          </button>
          <button onClick={handleSaveToGallery} disabled={saveToGallery.isPending}
            className="flex items-center gap-1.5 bg-[#00d4ff] text-black hover:bg-[#00bfe6] disabled:opacity-50 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors">
            <Plus size={14} /> <span className="hidden sm:inline">Ajouter à mes miniatures</span>
          </button>
          <button onClick={exportPng}
            className="flex items-center gap-1.5 bg-[#ff0050] hover:bg-[#e60048] px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors">
            <Download size={14} /> <span className="hidden sm:inline">Exporter PNG</span>
          </button>
        </div>
      </header>

      {!imageLoaded && !templateLoading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">Chargement du template…</div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 bg-zinc-950 min-h-[400px]">
            <div
              ref={canvasRef}
              className="relative w-full max-w-[1000px] aspect-video overflow-hidden select-none"
              style={{ backgroundColor, backgroundImage: currentTemplate?.imageUrl ? `url(${currentTemplate.imageUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
              onPointerDown={() => setSelectedId(null)}
            >
              {elements.map(renderElement)}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-white/30 text-sm sm:text-base">Ajoute du texte, des emojis ou des formes</p>
                </div>
              )}
            </div>
          </div>

          {/* Properties panel */}
          <aside className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 p-3 sm:p-4 overflow-y-auto max-h-[45vh] lg:max-h-none">
            <div className="space-y-4">
              {/* Selected element props */}
              {selected && selected.type !== "shape" && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
                    {selected.type === "text" ? <Type size={12} /> : <Smile size={12} />} Propriétés
                  </p>
                  {selected.type === "text" && (
                    <input
                      value={selected.content}
                      onChange={(e) => updateSelected({ content: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-2"
                    />
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-zinc-500">Taille</label>
                    <input
                      type="range"
                      min={selected.type === "emoji" ? 32 : 20}
                      max={selected.type === "emoji" ? 300 : 220}
                      value={selected.fontSize}
                      onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                      className="flex-1 accent-cyan-400"
                    />
                  </div>
                  {selected.type === "text" && (
                    <button
                      onClick={() => updateSelected({ bold: !selected.bold })}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${selected.bold ? "bg-white/10 border-white/20" : "border-zinc-800 text-zinc-500"}`}
                    >
                      <Bold size={12} /> Gras
                    </button>
                  )}
                  {/* Color picker */}
                  <div>
                    <button onClick={() => setShowColors(!showColors)} className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                      <Palette size={12} /> Couleur
                    </button>
                    {showColors && (
                      <div className="grid grid-cols-10 gap-1.5">
                        {presetColors.map((c) => (
                          <button key={c} onClick={() => { updateSelected({ color: c }); setShowColors(false); }}
                            className={`w-6 h-6 rounded border ${selected.color === c ? "border-cyan-400 ring-1 ring-cyan-400" : "border-white/20"}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delete */}
              {selected && (
                <button onClick={removeSelected} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300">
                  <Trash2 size={12} /> Supprimer l'élément
                </button>
              )}

              {/* Add tools */}
              <div>
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><Plus size={12} /> Ajouter</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button onClick={addText} className="flex flex-col items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg py-2 text-xs text-zinc-300">
                    <Type size={16} /> Texte
                  </button>
                  <button onClick={() => addEmoji("🔥")} className="flex flex-col items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg py-2 text-xs text-zinc-300">
                    <Smile size={16} /> Emoji
                  </button>
                  <button onClick={() => addShape("rect", "#ff0050")} className="flex flex-col items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg py-2 text-xs text-zinc-300">
                    <Square size={16} /> Forme
                  </button>
                </div>
                {/* Emoji palette */}
                <div className="grid grid-cols-12 gap-1 mb-3">
                  {presetEmojis.map((em) => (
                    <button key={em} onClick={() => addEmoji(em)} className="text-lg hover:scale-110 transition-transform">{em}</button>
                  ))}
                </div>
                {/* Shapes */}
                <div className="grid grid-cols-3 gap-2">
                  {presetShapes.map((s) => (
                    <button key={s.name} onClick={() => addShape(s.shape, s.color)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg py-2 text-xs text-zinc-300">
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div>
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1"><Eraser size={12} /> Fond de l'image</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {presetColors.map((c) => (
                    <button key={c} onClick={() => setBackgroundColor(c)}
                      className={`w-6 h-6 rounded border ${backgroundColor === c ? "border-cyan-400 ring-1 ring-cyan-400" : "border-white/20"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1"><Move size={10} /> Glisse les éléments sur le canevas pour les placer</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
