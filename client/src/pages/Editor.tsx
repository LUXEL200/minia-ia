import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Type, Move, Trash2, Plus,
  RotateCcw, ZoomIn, ZoomOut, Layers, Palette, History,
  ChevronLeft, Undo2, Redo2, Save, Menu,
  Bold, Italic, Underline, AlignLeft, AlignCenter,
  Smartphone, Tablet, X, LayoutTemplate, Heart,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


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
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  borderRadius: number;
  rotation?: number;
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
  const [bgFit, setBgFit] = useState<"cover" | "contain">("cover");
  const [isDragging, setIsDragging] = useState(false);
  const [devicePreview, setDevicePreview] = useState<"none" | "phone" | "tablet">("none");
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElStart, setDragElStart] = useState({ x: 0, y: 0 });

  // === Versions panel ===
  const thumbnailId = Number(new URLSearchParams(search).get("thumbnailId") || "0");
  const [showVersions, setShowVersions] = useState(false);
  const [versionName, setVersionName] = useState("");

  const { data: creditsData } = trpc.thumbnail.credits.useQuery();
  const isFreePlan = creditsData?.planType !== "pro" && creditsData?.planType !== "max";

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
      let finalDataUrl = dataUrl;
      if (isFreePlan) {
        finalDataUrl = await applyWatermark(dataUrl);
      }
      const link = document.createElement("a");
      link.href = finalDataUrl;
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

  /** Burn a "Minia IA" watermark into the bottom-right corner of the exported PNG */
  const applyWatermark = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 1280;
        c.height = 720;
        const cx = c.getContext("2d");
        if (!cx) return resolve(dataUrl);
        cx.drawImage(img, 0, 0, 1280, 720);
        cx.font = "bold 34px sans-serif";
        cx.fillStyle = "rgba(255, 255, 255, 0.85)";
        cx.shadowColor = "rgba(0, 0, 0, 0.7)";
        cx.shadowBlur = 8;
        cx.shadowOffsetX = 2;
        cx.shadowOffsetY = 2;
        cx.textAlign = "right";
        cx.fillText("Minia IA", 1256, 688);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
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
  const bgUploadInputRef = useRef<HTMLInputElement>(null);

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier non supporté — choisis une image (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 8 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBgImageUrl(String(reader.result || ""));
      toast.success("Image de fond ajoutée !");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /** Insert the uploaded image as a movable/resizable layer (properly framed) */
  const insertImageAsLayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddMenu(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > 8 * 1024 * 1024) { toast.error("Image trop volumineuse (max 8 Mo)"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || "");
        // Measure the image to frame it proportionally within the canvas (640×360)
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(640 / img.width, 360 / img.height, 1);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const el: EditorImageElement = {
            id: `img-${Date.now()}`,
            type: "image",
            url,
            x: Math.round((640 - w) / 2),
            y: Math.round((360 - h) / 2),
            width: w,
            height: h,
            opacity: 1,
            borderRadius: 0,
          };
          const newElements = [...elements, el];
          setElements(newElements);
          pushHistory(newElements);
          setSelectedId(el.id);
          toast.success("Image insérée comme calque — déplace-la et redimensionne-la dans le panneau Propriétés");
        };
        img.onerror = () => toast.error("Image illisible");
        img.src = url;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  /** Move an element to the front or back of the layer stack */
  const moveLayer = (id: string, dir: "up" | "down") => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx < 0) return;
    const newElements = [...elements];
    const [el] = newElements.splice(idx, 1);
    newElements.splice(dir === "up" ? newElements.length : 0, 0, el);
    setElements(newElements);
    pushHistory(newElements);
  };

  /** Adjust an inserted image layer's size while keeping its ratio (framing tool) */
  const fitImageLayer = (mode: "cover" | "contain") => {
    const el = elements.find(e => e.id === selectedId);
    if (!el || el.type !== "image") { toast.error("Sélectionne d'abord une image insérée"); return; }
    const url = (el as EditorImageElement).url;
    const img = new Image();
    img.onload = () => {
      const scale = mode === "cover" ? Math.max(640 / img.width, 360 / img.height) : Math.min(640 / img.width, 360 / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      updateElement(el.id, { width: w, height: h, x: Math.round((640 - w) / 2), y: Math.round((360 - h) / 2) });
      pushHistory([...elements]);
      toast.success(mode === "cover" ? "Image étendue (cover)" : "Image ajustée (contain)");
    };
    img.src = url;
  };

  const clearBgImage = () => {
    setBgImageUrl(null);
    toast.success("Image de fond retirée");
  };

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
              <Palette className="w-3.5 h-3.5" /> Couleur d'arrière-plan
            </button>
            <div className="w-full h-px bg-white/5 my-1" />
            <p className="text-[10px] text-zinc-500 px-1 pt-1">Image de fond</p>
            <button
              onClick={insertImageAsLayer}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-cyan-400 hover:bg-white/5 transition-colors text-left"
            >
              <Move className="w-3.5 h-3.5" /> Insérer comme calque (modifiable)
            </button>
            <button
              onClick={() => bgUploadInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-white/5 transition-colors text-left"
            >
              <Layers className="w-3.5 h-3.5" /> Importer une image
            </button>
            {bgImageUrl && (
              <button
                onClick={clearBgImage}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-white/5 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> Retirer l'image de fond
              </button>
            )}
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

      {/* Background fit */}
      <button
        onClick={() => setBgFit(f => f === "cover" ? "contain" : "cover")}
        className={`p-2 rounded-lg transition-colors ${bgFit === "contain" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
        title={bgFit === "cover" ? "Recadrage : Couvrir (cover)" : "Recadrage : Contenir (contain)"}
      >
        <LayoutTemplate className="w-5 h-5" />
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

      {/* Aperçu mobile/tablette */}
      <button
        onClick={() => setDevicePreview("phone")}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        title="Aperçu smartphone"
      >
        <Smartphone className="w-5 h-5" />
      </button>

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

        {selectedElement.type === "image" && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-zinc-500 mb-1.5">Encadrement (taille)</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => fitImageLayer("contain")}
                  className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-[11px] rounded-lg px-2 py-1.5 transition-colors"
                >
                  Contenir
                </button>
                <button
                  onClick={() => fitImageLayer("cover")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] rounded-lg px-2 py-1.5 transition-colors"
                >
                  Couvrir
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Largeur</label>
              <input
                type="range"
                min="40"
                max="640"
                value={(selectedElement as EditorImageElement).width}
                onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Hauteur</label>
              <input
                type="range"
                min="40"
                max="360"
                value={(selectedElement as EditorImageElement).height}
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
                value={(selectedElement as EditorImageElement).opacity * 100}
                onChange={e => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Arrondi</label>
              <input
                type="range"
                min="0"
                max="200"
                value={(selectedElement as EditorImageElement).borderRadius}
                onChange={e => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Rotation ({(selectedElement as EditorImageElement).rotation ?? 0}°)</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={(selectedElement as EditorImageElement).rotation ?? 0}
                onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1.5">Ordre des calques</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => moveLayer(selectedElement.id, "up")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] rounded-lg px-2 py-1.5 transition-colors"
                >
                  Au premier plan
                </button>
                <button
                  onClick={() => moveLayer(selectedElement.id, "down")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] rounded-lg px-2 py-1.5 transition-colors"
                >
                  À l'arrière-plan
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

    if (el.type === "image") {
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
            backgroundImage: `url("${(el as EditorImageElement & { url?: string }).url || ""}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: el.opacity,
            borderRadius: el.borderRadius,
            transform: (el as EditorImageElement).rotation ? `rotate(${(el as EditorImageElement).rotation}deg)` : undefined,
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
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-white">Éditeur de miniature</h1>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 text-[11px] border-white/10 text-zinc-400 hover:text-white" onClick={() => setDevicePreview("tablet")}>
                <Tablet className="w-3.5 h-3.5 mr-1" /> Aperçu tablette
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] border-white/10 text-zinc-400 hover:text-white" onClick={() => setDevicePreview("phone")}>
                <Smartphone className="w-3.5 h-3.5 mr-1" /> Aperçu mobile
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">{Math.round(zoom * 100)}%</span>
            {isFreePlan && (
              <span className="hidden sm:inline-flex text-[10px] text-amber-400 border border-amber-400/30 rounded-full px-2 py-0.5">
                Filigrane Minia IA à l'export
              </span>
            )}
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
              backgroundSize: bgFit,
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
                <div className="text-center px-6">
                  <p className="text-zinc-500 text-sm mb-3">Espace Canva — ajouts des éléments ou une image de fond</p>
                  <button
                    onClick={() => bgUploadInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" /> Importer une image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={bgUploadInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/*" className="hidden" onChange={handleBgFileUpload} />

      {/* Device preview dialog */}
      <Dialog open={devicePreview !== "none"} onOpenChange={open => { if (!open) setDevicePreview("none"); }}>
        <DialogContent className="max-w-sm bg-[#141414] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-sm">
              {devicePreview === "phone" ? "Aperçu smartphone" : "Aperçu tablette"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-2">
            <div
              className="relative border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width: devicePreview === "phone" ? 280 : 400,
                borderRadius: devicePreview === "phone" ? 28 : 16,
              }}
            >
              <div className="relative bg-[#0f0f0f]" style={{ width: "100%", aspectRatio: devicePreview === "phone" ? "9 / 16" : "3 / 2" }}>
                <div
                  ref={previewCanvasRef}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 640,
                    height: 360,
                    transform: `translate(-50%, -50%) scale(${(devicePreview === "phone" ? 360 : 900) / 640})`,
                    transformOrigin: "center center",
                    pointerEvents: "none",
                    backgroundColor: bgImageUrl ? undefined : bgTransparent ? "transparent" : bgColor,
                    backgroundImage: bgImageUrl ? `url("${bgImageUrl}")` : undefined,
                    backgroundSize: bgFit,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  className="relative"
                >
                  {elements.map(renderElement)}
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 text-center -mt-2">
            Simule l'affichage dans les suggestions YouTube ({devicePreview === "phone" ? "360×640" : "900×600"})
          </p>
        </DialogContent>
      </Dialog>

      {/* Property panel */}
      {renderPropertyPanel()}
    </div>
  );
}
