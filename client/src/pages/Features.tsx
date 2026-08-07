import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Zap, Layers, Palette, Clock, Users, Shield, Brain, Gauge } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Génération en 30 secondes",
    description: "L'IA analyse ta description et produit des miniatures optimisées pour le clic en moins d'une minute. Pas de file d'attente, pas de freelancer à attendre.",
    color: "from-cyan-400 to-cyan-600",
  },
  {
    icon: Layers,
    title: "Génération parallèle",
    description: "Jusqu'à 4 variantes d'un coup. Compare les styles, choisis la meilleure, télécharge. Tout en un seul workflow.",
    color: "from-pink-400 to-pink-600",
  },
  {
    icon: Palette,
    title: "6 styles professionnels",
    description: "Viral, MrBeast, Minimaliste, Dramatique, Tech, Retro. Chaque style est optimisé pour les algorithmes YouTube.",
    color: "from-purple-400 to-purple-600",
  },
  {
    icon: Clock,
    title: "Mode Podcast",
    description: "Génère des miniatures podcast-ready avec des portraits, des noms d'invités et des citations percutantes.",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    icon: Brain,
    title: "Système Person",
    description: "Entraîne l'IA sur ton identité visuelle. Couleurs, police, logo — ta marque reste cohérente sur toutes tes miniatures.",
    color: "from-orange-400 to-orange-600",
  },
  {
    icon: Shield,
    title: "Sécurisé et privé",
    description: "Tes prompts et images ne sont jamais partagés. Chaque utilisateur ne voit que ses propres miniatures.",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: Users,
    title: "Interface équipe",
    description: "Collabore avec ton graphiste, valide les propositions, refuse ou supprime en un clic. Workflow complet.",
    color: "from-rose-400 to-rose-600",
  },
  {
    icon: Gauge,
    title: "Analytics intégrés",
    description: "Suis ton taux de clic, compare les performances de tes miniatures et optimise ta stratégie de contenu.",
    color: "from-teal-400 to-teal-600",
  },
];

export default function Features() {
  return (
    <SubPageLayout>
      <div className="container">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Toutes les fonctionnalités</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-4xl md:text-5xl font-bold mb-4">
            Tout ce qu'il faut pour{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              performer
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Minia IA regroupe les outils essentiels pour créer des miniatures YouTube professionnelles à la vitesse de l'éclair.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group p-6 bg-[#18181B] border border-[#27272A] rounded-xl hover:border-cyan-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SubPageLayout>
  );
}
