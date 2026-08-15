/**
 * Solution Section v3 — PAS Framework (Solution)
 * Enhanced animations, staggered grid, hover effects
 */
import { motion } from "framer-motion";
import { User, Link, BarChart3, Zap } from "lucide-react";
import { StaggeredContainer, StaggeredItem } from "@/components/AnimatedSection";

const features = [
  {
    icon: User,
    title: "Ton visage. Enregistré.",
    description: "Configure une fois. Utilise pour toujours.",
    color: "#06B6D4",
  },
  {
    icon: Link,
    title: "Colle une vibe.",
    description: "L'IA fait le reste.",
    color: "#EC4899",
  },
  {
    icon: BarChart3,
    title: "A/B testing.",
    description: "Génère, compare, choisis.",
    color: "#22C55E",
  },
  {
    icon: Zap,
    title: "De jours à secondes.",
    description: "48h → 30s avec Minia IA.",
    color: "#06B6D4",
  },
];

export default function SolutionSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#06B6D4]/3 to-transparent pointer-events-none" />
      
      <div className="container relative z-10">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-orange-400 mb-4 block">
            / La Solution
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Ton Minia Maker IA <span className="text-orange-400">personnel</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
            Moins de 3 minutes pour générer une miniature qui te ressemble.
          </p>
        </motion.div>

        {/* App mockup with neon frame */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="relative group">
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-[#06B6D4]/20 to-[#EC4899]/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative rounded-[20px] overflow-hidden border border-[#06B6D4]/20 bg-card/70 transition-all duration-500 group-hover:border-[#06B6D4]/40 group-hover:shadow-xl group-hover:shadow-[#06B6D4]/10">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <div className="w-3 h-3 rounded-full bg-[#FBBF24]" />
                <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                <span className="ml-4 text-xs text-zinc-500 font-mono">app.minia-ia.com</span>
              </div>
              <img
                src="/manus-storage/app-mockup_9e06d805.png"
                alt="Interface Minia IA"
                className="w-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Staggered feature grid */}
        <StaggeredContainer staggerDelay={80}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <StaggeredItem key={i}>
                <motion.div
                  className={`group p-5 rounded-[20px] border border-border bg-card/70 card-hover hover:border-[#06B6D4]/30 ${
                    i % 2 === 1 ? "lg:mt-6" : ""
                  }`}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-sm font-display font-bold text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </StaggeredItem>
            ))}
          </div>
        </StaggeredContainer>
      </div>
    </section>
  );
}
