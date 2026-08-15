/**
 * FloatingMenu — bouton hamburger fixe en haut à droite de l'écran.
 * Présent sur toutes les pages (publices + internes + paramètres/éditeur)
 * pour éviter les allers-retours : il ouvre la sidebar complète avec
 * tous les sous-menus (AppSidebar partagé).
 */
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/contexts/ThemeContext";

export default function FloatingMenu({ pageLabel = "Minia IA" }: { pageLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Auto-collapse to a small icon after 3s of inactivity (keep screen clear)
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => setCollapsed(true), 3000);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setCollapsed(false)}
        aria-label="Ouvrir le menu"
        title="Menu"
        className={`fixed top-3 right-3 z-[70] flex items-center justify-center rounded-full backdrop-blur shadow-lg transition-all duration-300 ${
          isLight
            ? "bg-white/95 border border-zinc-200 text-zinc-800 hover:bg-white hover:border-zinc-300"
            : "bg-[#09090B]/80 border border-white/10 text-white hover:bg-white/10 hover:border-white/25"
        } ${
          collapsed ? "w-9 h-9" : "px-3.5 h-9 gap-1.5"
        }`}
        style={{ willChange: "transform" }}
      >
        <Menu size={17} />
        {!collapsed && <span className={`text-[11px] font-medium ${isLight ? "text-zinc-800" : "text-white"}`}>Menu</span>}
      </button>
      <AppSidebar open={open} onClose={() => setOpen(false)} pageLabel={pageLabel} />
    </>
  );
}
