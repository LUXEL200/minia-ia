/**
 * Navbar — Neon Noir with Auth Integration
 * Sticky, glassmorphism on scroll, cyan CTA
 * Shows user avatar/menu when logged in
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_LINKS = [
  { href: "/features", label: "Fonctionnalités" },
  { href: "/gallery", label: "Galerie" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09090B]/90 backdrop-blur-xl border-b border-[#27272A]/50"
          : "bg-transparent"
      }`}
    >
      <nav className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-[Space_Grotesk] text-lg font-bold text-white tracking-tight">
            Minia<span className="text-[#06B6D4]">IA</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Area */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#27272A] animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="w-8 h-8 border border-[#27272A]">
                    <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#EC4899] text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-zinc-300 hidden xl:block max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#18181B] border-[#27272A] text-white">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#27272A]" />
                <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={startLogin}
                className="text-zinc-400 hover:text-white hover:bg-white/5 text-sm"
              >
                Connexion
              </Button>
              <Button
                onClick={startLogin}
                className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-semibold text-sm px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
              >
                Essayer gratuitement
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-[#09090B]/95 backdrop-blur-xl border-b border-[#27272A] px-6 py-6 space-y-3"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-zinc-300 hover:text-white py-1.5 text-sm"
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-4 border-t border-[#27272A]">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-[#06B6D4] font-medium py-1.5 text-sm">
                  Dashboard
                </Link>
                <Button variant="outline" onClick={() => { logout(); setMobileOpen(false); }} className="border-[#27272A] text-zinc-400 text-sm w-full justify-start">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => { startLogin(); setMobileOpen(false); }}
                className="w-full bg-[#06B6D4] text-black font-semibold mt-4 text-sm"
              >
                Essayer gratuitement
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
