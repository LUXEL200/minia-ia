/**
 * Features Detail Section v2
 * Alternating left/right feature rows with neon accents
 * Cyan primary for key elements, pink for secondary
 */
import { motion } from "framer-motion";
import { User, Link2, Zap, Edit3, Sparkles } from "lucide-react";

const features = [
  {
    icon: User,
    badge: "SYSTÈME PERSON",
    title: "Configure une fois. Utilise pour toujours.",
    description: "Ajoute quelques photos, décris ton look — lunettes, barbe, casquette, tout ce qui te caractérise. L'IA enregistre ta ressemblance et l'utilise pour chaque future miniature. Pas de re-upload. Pas de faceswap manuel. Ça marche, tout simplement.",
    color: "#06B6D4",
  },
  {
    icon: Link2,
    badge: "BRIEF IA",
    title: "Briefe comme un minia maker.",
    description: "Colle n'importe quel lien YouTube — on récupère la miniature et on analyse le style pour toi. Ou uploade tes propres références. Sauvegarde-les dans ta bibliothèque et réutilise-les à volonté. Le même workflow qu'avec un minia maker, résultats instantanés.",
    color: "#EC4899",
  },
  {
    icon: Zap,
    badge: "VITESSE",
    title: "De jours à secondes.",
    description: "Génère jusqu'à 4 variations de miniatures en moins de 30 secondes. Pas de brief à écrire. Pas de boucle de feedback. Pas d'attente de 48h. Juste clic, génère, télécharge.",
    color: "#06B6D4",
  },
  {
    icon: Edit3,
    badge: "ITÉRATION",
    title: "Ajuste, ne recommence pas.",
    description: "Presque parfait ? Itère sur ce que tu as. Ajuste la vibe, peaufine les détails — sans regénérer de zéro. Pas de crédits gaspillés. Pas de recommencement. Juste affine jusqu'à ce que ce soit parfait.",
    color: "#EC4899",
  },
  {
    icon: Sparkles,
    badge: "FINITIONS",
    title: "Finitions intégrées.",
    description: "Ajoute un éclairage studio, du texte néon, des effets de glow — les trucs que les YouTubeurs font tout le temps. Pré-construits, en un clic. Pas besoin d'écrire des prompts complexes. Les finitions sont intégrées.",
    color: "#06B6D4",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#06B6D4] mb-4 block">
            / Fonctionnalités
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Conçu pour les{" "}
            <span className="text-[#06B6D4]">créateurs</span>.
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
            Puissant là où ça compte. Simple partout ailleurs.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`group flex flex-col sm:flex-row gap-5 p-6 rounded-xl bg-[#18181B] border border-[#27272A] transition-all duration-300 hover:border-[#06B6D4]/20 ${
                i % 2 === 1 ? "sm:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
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
          ))}
        </div>
      </div>
    </section>
  );
}
