import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Type, Move, Trash2, Plus,
  RotateCcw, ZoomIn, ZoomOut, Layers, Palette, History,
  ChevronLeft, Undo2, Redo2, Save,
  Bold, Italic, Underline, AlignLeft, AlignCenter,
} from "lucide-react";

interface EditorTextElement {
  id: string;
  type: "text";
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  align: "left" | "center" | "right";
  color: string;
  bgTransparent: boolean;
  width: number;
}

interface EditorShapeElement {
  id: string;
  type: "shape";
  shape: "rect" | "circle" | "triangle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

interface EditorImageElement {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  borderRadius: number;
}

type EditorElement = EditorTextElement | EditorShapeElement | EditorImageElement;

export default function Editor() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [elements, setElements] = useState<EditorElement[]>([]);

  // Parse `image` URL param (e.g. from the gallery "Edit" button)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(() => {
    const params = new URLSearchParams(search);
    const raw = params.get("image") || params.get("img") || params.get("url");
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [bgColor, setBgColor] = useState("#000000");
  const [bgTransparent, setBgTransparent] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElStart, setDragElStart] = useState({ x: 0, y: 0 });

  // === Versions panel ===
  const thumbnailId = Number(new URLSearchParams(search).get("thumbnailId") || "0");
  const [showVersions, setShowVersions] = useState(false);
  const [versionName, setVersionName] = useState("");

  const { data: versions } = trpc.imageVersions.list.useQuery(
    { thumbnailId },
    { enabled: thumbnailId > 0 }
  );
  const createVersion = trpc.imageVersions.create.useMutation();
  const restoreVersion = trpc.imageVersions.restore.useMutation();
  const deleteVersion = trpc.imageVersions.delete.useMutation();
  const utilsVersions = trpc.useUtils();

  const captureSnapshot = async (): Promise<string | null> => {
    if (!canvasRef.current) return null;
    try {
      return await toPng(canvasRef.current, { width: 1280, height: 720, pixelRatio: 1, cacheBust: true });
    } catch {
      return null;
    }
  };

  const handleSaveVersion = async () => {
    if (thumbnailId <= 0) {
      toast.error("Ouvre l'éditeur depuis une miniature de ton tableau de bord pour utiliser les versions");
      return;
    }
    const dataUrl = await captureSnapshot();
    if (!dataUrl) {
      toast.error("Impossible de capturer le canevas");
      return;
    }
    const name = versionName.trim() || `Version ${new Date().toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    createVersion.mutate(
      { thumbnailId, name, imageUrl: dataUrl, elements },
      {
        onSuccess: () => {
          toast.success(`Version « ${name} » enregistrée`);
          setVersionName("");
          utilsVersions.imageVersions.list.invalidate({ thumbnailId });
        },
        onError: (err: any) => toast.error(err.message),
      }
    );
  };

  const handleRestoreVersion = async (version: { id: number; imageUrl: string; elements: unknown }) => {
    restoreVersion.mutate(
      { versionId: version.id, thumbnailId },
      {
        onSuccess: () => {
          // Restore visual state from the version snapshot
          const el = version.elements as EditorElement[];
          if (Array.isArray(el)) {
            setElements(el);
            pushHistory(el);
          }
          setBgImageUrl(version.imageUrl);
          toast.success("Version restaurée !");
          utilsVersions.imageVersions.list.invalidate({ thumbnailId });
        },
        onError: (err: any) => toast.error(err.message),
      }
    );
  };

  // History for undo/redo
  const [history, setHistory] = useState<EditorElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((newElements: EditorElement[]) => {
    setHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, newElements];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // updateElement defined below

  const addTextElement = () => {
    const el: EditorTextElement = {
      id: `text-${Date.now()}`,
      type: "text",
      text: "Ton texte ici",
      x: 50,
      y: 50,
      fontSize: 32,
      fontWeight: "bold",
      fontStyle: "normal",
      textDecoration: "none",
      align: "center",
      color: "#FFFFFF",
      bgTransparent: true,
      width: 300,
    };
    const newElements = [...elements, el];
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(el.id);
    setShowAddMenu(false);
  };

  const addShapeElement = (shape: "rect" | "circle" | "triangle") => {
    const el: EditorShapeElement = {
      id: `shape-${Date.now()}`,
      type: "shape",
      shape,
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      color: shape === "rect" ? "#06B6D4" : shape === "circle" ? "#EC4899" : "#F59E0B",
      opacity: 0.8,
    };
    const newElements = [...elements, el];
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(el.id);
    setShowAddMenu(false);
  };

  const addBackground = () => {
    setBgTransparent(false);
    setBgColor("#1a1a2e");
    setShowAddMenu(false);
    toast.success("Arrière-plan ajouté — utilise l'outil Couleur pour le changer");
  };

  const removeBgImage = () => {
    setBgImageUrl(null);
    // Reset URL param without triggering a re-render loop (wouter Path is always a string)
    const pathname = location.split("?")[0];
    window.history.replaceState(null, "", pathname);
    toast.success("Image de fond retirée");
  };

  const updateElement = (id: string, updates: Record<string, unknown>) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    setElements(newElements);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const newElements = elements.filter(el => el.id !== selectedId);
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas) {
      setSelectedId(null);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedId(elId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    const el = elements.find(e => e.id === elId);
    if (el) setDragElStart({ x: el.x, y: el.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedId) return;
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      updateElement(selectedId, {
        x: Math.max(0, dragElStart.x + dx),
        y: Math.max(0, dragElStart.y + dy),
      });
    };

    const handleMouseUp = () => {
      if (isDragging && selectedId) {
        pushHistory(elements);
      }
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedId, dragStart, dragElStart, zoom, elements, pushHistory]);

  const exportCanvas = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        width: 1280,
        height: 720,
        pixelRatio: 1,
        backgroundColor: bgTransparent && !bgImageUrl ? undefined : bgColor,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "minia-ia-editee.png";
      link.click();
      toast.success(bgImageUrl ? "Miniature exportée en PNG (1280×720) !" : "Miniature exportée en PNG (1280×720) !");
    } catch (err) {
      console.error("Export PNG échoué, repli SVG", err);
      // Fallback: SVG export still works offline
      const link = document.createElement("a");
      link.href = "data:image/svg+xml," + encodeURIComponent(getSVGExport());
      link.download = "minia-ia-editee.svg";
      link.click();
      toast.error("Export PNG indisponible — fichier SVG téléchargé à la place");
    }
  };

  const getSVGExport = () => {
    const w = 1280;
    const h = 720;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    if (bgImageUrl) {
      svg += `<image href="${bgImageUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />`;
      svg += `<rect width="${w}" height="${h}" fill="${bgTransparent ? "transparent" : bgColor}" opacity="0.35" />`;
    } else {
      svg += `<rect width="${w}" height="${h}" fill="${bgTransparent ? "transparent" : bgColor}" />`;
    }

    for (const el of elements) {
      const sx = w / 640;
      const sy = h / 360;
      if (el.type === "shape") {
        svg += `<${el.shape === "rect" ? "rect" : el.shape === "circle" ? "ellipse" : "polygon"} `;
        if (el.shape === "rect") {
          svg += `x="${el.x * sx}" y="${el.y * sy}" width="${el.width * sx}" height="${el.height * sy}" fill="${el.color}" opacity="${el.opacity}" />`;
        } else if (el.shape === "circle") {
          svg += `cx="${(el.x + el.width / 2) * sx}" cy="${(el.y + el.height / 2) * sy}" rx="${(el.width / 2) * sx}" ry="${(el.height / 2) * sy}" fill="${el.color}" opacity="${el.opacity}" />`;
        } else {
          const points = `${el.x * sx},${(el.y + el.height) * sy} ${((el.x + el.width) / 2) * sx},${el.y * sy} ${(el.x + el.width) * sx},${(el.y + el.height) * sy}`;
          svg += `points="${points}" fill="${el.color}" opacity="${el.opacity}" />`;
        }
      } else if (el.type === "text") {
        svg += `<text x="${el.x * sx}" y="${(el.y + el.fontSize) * sy}" font-size="${el.fontSize * sx}" font-weight="${el.fontWeight}" fill="${el.color}" `;
        svg += `font-style="${el.fontStyle}" text-decoration="${el.textDecoration}" text-anchor="${el.align}">${el.text}</text>`;
      }
    }
    svg += `</svg>`;
    return svg;
  };

  const selectedElement = elements.find(el => el.id === selectedId);
  const colors = ["#FFFFFF", "#000000", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"];

  const renderToolbar = () => (
    <div className="fixed left-0 top-0 h-full w-16 bg-[#111] border-r border-white/5 flex flex-col items-center py-4 gap-2 z-40">
      <button
        onClick={() => navigate("/dashboard")}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        title="Retour"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-8 h-px bg-white/10 my-2" />

      {/* Add menu */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={`p-2 rounded-lg transition-colors ${showAddMenu ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
          title="Ajouter"
        >
          <Plus className="w-5 h-5" />
        </button>
        {showAddMenu && (
          <div className="absolute left-full ml-2 top-0 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl z-50 w-48">
            <p className="text-[10px] text-zinc-500 uppercase mb-2">Ajouter</p>
            <button onClick={addTextElement} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 transition-colors text-left">
              <Type className="w-3.5 h-3.5" /> Texte
            </button>
            <button onClick={() => addShapeElement("rect")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 transition-colors text-left">
              <Layers className="w-3.5 h-3.5" /> Rectangle
            </button>
            <button onClick={() => addShapeElement("circle")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 transition-colors text-left">
              <Layers className="w-3.5 h-3.5" /> Cercle
            </button>
            <button onClick={() => addShapeElement("triangle")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 transition-colors text-left">
              <Layers className="w-3.5 h-3.5" /> Triangle
            </button>
            <button onClick={addBackground} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 transition-colors text-left">
              <Palette className="w-3.5 h-3.5" /> Arrière-plan
            </button>
          </div>
        )}
      </div>

      {/* Undo/Redo */}
      <button onClick={handleUndo} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" title="Annuler">
        <Undo2 className="w-5 h-5" />
      </button>
      <button onClick={handleRedo} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" title="Refaire">
        <Redo2 className="w-5 h-5" />
      </button>

      <div className="w-8 h-px bg-white/10 my-2" />

      {/* Zoom */}
      <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" title="Zoom +">
        <ZoomIn className="w-5 h-5" />
      </button>
      <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" title="Zoom -">
        <ZoomOut className="w-5 h-5" />
      </button>

      <div className="w-8 h-px bg-white/10 my-2" />

      {/* Color picker */}
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        className={`p-2 rounded-lg transition-colors ${showColorPicker ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
        title="Couleur"
      >
        <Palette className="w-5 h-5" />
      </button>
      {showColorPicker && (
        <div className="absolute left-18 ml-2 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 shadow-2xl z-50 flex flex-wrap gap-1.5 max-w-36">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => {
                if (selectedElement) {
                  if (selectedElement.type === "text") {
                    updateElement(selectedElement.id, { color: c });
                    pushHistory([...elements]);
                  } else if (selectedElement.type === "shape") {
                    updateElement(selectedElement.id, { color: c });
                    pushHistory([...elements]);
                  }
                } else {
                  setBgColor(c);
                  setBgTransparent(false);
                }
              }}
              className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Versions */}
      <button
        onClick={() => setShowVersions(!showVersions)}
        className={`p-2 rounded-lg transition-colors relative ${showVersions ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
        title="Versions"
      >
        <History className="w-5 h-5" />
        {versions && versions.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#ff0050] text-white text-[9px] rounded-full flex items-center justify-center">
            {versions.length}
          </span>
        )}
      </button>
      {showVersions && (
        <div className="absolute left-16 bottom-0 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 w-72 p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Versions d'image</p>
          {thumbnailId <= 0 && (
            <p className="text-xs text-zinc-500 mb-2">Ouvre l'éditeur depuis une miniature de ton tableau de bord pour enregistrer des versions.</p>
          )}
          <div className="flex gap-1.5 mb-3">
            <input
              value={versionName}
              onChange={e => setVersionName(e.target.value)}
              placeholder="Nom de la version…"
              className="flex-1 bg-[#111] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 outline-none"
            />
            <button
              onClick={handleSaveVersion}
              disabled={createVersion.isPending}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors"
            >
              Sauvegarder
            </button>
          </div>
          {(!versions || versions.length === 0) ? (
            <p className="text-xs text-zinc-500 text-center py-3">Aucune version enregistrée</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {versions.map((v: any) => (
                <div key={v.id} className={`flex items-center gap-2 rounded-lg border p-2 ${v.isCurrent === "yes" ? "border-cyan-500/50 bg-cyan-500/10" : "border-white/10"}`}>
                  <img src={v.imageUrl} alt={v.name} className="w-16 h-9 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{v.name}</p>
                    <p className="text-[10px] text-zinc-500">{new Date(v.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <button
                    onClick={() => handleRestoreVersion(v)}
                    className="text-cyan-400 hover:text-cyan-300"
                    title="Restaurer cette version"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => deleteVersion.mutate({ id: v.id, thumbnailId }, { onSuccess: () => utilsVersions.imageVersions.list.invalidate({ thumbnailId }) })}
                    className="text-zinc-500 hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Delete */}
      <button onClick={deleteSelected} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Supprimer">
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Export */}
      <button onClick={exportCanvas} className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors" title="Exporter">
        <Download className="w-5 h-5" />
      </button>
    </div>
  );

  const renderPropertyPanel = () => {
    if (!selectedElement) return null;

    return (
      <div className="fixed right-0 top-0 h-full w-56 bg-[#111] border-l border-white/5 p-4 z-40 overflow-y-auto">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Propriétés</p>

        {selectedElement.type === "text" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Texte</label>
              <textarea
                value={(selectedElement as EditorTextElement).text}
                onChange={e => updateElement(selectedElement.id, { text: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/5 text-white text-xs outline-none"
                rows={2}
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Taille police</label>
              <input
                type="range"
                min="12"
                max="120"
                value={(selectedElement as EditorTextElement).fontSize}
                onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
              <span className="text-[10px] text-zinc-500">{(selectedElement as EditorTextElement).fontSize}px</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => updateElement(selectedElement.id, { fontWeight: (selectedElement as EditorTextElement).fontWeight === "bold" ? "normal" : "bold" })}
                className={`p-1.5 rounded ${(selectedElement as EditorTextElement).fontWeight === "bold" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-white"}`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateElement(selectedElement.id, { fontStyle: (selectedElement as EditorTextElement).fontStyle === "italic" ? "normal" : "italic" })}
                className={`p-1.5 rounded ${(selectedElement as EditorTextElement).fontStyle === "italic" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-white"}`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateElement(selectedElement.id, { textDecoration: (selectedElement as EditorTextElement).textDecoration === "underline" ? "none" : "underline" })}
                className={`p-1.5 rounded ${(selectedElement as EditorTextElement).textDecoration === "underline" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-white"}`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Alignement</label>
              <div className="flex gap-1">
                <button
                  onClick={() => updateElement(selectedElement.id, { align: "left" })}
                  className={`p-1.5 rounded ${(selectedElement as EditorTextElement).align === "left" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500"}`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateElement(selectedElement.id, { align: "center" })}
                  className={`p-1.5 rounded ${(selectedElement as EditorTextElement).align === "center" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500"}`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedElement.type === "shape" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Largeur</label>
              <input
                type="range"
                min="20"
                max="600"
                value={(selectedElement as EditorShapeElement).width}
                onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Hauteur</label>
              <input
                type="range"
                min="20"
                max="400"
                value={(selectedElement as EditorShapeElement).height}
                onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Opacité</label>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement as EditorShapeElement).opacity * 100}
                onChange={e => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderElement = (el: EditorElement) => {
    const isSelected = el.id === selectedId;
    const cursorStyle = isDragging && isSelected ? "grabbing" : "grab";

    if (el.type === "text") {
      return (
        <div
          key={el.id}
          data-element-id={el.id}
          onMouseDown={e => handleElementMouseDown(e, el.id)}
          style={{
            position: "absolute",
            left: el.x,
            top: el.y,
            fontSize: el.fontSize,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            textDecoration: el.textDecoration,
            textAlign: el.align,
            color: el.color,
            width: el.width,
            cursor: cursorStyle,
            outline: isSelected ? "2px solid #06B6D4" : "none",
            outlineOffset: 2,
            userSelect: "none",
            lineHeight: 1.2,
          }}
          className="editable-text"
          contentEditable={!isDragging && isSelected}
          suppressContentEditableWarning
        >
          {el.text}
        </div>
      );
    }

    if (el.type === "shape") {
      return (
        <div
          key={el.id}
          data-element-id={el.id}
          onMouseDown={e => handleElementMouseDown(e, el.id)}
          style={{
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            backgroundColor: el.color,
            opacity: el.opacity,
            borderRadius: el.shape === "circle" ? "50%" : el.shape === "rect" ? 4 : 0,
            clipPath: el.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
            cursor: cursorStyle,
            outline: isSelected ? "2px solid #06B6D4" : "none",
            outlineOffset: 2,
            userSelect: "none",
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#000] flex">
      {renderToolbar()}

      {/* Main canvas area */}
      <div className="flex-1 ml-16 mr-0 lg:mr-56 flex flex-col items-center justify-center p-4">
        {/* Top bar */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-4">
          <h1 className="text-sm font-medium text-white">Éditeur de miniature</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">{Math.round(zoom * 100)}%</span>
            <Button onClick={exportCanvas} className="h-8 text-xs bg-white text-black hover:bg-white/90">
              <Save className="w-3.5 h-3.5 mr-1" /> Exporter
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="relative overflow-auto max-w-full max-h-[70vh] border border-white/5 rounded-lg"
          style={{ cursor: "default" }}
        >
          <div
            ref={canvasRef}
            data-canvas="true"
            onMouseDown={handleCanvasMouseDown}
            style={{
              width: 640 * zoom,
              height: 360 * zoom,
              backgroundColor: bgImageUrl ? undefined : bgTransparent ? "transparent" : bgColor,
              backgroundImage: bgImageUrl ? `url("${bgImageUrl}")` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              position: "relative",
            }}
            className="relative"
          >
            {/* Grid overlay when zoomed */}
            {zoom > 1 && (
              <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
            )}

            {bgImageUrl && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Background image preview overlay (rendered via CSS on parent) */}
              </div>
            )}
            {elements.map(renderElement)}

            {elements.length === 0 && !bgImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-zinc-700 text-sm">Ajoute des éléments avec le bouton + à gauche</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property panel */}
      {renderPropertyPanel()}
    </div>
  );
}
