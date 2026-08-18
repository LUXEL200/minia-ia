/**
 * Podcast Mode Section v2
 * Asymmetric layout with overlapped visual elements
 */
import { motion } from "framer-motion";
import { Mic, ArrowRight } from "lucide-react";

export default function PodcastSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#F97316]/3 via-transparent to-[#EC4899]/3" />
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Visual — left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-[#F97316]/10 to-[#EC4899]/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-xl overflow-hidden border border-[#F97316]/20">
              <img
                src="/manus-storage/podcast-mode_1da952ca.png"
                alt="Mode Podcast Minia IA"
                className="w-full"
              />
            </div>
          </motion.div>

          {/* Text — right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 lg:pl-8"
          >
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#EC4899] mb-4 block">
              / Mode Podcast
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground leading-tight mb-6">
              Même identité. Nouveau visage.{" "}
              <span className="text-[#F97316]">À chaque épisode.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg">
              Verrouillez l'identité visuelle de votre podcast une seule fois. Pour chaque nouvel épisode, changez juste l'invité — votre style reste cohérent, à chaque fois.
            </p>
            
            {/* Episode sequence */}
            <div className="flex items-center gap-4">
              {["EP1", "EP2", "EP3", "EP4"].map((ep, i) => (
                <div key={ep} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-xs font-bold text-[#F97316] font-mono">
                    {ep}
                  </div>
                  {i < 3 && <ArrowRight className="w-4 h-4 text-border" />}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
