/**
 * Parallel Generation Section v3
 * Enhanced speed comparison with animated progress bars and hover effects
 */
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

export default function ParallelSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="container">
        {/* Section heading */}
        <AnimatedSection animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#06B6D4] mb-4 block">
              / Génération Parallèle
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
              N'attendez plus.{" "}
              <span className="text-[#06B6D4]">Générez en parallèle.</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
              Les autres outils génèrent les miniatures une par une. Minia IA les lance toutes simultanément — 4 miniatures en le temps qu'il faut aux autres pour en faire une.
            </p>
          </div>
        </AnimatedSection>

        {/* Speed comparison — side by side */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8"
        >
          {/* Competitors — slow */}
          <motion.div
            className="p-8 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#27272A] transition-colors duration-300"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Les autres outils</span>
            </div>
            <div className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-500">Miniature {i}</span>
                    <span className="text-sm text-zinc-500 font-mono">~40s</span>
                  </div>
                  <div className="h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.2, ease: [0.77, 0, 0.175, 1] }}
                      className="h-full bg-zinc-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-[#27272A]">
              <p className="text-2xl font-display font-bold text-zinc-500">
                ~160<span className="text-sm text-zinc-600 ml-1">secondes</span>
              </p>
            </div>
          </motion.div>

          {/* Minia IA — fast */}
          <motion.div
            className="p-8 rounded-xl bg-[#18181B] border border-[#06B6D4]/30 relative overflow-hidden transition-all duration-300 hover:border-[#06B6D4]/50 hover:shadow-lg hover:shadow-[#06B6D4]/10"
            whileHover={{ y: -2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#06B6D4]/5 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-5 h-5 text-[#06B6D4]" />
                <span className="text-sm font-medium text-[#06B6D4] uppercase tracking-wider">Minia IA</span>
                <motion.span
                  className="ml-auto text-xs bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 rounded font-bold"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  5x
                </motion.span>
              </div>
              <div className="space-y-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">Miniature {i}</span>
                      <span className="text-sm text-[#06B6D4] font-mono font-bold">simultané</span>
                    </div>
                    <div className="h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.5, ease: [0.77, 0, 0.175, 1] }}
                        className="h-full bg-[#06B6D4] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-[#06B6D4]/20">
                <p className="text-2xl font-display font-bold text-[#06B6D4]">
                  ~30<span className="text-sm text-[#06B6D4]/60 ml-1">secondes</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
