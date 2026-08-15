import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  Smartphone, Tablet, Youtube, X, Heart, Sparkles, UploadCloud,
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
  const [devicePreview, setDevicePreview] = useState<"none" | "phone" | "tablet" | "youtube">("none");

  // === Format du canevas (dynamique selon le panneau gauche) ===
  const [canvasSize, setCanvasSize] = useState({ w: 640, h: 360 });
  const exportDimensions = useMemo(() => {
    const ratio = canvasSize.w / canvasSize.h;
    if (Math.abs(ratio - 16 / 9) < 0.01) return { w: 1280, h: 720 };
    if (Math.abs(ratio - 9 / 16) < 0.01) return { w: 720, h: 1280 };
    if (Math.abs(ratio - 1) < 0.01) return { w: 1280, h: 1280 };
    if (Math.abs(ratio - 4 / 5) < 0.01) return { w: 1152, h: 1440 };
    if (Math.abs(ratio - 21 / 9) < 0.01) return { w: 1512, h: 648 };
    const max = 1512;
    return canvasSize.w >= canvasSize.h
      ? { w: max, h: Math.round(max / ratio) }
      : { w: Math.round(max * ratio), h: max };
  }, [canvasSize]);
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
      return await toPng(canvasRef.current, { width: exportDimensions.w, height: exportDimensions.h, pixelRatio: 1, cacheBust: true });
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
      color: shape === "rect" ? "#F97316" : shape === "circle" ? "#EC4899" : "#F59E0B",
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

  // ===== Resize handles (drag corners/edges directly on the canvas) =====
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ clientX: number; clientY: number; x: number; y: number; w: number; h: number } | null>(null);

  type ResizeDir =
    | "nw" | "n" | "ne"
    | "w" | "e"
    | "sw" | "s" | "se";

  const handleResizeMouseDown = (e: React.MouseEvent, dir: ResizeDir) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedId) return;
    const el = elements.find(x => x.id === selectedId);
    if (!el) return;
    setResizeHandle(dir);
    const h = (el.type === "text" ? Math.max(40, el.fontSize ?? 32) : (el.height ?? 0));
    setResizeStart({ clientX: e.clientX, clientY: e.clientY, x: el.x, y: el.y, w: el.width, h });
  };

  const RESIZE_DIRS: ResizeDir[] = ["nw", "n", "ne", "w", "e", "sw", "s", "se"];

  const renderResizeHandles = () => {
    if (!selectedId) return null;
    const el = elements.find(x => x.id === selectedId);
    if (!el) return null;
    // Text elements only resize width (height is content-driven)
    const isText = el.type === "text";
    return (
      <div
        className="absolute pointer-events-none z-10"
        style={{ left: el.x, top: el.y, width: isText ? el.width : el.width, height: isText ? Math.max(40, el.fontSize ?? 32) : el.height ?? 0 }}
      >
        {RESIZE_DIRS.map(dir => {
          if (isText && dir !== "e" && dir !== "w") return null;
          const pos: Record<ResizeDir, React.CSSProperties> = {
            nw: { left: -5, top: -5 },
            n: { left: "50%", top: -5, transform: "translateX(-50%)" },
            ne: { right: -5, top: -5 },
            w: { left: -5, top: "50%", transform: "translateY(-50%)" },
            e: { right: -5, top: "50%", transform: "translateY(-50%)" },
            sw: { left: -5, bottom: -5 },
            s: { left: "50%", bottom: -5, transform: "translateX(-50%)" },
            se: { right: -5, bottom: -5 },
          };
          const cursor: Record<ResizeDir, string> = {
            nw: "nwse-resize", n: "ns-resize", ne: "nesw-resize",
            w: "ew-resize", e: "ew-resize",
            sw: "nesw-resize", s: "ns-resize", se: "nwse-resize",
          };
          return (
            <div
              key={dir}
              className="pointer-events-auto"
              onMouseDown={e => handleResizeMouseDown(e, dir)}
              style={{
                position: "absolute",
                ...pos[dir],
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: "#F97316",
                border: "2px solid #fff",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
                cursor: cursor[dir],
                zIndex: 20,
              }}
              title="Redimensionner"
            />
          );
        })}
      </div>
    );
  };

  const handleElementMouseDown = (e: React.MouseEvent, elId: string) => {
    // Ignore drags that start on a resize handle (pointer-events-auto divs)
    if ((e.target as HTMLElement).dataset.resize) return;
    e.stopPropagation();
    setSelectedId(elId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    const el = elements.find(e => e.id === elId);
    if (el) setDragElStart({ x: el.x, y: el.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedId) return;
      // --- Resize in progress
      if (resizeHandle && resizeStart) {
        const dx = (e.clientX - resizeStart.clientX) / zoom;
        const dy = (e.clientY - resizeStart.clientY) / zoom;
        const el = elements.find(x => x.id === selectedId);
        if (!el) return;
        const MIN = 20;
        const elW = el.width ?? 0;
        const elH = el.type === "text" ? Math.max(40, el.fontSize ?? 32) : (el.height ?? 0);
        const keepRatio = e.shiftKey;
        let newW = resizeStart.w;
        let newH = resizeStart.h;
        let newX = resizeStart.x;
        let newY = resizeStart.y;
        const dir = resizeHandle;
        const aspect = elW && elH ? elW / elH : 0;
        if (dir.includes("e")) newW = Math.max(MIN, resizeStart.w + dx);
        if (dir.includes("w")) { newW = Math.max(MIN, resizeStart.w - dx); newX = resizeStart.x + (resizeStart.w - newW); }
        if (dir.includes("s")) newH = Math.max(MIN, resizeStart.h + dy);
        if (dir.includes("n")) { newH = Math.max(MIN, resizeStart.h - dy); newY = resizeStart.y + (resizeStart.h - newH); }
        if (keepRatio && aspect) {
          if (dir === "n" || dir === "s") {
            newW = newH * aspect;
            if (dir === "n") newX = resizeStart.x + (resizeStart.w - newW);
          } else if (dir === "e" || dir === "w") {
            newH = newW / aspect;
            if (dir === "w") newY = resizeStart.y + (resizeStart.h - newH);
          } else {
            // Corners: derive both from the diagonal-most delta, keep aspect
            const maxW = resizeStart.w + (dir.includes("e") ? dx : -dx);
            const maxH = resizeStart.h + (dir.includes("s") ? dy : -dy);
            newW = Math.max(MIN, maxW);
            newH = Math.max(MIN, newW / aspect);
            if (maxH > newH && aspect) {
              newH = Math.max(MIN, maxH);
              newW = Math.max(MIN, newH * aspect);
            }
            if (dir === "nw") { newX = resizeStart.x + (resizeStart.w - newW); newY = resizeStart.y + (resizeStart.h - newH); }
            else if (dir === "ne") { newY = resizeStart.y + (resizeStart.h - newH); }
            else if (dir === "sw") { newX = resizeStart.x + (resizeStart.w - newW); }
          }
        }
        updateElement(selectedId, { width: Math.round(newW), height: Math.round(newH), x: Math.round(newX), y: Math.round(newY) });
        return;
      }
      // --- Drag in progress
      if (!isDragging) return;
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      updateElement(selectedId, {
        x: Math.max(0, dragElStart.x + dx),
        y: Math.max(0, dragElStart.y + dy),
      });
    };

    const handleMouseUp = () => {
      if ((isDragging || resizeHandle) && selectedId) {
        pushHistory(elements);
      }
      setIsDragging(false);
      setResizeHandle(null);
      setResizeStart(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedId, dragStart, dragElStart, zoom, elements, pushHistory, resizeHandle, resizeStart]);

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
  const colors = ["#FFFFFF", "#000000", "#EF4444", "#F97316", "#EAB308", "#FDBA74", "#EA580C", "#3B82F6", "#8B5CF6", "#EC4899"];
  const bgUploadInputRef = useRef<HTMLInputElement>(null);

  // ===== Drag & drop images onto the canvas =====
  const [dragOver, setDragOver] = useState(false);

  const handleDropImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier non supporté — glisse une image (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 8 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        const cw = canvasSize.w;
        const ch = canvasSize.h;
        // If there is already a background, insert as a framed layer; otherwise set as background
        if (bgImageUrl) {
          const scale = Math.min(cw / img.width, ch / img.height, 1);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const el: EditorImageElement = {
            id: `img-${Date.now()}`,
            type: "image",
            url,
            x: Math.round((cw - w) / 2),
            y: Math.round((ch - h) / 2),
            width: w,
            height: h,
            opacity: 1,
            borderRadius: 0,
          };
          const newElements = [...elements, el];
          setElements(newElements);
          pushHistory(newElements);
          setSelectedId(el.id);
          toast.success("Image insérée comme calque — déplace-la librement");
        } else {
          setBgImageUrl(url);
          toast.success("Image de fond ajoutée !");
        }
      };
      img.onerror = () => toast.error("Image illisible");
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [canvasSize, bgImageUrl, elements, pushHistory]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Keep the highlight only while the pointer is over the canvas container
    const related = e.relatedTarget as Node | null;
    const container = canvasContainerRef.current;
    if (!container?.contains(related)) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const img = files.find(f => f.type.startsWith("image/"));
    if (!img) {
      toast.error("Glisse une image (PNG, JPG, WEBP)");
      return;
    }
    handleDropImage(img);
  }, [handleDropImage]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgItem = items.find(i => i.kind === "file" && i.type.startsWith("image/"));
    if (imgItem) {
      const file = imgItem.getAsFile();
      if (file) handleDropImage(file);
    }
  }, [handleDropImage]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

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

  // ===== Left panel (formats, colors, background) =====
  const formats = [
    { key: "16:9", label: "16:9", w: 640, h: 360 },
    { key: "9:16", label: "9:16", w: 360, h: 640 },
    { key: "1:1", label: "1:1", w: 480, h: 480 },
    { key: "4:5", label: "4:5", w: 480, h: 600 },
    { key: "21:9", label: "21:9", w: 700, h: 300 },
  ];

  const renderLeftPanel = () => (
    <aside className="w-64 shrink-0 border-r border-border bg-[#0c0d12] flex flex-col overflow-y-auto">
      {/* Format */}
      <div className="p-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Format</p>
        <div className="grid grid-cols-5 gap-1.5">
          {formats.map(f => {
            const active = canvasSize.w === f.w && canvasSize.h === f.h;
            return (
              <button
                key={f.key}
                onClick={() => setCanvasSize({ w: f.w, h: f.h })}
                className={`aspect-square rounded-lg border text-[10px] font-medium flex items-center justify-center transition-colors ${
                  active
                    ? "border-orange-400 bg-orange-400/15 text-orange-300"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-white/20"
                }`}
                title={f.label}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Background fit */}
      <div className="p-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Ajustement du fond</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setBgFit("cover")}
            className={`flex-1 text-[11px] rounded-lg px-2 py-1.5 transition-colors ${bgFit === "cover" ? "bg-orange-500/20 text-orange-300" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Couvrir
          </button>
          <button
            onClick={() => setBgFit("contain")}
            className={`flex-1 text-[11px] rounded-lg px-2 py-1.5 transition-colors ${bgFit === "contain" ? "bg-orange-500/20 text-orange-300" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Contenir
          </button>
        </div>
      </div>

      {/* Colors */}
      <div className="p-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Couleurs</p>
        <div className="flex flex-wrap gap-1.5">
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
              className="w-7 h-7 rounded-full border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            onClick={() => setBgTransparent(true)}
            className={`w-7 h-7 rounded-full border text-[9px] font-bold transition-colors ${bgTransparent && !bgImageUrl ? "border-orange-400 text-orange-300" : "border-border text-muted-foreground"}`}
            title="Fond transparent"
          >
            ∅
          </button>
        </div>
      </div>

      {/* Layers quick actions */}
      <div className="p-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Calques</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => bgUploadInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 bg-card hover:bg-card/80 border border-border text-xs text-foreground rounded-lg px-2 py-2 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Fond
          </button>
          <button
            onClick={insertImageAsLayer as any}
            className="flex items-center justify-center gap-1.5 bg-card hover:bg-card/80 border border-border text-xs text-orange-300 rounded-lg px-2 py-2 transition-colors"
          >
            <Move className="w-3.5 h-3.5" /> Calque
          </button>
          {bgImageUrl && (
            <button
              onClick={clearBgImage}
              className="flex items-center justify-center gap-1.5 bg-card hover:bg-red-500/10 border border-border text-xs text-red-400 rounded-lg px-2 py-2 transition-colors col-span-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Retirer le fond
            </button>
          )}
          <button
            onClick={() => setShowVersions(v => !v)}
            className="flex items-center justify-center gap-1.5 bg-card hover:bg-card/80 border border-border text-xs text-foreground rounded-lg px-2 py-2 transition-colors col-span-2 relative"
          >
            <History className="w-3.5 h-3.5" /> Versions
            {versions && versions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center">
                {versions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1" />

      {/* AI regenerate strip */}
      <div className="p-3 border-t border-border">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 hover:from-orange-600 hover:via-orange-500 hover:to-amber-500 transition-all shadow-lg shadow-orange-500/20"
        >
          <Sparkles className="w-4 h-4" /> Générer avec IA
        </Link>
      </div>
    </aside>
  );

  const renderVersionsPanel = () => {
    if (!showVersions) return null;
    return (
      <div className="absolute left-3 bottom-16 bg-[#0c0d12] border border-border rounded-xl shadow-2xl z-50 w-72 p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Versions d'image</p>
        {thumbnailId <= 0 && (
          <p className="text-xs text-muted-foreground mb-2">Ouvre l'éditeur depuis une miniature de ton tableau de bord pour enregistrer des versions.</p>
        )}
        <div className="flex gap-1.5 mb-3">
          <input
            value={versionName}
            onChange={e => setVersionName(e.target.value)}
            placeholder="Nom de la version…"
            className="flex-1 bg-[#111] border border-border rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 outline-none"
          />
          <button
            onClick={handleSaveVersion}
            disabled={createVersion.isPending}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
        {(!versions || versions.length === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-3">Aucune version enregistrée</p>
        ) : (
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {versions.map((v: any) => (
              <div key={v.id} className={`flex items-center gap-2 rounded-lg border p-2 ${v.isCurrent === "yes" ? "border-orange-400/50 bg-orange-400/10" : "border-border"}`}>
                <img src={v.imageUrl} alt={v.name} className="w-16 h-9 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleString("fr-FR")}</p>
                </div>
                <button
                  onClick={() => handleRestoreVersion(v)}
                  className="text-orange-400 hover:text-orange-300"
                  title="Restaurer cette version"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => deleteVersion.mutate({ id: v.id, thumbnailId }, { onSuccess: () => utilsVersions.imageVersions.list.invalidate({ thumbnailId }) })}
                  className="text-muted-foreground hover:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPropertyPanel = () => {
    if (!selectedElement) return null;

    return (
      <div className="fixed right-0 top-0 h-full w-56 bg-[#111] border-l border-border p-4 z-40 overflow-y-auto">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Propriétés</p>

        {selectedElement.type === "text" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Texte</label>
              <textarea
                value={(selectedElement as EditorTextElement).text}
                onChange={e => updateElement(selectedElement.id, { text: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg bg-[#1a1a1a] border border-border text-white text-xs outline-none"
                rows={2}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Taille police</label>
              <input
                type="range"
                min="12"
                max="120"
                value={(selectedElement as EditorTextElement).fontSize}
                onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                className="w-full accent-orange-400"
              />
              <span className="text-[10px] text-muted-foreground">{(selectedElement as EditorTextElement).fontSize}px</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => updateElement(selectedElement.id, { fontWeight: (selectedElement as EditorTextElement).fontWeight === "bold" ? "normal" : "bold" })}
                className={`p-1.5 rounded ${(selectedElement as EditorTextElement).fontWeight === "bold" ? "bg-orange-500/20 text-orange-300" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateElement(selectedElement.id, { fontStyle: (selectedElement as EditorTextElement).fontStyle === "italic" ? "normal" : "italic" })}
                className={`p-1.5 rounded ${(selectedElement as EditorTextElement).fontStyle === "italic" ? "bg-orange-500/20 text-orange-300" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateElement(selectedElement.id, { textDecoration: (selectedElement as EditorTextElement).textDecoration === "underline" ? "none" : "underline" })}
                className={`p-1.5 rounded ${(selectedElement as EditorTextElement).textDecoration === "underline" ? "bg-orange-500/20 text-orange-300" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Alignement</label>
              <div className="flex gap-1">
                <button
                  onClick={() => updateElement(selectedElement.id, { align: "left" })}
                  className={`p-1.5 rounded ${(selectedElement as EditorTextElement).align === "left" ? "bg-orange-500/20 text-orange-300" : "text-muted-foreground"}`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateElement(selectedElement.id, { align: "center" })}
                  className={`p-1.5 rounded ${(selectedElement as EditorTextElement).align === "center" ? "bg-orange-500/20 text-orange-300" : "text-muted-foreground"}`}
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
              <p className="text-[10px] text-muted-foreground mb-1.5">Encadrement (taille)</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => fitImageLayer("contain")}
                  className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] rounded-lg px-2 py-1.5 transition-colors"
                >
                  Contenir
                </button>
                <button
                  onClick={() => fitImageLayer("cover")}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] rounded-lg px-2 py-1.5 transition-colors"
                >
                  Couvrir
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Largeur</label>
              <input
                type="range"
                min="40"
                max="640"
                value={(selectedElement as EditorImageElement).width}
                onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                className="w-full accent-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Hauteur</label>
              <input
                type="range"
                min="40"
                max="360"
                value={(selectedElement as EditorImageElement).height}
                onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                className="w-full accent-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Opacité</label>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement as EditorImageElement).opacity * 100}
                onChange={e => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Arrondi</label>
              <input
                type="range"
                min="0"
                max="200"
                value={(selectedElement as EditorImageElement).borderRadius}
                onChange={e => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                className="w-full accent-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Rotation ({(selectedElement as EditorImageElement).rotation ?? 0}°)</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={(selectedElement as EditorImageElement).rotation ?? 0}
                onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                className="w-full accent-orange-400"
              />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Ordre des calques</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => moveLayer(selectedElement.id, "up")}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] rounded-lg px-2 py-1.5 transition-colors"
                >
                  Au premier plan
                </button>
                <button
                  onClick={() => moveLayer(selectedElement.id, "down")}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] rounded-lg px-2 py-1.5 transition-colors"
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
              <label className="text-[10px] text-muted-foreground mb-1 block">Largeur</label>
              <input
                type="range"
                min="20"
                max="600"
                value={(selectedElement as EditorShapeElement).width}
                onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                className="w-full accent-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Hauteur</label>
              <input
                type="range"
                min="20"
                max="400"
                value={(selectedElement as EditorShapeElement).height}
                onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                className="w-full accent-orange-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Opacité</label>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement as EditorShapeElement).opacity * 100}
                onChange={e => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-orange-400"
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
            outline: isSelected ? "2px solid #F97316" : "none",
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
            outline: isSelected ? "2px solid #F97316" : "none",
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
            outline: isSelected ? "2px solid #F97316" : "none",
            outlineOffset: 2,
            userSelect: "none",
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#000] flex overflow-hidden">
      {renderLeftPanel()}

      {/* Zone centrale : topbar + canvas + variantes */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Topbar pro */}
        <div className="h-14 shrink-0 border-b border-border bg-[#0c0d12] flex items-center px-3 gap-2 relative pr-20">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Retour au tableau de bord"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Tableau de bord</span>
          </Link>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          {/* Outils centraux */}
          <div className="flex items-center gap-0.5 mx-auto">
            <button
              onClick={addTextElement}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Ajouter du texte"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowAddMenu(!showAddMenu); setShowAddMenu(m => m); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Ajouter une forme"
            >
              <Layers className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={handleUndo}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Annuler"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refaire"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Zoom +"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Zoom -"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => setDevicePreview("phone")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Aperçu smartphone"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevicePreview("tablet")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Aperçu tablette"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => setDevicePreview("youtube")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Aperçu YouTube (miniature dans les suggestions)"
            >
              <Youtube className="w-4 h-4" />
            </button>
          </div>

          {/* Droite : zoom, filigrane, export */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            {isFreePlan && (
              <span className="hidden lg:inline-flex text-[10px] text-amber-400 border border-amber-400/30 rounded-full px-2 py-0.5">
                Filigrane
              </span>
            )}
            <Button onClick={exportCanvas} className="h-8 text-xs bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white">
              <Download className="w-3.5 h-3.5 mr-1" /> Exporter
            </Button>
          </div>
        </div>

        {/* Menu ajouter (forme/couleur/image) — flottant sous la topbar */}
        {showAddMenu && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 mt-1 bg-[#1a1a1a] border border-border rounded-xl p-3 shadow-2xl z-50 w-56">
            <p className="text-[10px] text-muted-foreground uppercase mb-2">Ajouter</p>
            <button onClick={addTextElement} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left">
              <Type className="w-3.5 h-3.5" /> Texte
            </button>
            <button onClick={() => addShapeElement("rect")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left">
              <Layers className="w-3.5 h-3.5" /> Rectangle
            </button>
            <button onClick={() => addShapeElement("circle")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left">
              <Layers className="w-3.5 h-3.5" /> Cercle
            </button>
            <button onClick={() => addShapeElement("triangle")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left">
              <Layers className="w-3.5 h-3.5" /> Triangle
            </button>
            <div className="w-full h-px bg-muted my-1" />
            <button onClick={addBackground} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left">
              <Palette className="w-3.5 h-3.5" /> Couleur d'arrière-plan
            </button>
            <button
              onClick={() => bgUploadInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition-colors text-left"
            >
              <Layers className="w-3.5 h-3.5" /> Importer une image
            </button>
            <button
              onClick={insertImageAsLayer as any}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-orange-400 hover:bg-muted transition-colors text-left"
            >
              <Move className="w-3.5 h-3.5" /> Insérer comme calque (modifiable)
            </button>
            {bgImageUrl && (
              <button
                onClick={clearBgImage}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-muted transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> Retirer l'image de fond
              </button>
            )}
          </div>
        )}

        {/* Canvas — drag & drop images directly onto it */}
        <div
          ref={canvasContainerRef}
          className="relative overflow-auto max-w-full max-h-[70vh] border border-border rounded-lg transition-colors"
          style={{ cursor: "default" }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag-over indicator overlay */}
          {dragOver && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 border-2 border-dashed border-orange-400 bg-orange-500/10 rounded-lg w-[92%] h-[92%] backdrop-blur-sm">
                <UploadCloud className="w-8 h-8 text-orange-400" />
                <p className="text-sm font-medium text-orange-300">Relâche pour ajouter l'image</p>
                <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP · max 8 Mo</p>
              </div>
            </div>
          )}
          <div
            ref={canvasRef}
            data-canvas="true"
            onMouseDown={handleCanvasMouseDown}
            style={{
              width: canvasSize.w * zoom,
              height: canvasSize.h * zoom,
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

            {renderResizeHandles()}

            {renderVersionsPanel()}

            {elements.length === 0 && !bgImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-6">
                  <p className="text-muted-foreground text-sm mb-3">Canva — ajoute des éléments, colle (Ctrl+V) ou glisse une image directement sur la zone</p>
                  <button
                    onClick={() => bgUploadInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
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
        <DialogContent className="max-w-sm bg-[#141414] border-border">
          <DialogHeader>
            <DialogTitle className="text-white text-sm">
              {devicePreview === "phone" ? "Aperçu smartphone" : devicePreview === "youtube" ? "Aperçu YouTube" : "Aperçu tablette"}
            </DialogTitle>
          </DialogHeader>

          {/* Aperçu YouTube : vignette dans le contexte réel des suggestions YouTube */}
          {devicePreview === "youtube" && (
            <div className="pb-2">
              <p className="text-[11px] text-muted-foreground text-center mb-3">Ta miniature vue dans les suggestions et résultats YouTube</p>
              <div className="bg-[#0f0f0f] rounded-xl p-4 flex justify-center">
                <div style={{ width: 320 }}>
                  {/* Vignette */}
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: `${canvasSize.w} / ${canvasSize.h}` }}>
                    <div
                      ref={previewCanvasRef}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: canvasSize.w,
                        height: canvasSize.h,
                        transform: "translate(-50%, -50%)",
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
                  {/* Métadonnées fictives (style réel YouTube) */}
                  <div className="flex gap-3 mt-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      C
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[13px] font-medium leading-snug line-clamp-2">
                        Ma vidéo incroyable qui va cartonner 🚀
                      </p>
                      <p className="text-zinc-400 text-[12px] mt-0.5">Créateur Minia</p>
                      <p className="text-zinc-400 text-[12px]">1,2 M de vues · il y a 2 jours</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground text-center -mt-1">
                L'aperçu se met à jour en temps réel pendant que tu modifies la miniature
              </p>
            </div>
          )}
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
                    width: canvasSize.w,
                    height: canvasSize.h,
                    transform: `translate(-50%, -50%) scale(${(devicePreview === "phone" ? 360 : 900) / canvasSize.w})`,
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
          <p className="text-[11px] text-muted-foreground text-center -mt-2">
            Simule l'affichage dans les suggestions YouTube ({canvasSize.w}×{canvasSize.h})
          </p>
        </DialogContent>
      </Dialog>

      {/* Panneau droit propriétés */}
      {renderPropertyPanel()}
    </div>
  );
}
