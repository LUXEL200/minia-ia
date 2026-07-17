/**
 * Founder Section v2
 * Storytelling with clean typography and cyan accent
 */
import { motion } from "framer-motion";
import { Youtube } from "lucide-react";

export default function FounderSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#EC4899] mb-8 block">
            / Créateur
          </span>
          
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight mb-10">
            J'avais le même problème.{" "}
            <span className="text-[#06B6D4]">Alors j'ai créé la solution.</span>
          </h2>

          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#06B6D4]/30">
              <img
                src="/manus-storage/founder-avatar_acaa8037.png"
                alt="Fondateur Minia IA"
                className="w-full h-full object-cover"
              />
            </div>
            
            <blockquote className="text-lg sm:text-xl text-zinc-300 leading-relaxed max-w-xl font-light">
              "Je suis YouTubeur. Je payais un minia maker. Les allers-retours me tuaient. Alors j'ai créé l'outil que j'aurais voulu avoir — et je l'utilise chaque semaine pour ma propre chaîne."
            </blockquote>

            <div className="flex items-center gap-4 mt-2">
              <div className="text-right">
                <p className="text-white font-medium text-sm">Mike Codeur</p>
                <p className="text-xs text-zinc-500">Fondateur de Minia IA</p>
              </div>
              <div className="h-8 w-px bg-[#27272A]" />
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Youtube className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Chaîne YouTube</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
