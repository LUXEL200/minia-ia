/**
 * Solution Section v2 — PAS Framework (Solution)
 * App mockup + asymmetric feature grid with neon frame styling
 */
import { motion } from "framer-motion";
import { User, Link, BarChart3, Zap } from "lucide-react";

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
          className="text-center mb-16"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#06B6D4] mb-4 block">
            / La Solution
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Ton Minia Maker IA <span className="text-[#06B6D4]">personnel</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
            Moins de 3 minutes pour générer une miniature qui te ressemble.
          </p>
        </motion.div>

        {/* App mockup with neon frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#06B6D4]/20 to-[#EC4899]/20 rounded-2xl blur-xl" />
            <div className="relative rounded-xl overflow-hidden border border-[#06B6D4]/20 bg-[#18181B]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272A]">
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

        {/* Asymmetric feature grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group p-5 rounded-xl border border-[#27272A] bg-[#18181B] transition-all duration-300 hover:border-[#06B6D4]/30 ${
                i % 2 === 1 ? "lg:mt-6" : ""
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
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
          ))}
        </div>
      </div>
    </section>
  );
}
