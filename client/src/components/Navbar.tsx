/**
 * Navbar — Neon Noir
 * Sticky, glassmorphism on scroll, cyan CTA
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09090B]/90 backdrop-blur-xl border-b border-[#27272A]/50"
          : "bg-transparent"
      }`}
    >
      <nav className="container flex items-center justify-between h-16 lg:h-18">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white tracking-tight">
            Minia<span className="text-[#06B6D4]">IA</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "Fonctionnalités", id: "features" },
            { label: "Comment ça marche", id: "process" },
            { label: "Tarifs", id: "pricing" },
            { label: "FAQ", id: "faq" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-white/5 text-sm"
          >
            Connexion
          </Button>
          <Button
            className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-semibold text-sm px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
          >
            Essayer gratuitement
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#09090B]/95 backdrop-blur-xl border-b border-[#27272A] px-6 py-6 space-y-4"
        >
          {[
            { label: "Fonctionnalités", id: "features" },
            { label: "Comment ça marche", id: "process" },
            { label: "Tarifs", id: "pricing" },
            { label: "FAQ", id: "faq" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="block w-full text-left text-zinc-300 hover:text-white py-2"
            >
              {item.label}
            </button>
          ))}
          <Button className="w-full bg-[#06B6D4] text-black font-semibold mt-4">
            Essayer gratuitement
          </Button>
        </motion.div>
      )}
    </header>
  );
}
