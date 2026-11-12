/**
 * FloatingMenu — bouton hamburger fixe en haut à gauche de l'écran.
 * Présent uniquement dans AppShell sur les pages privées pour éviter les allers-retours :
 * il ouvre la sidebar complète avec
 * tous les sous-menus (AppSidebar partagé).
 */
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

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
      <header className={`fixed top-0 left-0 right-0 z-[79] h-12 border-b backdrop-blur-xl ${isLight ? "border-zinc-200/80 bg-white/85" : "border-white/10 bg-[#09090B]/80"}`}>
        <div className="flex h-full items-center justify-between pl-3 pr-4 sm:pl-4 sm:pr-6">
          <div className="flex min-w-0 items-center gap-2.5 pl-12 sm:pl-14">
            <Link href="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="Retour au dashboard">
              <img src="/manus-storage/minia-bear-paint-logo-b_17324125.png" alt="Minia IA" className="h-7 w-7 object-contain" onError={(event) => { event.currentTarget.src = "/minia-bear-favicon.png"; }} />
              <span className={`hidden text-sm font-bold sm:inline ${isLight ? "text-zinc-900" : "text-white"}`}>Minia<span className="text-orange-400">IA</span></span>
            </Link>
            <span className={`truncate text-xs ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>/ {pageLabel}</span>
          </div>
          <div className={`hidden items-center gap-3 text-[11px] sm:flex ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
            <span>Création assistée par IA</span>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          </div>
        </div>
      </header>
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setCollapsed(false)}
        aria-label="Ouvrir le menu"
        title="Menu"
        className={`fixed top-1.5 left-3 z-[80] flex items-center justify-center rounded-full backdrop-blur transition-all duration-300 ${open ? "opacity-0 pointer-events-none" : ""} ${isLight ? "text-zinc-800 hover:bg-zinc-200/70" : "text-white hover:bg-white/10"} ${collapsed ? "h-9 w-9" : "h-9 gap-1.5 px-3.5"}`}
      >
        <Menu size={17} />
        {!collapsed && <span className="text-[11px] font-medium">Menu</span>}
      </button>
      <AppSidebar open={open} onClose={() => setOpen(false)} pageLabel={pageLabel} />
    </>
  );
}
