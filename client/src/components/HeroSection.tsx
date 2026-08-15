/**
 * Hero Section — Neon Noir v3
 * Enhanced scroll animations, hover effects, parallax elements
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star } from "lucide-react";
import { useState, useEffect } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

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
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleCTAClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      startLogin();
    }
  };

  const handleExamplesClick = () => {
    navigate("/gallery");
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
      {/* Background dots — Cinematic Studio */}
      <motion.div
        className="absolute inset-0 grid-dots opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Asymmetric gradient orbs — floating */}
      <motion.div
        className="absolute -top-20 -right-40 w-[500px] h-[500px] bg-[#06B6D4]/8 rounded-full blur-3xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-[#EC4899]/6 rounded-full blur-3xl"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left content — asymmetric offset */}
          <div className="lg:col-span-7 lg:pl-4">
            {/* Social proof badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/70 backdrop-blur-sm mb-10 hover:border-primary/30 transition-all duration-300 shadow-sm"
            >
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 300 }}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] border-2 border-[#09090B] flex items-center justify-center text-[10px] text-white font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </motion.div>
                ))}
              </div>
              <span className="text-sm text-zinc-300">
                <span className="text-[#06B6D4] font-bold"><AnimatedCounter target={14589} suffix="+" /></span>
                {" "}miniatures IA générées
              </span>
            </motion.div>

            {/* Brutal headline */}
            <AnimatedSection animation="fade-up" delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-display font-extrabold leading-[1.02] tracking-[-0.02em] mb-6">
                <span className="text-white">Ton designer</span>
                <br />
                <span className="text-white">prend des jours.</span>
                <br />
                <span className="gradient-text">Tes miniatures</span>
                <br />
                <span className="gradient-text">prennent 30s.</span>
              </h1>
            </AnimatedSection>

            {/* Subheadline */}
            <AnimatedSection animation="fade-up" delay={0.2}>
              <p className="text-lg text-zinc-400 max-w-lg mb-8 leading-relaxed">
                Génère jusqu'à <span className="text-white font-medium">4 miniatures virales</span> en quelques secondes. 
                Sans freelance. Sans délais. Sans dépendance.
              </p>
            </AnimatedSection>

            {/* CTAs */}
            <AnimatedSection animation="fade-up" delay={0.3}>
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <Button
                  size="lg"
                  onClick={handleCTAClick}
                  className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-black font-bold text-base px-8 py-6 rounded-full glow-btn group"
                >
                  Essayer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleExamplesClick}
                  className="glass text-zinc-200 hover:text-white text-base px-8 py-6 rounded-full magnetic-btn"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Voir des exemples
                </Button>
              </div>
            </AnimatedSection>

            {/* FUD reduction + Rating */}
            <AnimatedSection animation="fade-up" delay={0.4}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
              </div>
            </AnimatedSection>
          </div>

          {/* Right — thumbnail stack (overlapping, asymmetric) with hover effects */}
          <AnimatedSection animation="slide-in-right" delay={0.4}>
            <div className="hidden lg:col-span-5 lg:flex relative">
              <div className="relative w-full">
                {/* Main thumbnail */}
                <div className="relative rounded-[20px] overflow-hidden border-2 border-primary/25 shadow-2xl shadow-cyan-500/10 z-10 hover-tilt feature-edge">
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
                <div className="absolute -bottom-8 -left-8 w-48 rounded-lg overflow-hidden border border-[#27272A] shadow-xl z-20 rotate-[-6deg] hover-tilt transition-all duration-300 hover:rotate-0 hover:scale-105">
                  <img
                    src="/manus-storage/thumbnail-tech_81d69968.png"
                    alt="Tech review"
                    className="w-full"
                  />
                </div>
                {/* Tertiary — offset other side */}
                <div className="absolute -bottom-4 -right-4 w-44 rounded-lg overflow-hidden border border-[#EC4899]/30 shadow-xl z-20 rotate-[4deg] hover-tilt transition-all duration-300 hover:rotate-0 hover:scale-105">
                  <img
                    src="/manus-storage/thumbnail-dramatic_1e94decd.png"
                    alt="Dramatique"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
