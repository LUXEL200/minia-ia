/**
 * Testimonials Section v3
 * Enhanced animations and hover effects on testimonial cards
 */
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import AnimatedSection, { StaggeredContainer, StaggeredItem } from "@/components/AnimatedSection";

const testimonials = [
  {
    name: "Thomas R.",
    role: "YouTuber Tech • 250K abonnés",
    avatar: "T",
    quote: "Avant Minia IA, je galérais 2h par miniature. Maintenant c'est fait en 30 secondes et le CTR a augmenté de 40%. C'est fou.",
    accent: "#06B6D4",
  },
  {
    name: "Sarah M.",
    role: "Agente de contenu • 12 chaînes gérées",
    avatar: "S",
    quote: "Je gère 12 chaînes YouTube et Minia IA m'a sauvé la vie. Plus besoin de coordinateur pour les miniatures. Tout est automatisé.",
    accent: "#EC4899",
  },
  {
    name: "Lucas P.",
    role: "Podcasteur • 50K abonnés",
    avatar: "L",
    quote: "Le mode Podcast est une tuerie. Je change juste l'invité et la miniature est prête. Cohérence visuelle garantie à chaque épisode.",
    accent: "#06B6D4",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="container">
        <AnimatedSection animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400 mb-4 block">
              / Témoignages
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
              Ils ont <span className="text-cyan-400">arrêté d'attendre</span>.
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
              Ce que les créateurs disent après leur premier mois sur Minia IA.
            </p>
          </div>
        </AnimatedSection>

        <StaggeredContainer staggerDelay={120}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <StaggeredItem key={i}>
                <motion.div
                  className="relative p-6 rounded-[20px] bg-card/70 border border-border transition-all duration-300 hover:border-[#06B6D4]/20"
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                  >
                    <Quote className="w-6 h-6 text-[#27272A] mb-4" />
                  </motion.div>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: testimonial.accent }}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-white">{testimonial.name}</p>
                      <p className="text-xs text-zinc-500">{testimonial.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </StaggeredItem>
            ))}
          </div>
        </StaggeredContainer>
      </div>
    </section>
  );
}
