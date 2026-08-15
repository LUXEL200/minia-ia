/**
 * Features Detail Section v3
 * Alternating left/right feature rows with neon accents
 * Enhanced scroll animations and hover effects
 */
import { motion } from "framer-motion";
import { User, Link2, Zap, Edit3, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const features = [
  {
    icon: User,
    badge: "SYSTÈME PERSON",
    title: "Configure une fois. Utilise pour toujours.",
    description: "Ajoute quelques photos, décris ton look — lunettes, barbe, casquette, tout ce qui te caractérise. L'IA enregistre ta ressemblance et l'utilise pour chaque future miniature.",
    color: "#06B6D4",
  },
  {
    icon: Link2,
    badge: "BRIEF IA",
    title: "Briefe comme un minia maker.",
    description: "Colle n'importe quel lien YouTube — on récupère la miniature et on analyse le style pour toi. Sauvegarde-les dans ta bibliothèque et réutilise-les à volonté.",
    color: "#EC4899",
  },
  {
    icon: Zap,
    badge: "VITESSE",
    title: "De jours à secondes.",
    description: "Génère jusqu'à 4 variations de miniatures en moins de 30 secondes. Pas de brief à écrire. Pas de boucle de feedback. Pas d'attente de 48h.",
    color: "#06B6D4",
  },
  {
    icon: Edit3,
    badge: "ITÉRATION",
    title: "Ajuste, ne recommence pas.",
    description: "Presque parfait ? Itère sur ce que tu as. Ajuste la vibe, peaufine les détails — sans regénérer de zéro. Pas de crédits gaspillés.",
    color: "#EC4899",
  },
  {
    icon: Sparkles,
    badge: "FINITIONS",
    title: "Finitions intégrées.",
    description: "Ajoute un éclairage studio, du texte néon, des effets de glow — les trucs que les YouTubeurs font tout le temps. Pré-construits, en un clic.",
    color: "#06B6D4",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="container">
        <AnimatedSection animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400 mb-4 block">
              / Fonctionnalités
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
              Conçu pour les{" "}
              <span className="text-cyan-400">créateurs</span>.
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
              Puissant là où ça compte. Simple partout ailleurs.
            </p>
          </div>
        </AnimatedSection>

        <div className="max-w-5xl mx-auto space-y-4">
          {features.map((feature, i) => (
            <AnimatedSection
              key={i}
              animation={i % 2 === 0 ? "slide-in-left" : "slide-in-right"}
              delay={i * 0.06}
            >
              <motion.div
                className={`group flex flex-col sm:flex-row gap-5 p-6 rounded-[20px] bg-card/70 border border-border card-hover hover:border-[#06B6D4]/20 ${
                  i % 2 === 1 ? "sm:flex-row-reverse" : ""
                }`}
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: `${feature.color}12` }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1 block" style={{ color: feature.color }}>
                    {feature.badge}
                  </span>
                  <h3 className="text-lg font-display font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
