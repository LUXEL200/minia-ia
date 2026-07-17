/**
 * Problem Section v2 — PAS Framework (Problem)
 * Asymmetric layout, varied card styles, cyan-primary numbers
 */
import { motion } from "framer-motion";
import { Clock, Timer, Euro } from "lucide-react";

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

          {/* Right — staggered cards */}
          <div className="lg:col-span-8 space-y-6">
            {problems.map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-xl bg-[#18181B] border border-[#27272A] transition-all duration-300 hover:border-[#06B6D4]/30"
                style={{ marginLeft: i === 1 ? "2rem" : "0" }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl font-display font-bold opacity-10" style={{ color: problem.color }}>
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
