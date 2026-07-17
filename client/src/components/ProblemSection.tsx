/**
 * Problem Section v3 — PAS Framework (Problem)
 * Enhanced scroll animations with staggered reveals and hover effects
 */
import { motion } from "framer-motion";
import { Clock, Timer, Euro } from "lucide-react";
import { StaggeredContainer, StaggeredItem } from "@/components/AnimatedSection";

const problems = [
  {
    icon: Clock,
    title: "2 heures sur Canva",
    subtitle: "pour un résultat médiocre",
    description: "Tu passes plus de temps sur les visuels que sur le contenu. Tu es créateur, pas designer.",
    number: "01",
    color: "#06B6D4",
  },
  {
    icon: Timer,
    title: "24-48h d'attente",
    subtitle: "pour un freelance",
    description: "Ton planning dépend de la disponibilité de quelqu'un d'autre. Révisions, ajustements, encore des révisions...",
    number: "02",
    color: "#EC4899",
  },
  {
    icon: Euro,
    title: "25-30€ par miniature",
    subtitle: "ça s'accumule vite",
    description: "Une miniature par semaine = 100€+/mois minimum. Et ce n'est pas toujours au niveau des grosses chaînes.",
    number: "03",
    color: "#06B6D4",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left — sticky heading */}
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#EC4899] mb-4 block">
                / Le Problème
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white leading-tight">
                Ta miniature ne devrait{" "}
                <span className="text-[#06B6D4]">pas te freiner.</span>
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                Que tu paies un freelance ou que tu galères sur Canva, le résultat est le même : ta miniature te ralentit.
              </p>
            </motion.div>
          </div>

          {/* Right — staggered cards with hover effects */}
          <StaggeredContainer staggerDelay={100}>
            <div className="lg:col-span-8 space-y-6">
              {problems.map((problem, i) => (
                <StaggeredItem key={i}>
                  <motion.div
                    className={`group relative p-6 rounded-xl bg-[#18181B] border border-[#27272A] card-hover hover:border-[#06B6D4]/30`}
                    style={{ marginLeft: i === 1 ? "2rem" : "0" }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl font-display font-bold opacity-10 group-hover:opacity-20 transition-opacity" style={{ color: problem.color }}>
                        {problem.number}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <problem.icon className="w-4 h-4" style={{ color: problem.color }} />
                          <span className="text-sm font-mono uppercase tracking-wider" style={{ color: problem.color }}>
                            {problem.subtitle}
                          </span>
                        </div>
                        <h3 className="text-xl font-display font-bold text-white mb-2">
                          {problem.title}
                        </h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {problem.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </StaggeredItem>
              ))}
            </div>
          </StaggeredContainer>
        </div>
      </div>
    </section>
  );
}
