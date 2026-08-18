/**
 * Hero Section — Midnight Studio V17
 * Style inspiré youthumb.ai : badge compteur en haut, H1 percutant avec accent
 * script orange, CTA duels, maquette produit animée avec glow et cascade de miniatures
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Sparkles, Clock, Zap, X, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { useActionEffect } from "@/components/ActionEffects";
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
  const { triggerFlash } = useActionEffect();

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

  const [heroCollapsed, setHeroCollapsed] = useState(false);

  const miniVariants = [
    { src: "/manus-storage/thumbnail-mrbeast_fc8fbcd3.png", alt: "Style viral" },
    { src: "/manus-storage/thumbnail-tech_81d69968.png", alt: "Tech review" },
    { src: "/manus-storage/thumbnail-dramatic_1e94decd.png", alt: "Dramatique" },
  ];

  const productDemo = (
    <div className="relative w-full">
      {/* Glow orange autour de la maquette */}
      <div className="absolute -inset-4 bg-orange-400/8 rounded-[2rem] blur-3xl pointer-events-none" />
      {/* Frame produit — style app.youthumb.ai */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: heroCollapsed ? 1 : 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className={`relative rounded-2xl border border-orange-400/25 bg-card/95 backdrop-blur shadow-2xl shadow-orange-400/15 overflow-hidden transition-all duration-500 ${
          heroCollapsed ? "max-h-16" : ""
        }`}
      >
        {/* Barre navigateur */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-secondary/80">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400/20" />
          </div>
          <div className="flex-1 text-center text-[11px] text-muted-foreground font-mono">
            app.minia.ai / create
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHeroCollapsed(v => !v)}
              className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
              aria-label={heroCollapsed ? "Agrandir la démo" : "Réduire la démo"}
            >
              {heroCollapsed ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setHeroCollapsed(true)}
              className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
              aria-label="Fermer la démo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Rangée de miniatures avec cascade */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {miniVariants.map((m, i) => (
              <motion.div
                key={m.src}
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={heroCollapsed ? { opacity: 0, y: 20, scale: 0.92 } : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.15, ease: [0.23, 1, 0.32, 1] }}
                className={`rounded-lg overflow-hidden border border-border shadow-lg relative group ${
                  i === 0 ? "col-span-2 row-span-1" : ""
                }`}
                style={{ rotate: `${i % 2 === 0 ? -1.5 : 1.5}deg` }}
              >
                <img src={m.src} alt={m.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {i === 0 && (
                  <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-400/90 text-black text-[10px] font-bold">
                    <Zap className="w-2.5 h-2.5" /> Prête
                  </div>
                )}
              </motion.div>
            ))}
            {/* Carte en cours de génération (placeholder pulsant) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={heroCollapsed ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="relative rounded-lg overflow-hidden border border-dashed border-orange-400/40 bg-accent/50 flex flex-col items-center justify-center gap-1.5 aspect-video"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent"
              />
              <span className="text-[10px] text-muted-foreground">Génération…</span>
            </motion.div>
          </div>
          {/* Bandeau statut */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={heroCollapsed ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="mt-4 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              4 miniatures générées en 2,4 secondes
            </div>
            <Button
              size="sm"
              className="bg-orange-400 hover:bg-orange-500 text-black font-bold text-xs rounded-full px-4"
              onClick={() => {
                triggerFlash();
                setHeroCollapsed(true);
                setTimeout(() => setHeroCollapsed(false), 900);
              }}
            >
              Télécharger
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

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
        className="absolute -top-20 -right-40 w-[500px] h-[500px] bg-[#F97316]/8 rounded-full blur-3xl"
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
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F97316] to-[#EC4899] border-2 border-background flex items-center justify-center text-[10px] text-white font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </motion.div>
                ))}
              </div>
              <span className="text-sm text-zinc-300">
                <span className="text-[#F97316] font-bold"><AnimatedCounter target={14589} suffix="+" /></span>
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
                  className="bg-gradient-to-r from-orange-400 to-orange-300 hover:from-cyan-400 hover:to-violet-400 text-black font-bold text-base px-8 py-6 rounded-full glow-btn group"
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

          {/* Right — product mock animation (youthumb style) */}
          <div className="lg:col-span-5">
            <AnimatedSection animation="slide-in-right" delay={0.4} className="w-full">
              {productDemo}
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
