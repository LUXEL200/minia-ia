/**
 * Hero Section — Neon Noir v2
 * Asymmetric layout, brutal typography, kinetic energy
 * Cyan primary, pink secondary accent discipline
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star } from "lucide-react";
import { useState, useEffect } from "react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString("fr-FR")}{suffix}</span>;
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      
      {/* Asymmetric gradient orbs */}
      <div className="absolute -top-20 -right-40 w-[500px] h-[500px] bg-[#06B6D4]/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-[#EC4899]/6 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left content — asymmetric offset */}
          <div className="lg:col-span-7 lg:pl-4">
            {/* Social proof badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#27272A] bg-[#18181B]/80 backdrop-blur-sm mb-10"
            >
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] border-2 border-[#09090B] flex items-center justify-center text-[10px] text-white font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span className="text-sm text-zinc-300">
                <span className="text-[#06B6D4] font-bold"><AnimatedCounter target={14589} suffix="+" /></span>
                {" "}miniatures IA générées
              </span>
            </motion.div>

            {/* Brutal headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[4.5rem] font-display font-bold leading-[0.95] tracking-tight mb-6"
            >
              <span className="text-white">Ton designer</span>
              <br />
              <span className="text-white">prend des jours.</span>
              <br />
              <span className="bg-gradient-to-r from-[#06B6D4] to-[#06B6D4] bg-clip-text text-transparent">Tes miniatures</span>
              <br />
              <span className="bg-gradient-to-r from-[#06B6D4] via-[#EC4899] to-[#EC4899] bg-clip-text text-transparent">prennent 30s.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-zinc-400 max-w-lg mb-8 leading-relaxed"
            >
              Génère jusqu'à <span className="text-white font-medium">4 miniatures virales</span> en quelques secondes. 
              Sans freelance. Sans délais. Sans dépendance.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-6"
            >
              <Button
                size="lg"
                className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-bold text-base px-8 py-6 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-lg shadow-[#06B6D4]/25"
              >
                Essayer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-white/5 text-base px-8 py-6 rounded-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Voir des exemples
              </Button>
            </motion.div>

            {/* FUD reduction + Rating */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <p className="text-sm text-zinc-500">
                Sans carte bancaire • 5 miniatures gratuites
              </p>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                  ))}
                </div>
                <span className="text-xs text-zinc-500">4.9/5 par 2,847 créateurs</span>
              </div>
            </motion.div>
          </div>

          {/* Right — thumbnail stack (overlapping, asymmetric) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:col-span-5 lg:flex relative"
          >
            <div className="relative w-full">
              {/* Main thumbnail */}
              <div className="relative rounded-xl overflow-hidden border-2 border-[#06B6D4]/30 shadow-2xl shadow-[#06B6D4]/10 z-10">
                <img
                  src="/manus-storage/thumbnail-mrbeast_fc8fbcd3.png"
                  alt="Miniature virale"
                  className="w-full"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded bg-[#06B6D4] text-black text-xs font-bold">
                  30s de génération
                </div>
              </div>
              {/* Secondary thumbnail — offset */}
              <div className="absolute -bottom-8 -left-8 w-48 rounded-lg overflow-hidden border border-[#27272A] shadow-xl z-20 rotate-[-6deg]">
                <img
                  src="/manus-storage/thumbnail-tech_81d69968.png"
                  alt="Tech review"
                  className="w-full"
                />
              </div>
              {/* Tertiary — offset other side */}
              <div className="absolute -bottom-4 -right-4 w-44 rounded-lg overflow-hidden border border-[#EC4899]/30 shadow-xl z-20 rotate-[4deg]">
                <img
                  src="/manus-storage/thumbnail-dramatic_1e94decd.png"
                  alt="Dramatique"
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
