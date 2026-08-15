/**
 * Process Section v2
 * 3-step horizontal flow with neon accents
 */
import { motion } from "framer-motion";
import { User, Image, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: User,
    title: "Sélectionne ta Person",
    description: "Choisis parmi tes Persons sauvegardées. Upload une fois, réutilise pour toujours.",
    color: "#06B6D4",
  },
  {
    number: "02",
    icon: Image,
    title: "Choisis une inspiration",
    description: "Colle une référence, ajoute tes assets, décris ta vision. Comme briefer un minia maker.",
    color: "#EC4899",
  },
  {
    number: "03",
    icon: Download,
    title: "Génère & Télécharge",
    description: "Obtiens des variations. Choisis la gagnante. Exporte en 4K — en moins de 50s.",
    color: "#22C55E",
  },
];

export default function ProcessSection() {
  return (
    <section id="process" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06B6D4]/2 to-transparent" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-orange-400 mb-4 block">
            / Processus
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            3 étapes. Le même processus que tu{" "}
            <span className="text-orange-400">connais</span>.
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
            Tu donnes des inspirations à ton minia maker ? C'est exactement pareil. Sans l'attente.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Connector arrow */}
                {i < 2 && (
                  <div className="hidden md:flex absolute top-8 right-0 translate-x-1/2 z-10 items-center">
                    <div className="w-8 h-px bg-gradient-to-r from-[#27272A] to-[#06B6D4]/30" />
                  </div>
                )}
                
                <div className="relative p-6 rounded-[20px] bg-card/70 border border-border text-center transition-all duration-300 hover:border-[#06B6D4]/20">
                  <span className="absolute -top-3 left-5 text-3xl font-display font-bold opacity-10" style={{ color: step.color }}>
                    {step.number}
                  </span>
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${step.color}12` }}
                  >
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <h3 className="text-base font-display font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
