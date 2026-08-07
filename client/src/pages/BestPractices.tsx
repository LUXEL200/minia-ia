import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Target, Palette, Type, Eye, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const practices = [
  {
    icon: Target,
    title: "Règle du 3-2-1",
    description: "3 éléments max dans ta miniature : un visage ou sujet, un titre (2-4 mots), un élément graphique (flèche, cercle, emoji). Moins c'est plus.",
    tip: "Les miniatures les plus performantes ont en moyenne 2,4 éléments visibles.",
  },
  {
    icon: Palette,
    title: "Contraste extrême",
    description: "Utilise des contrastes forts entre le fond et le texte. Le jaune sur fond sombre, le blanc sur fond coloré — ce sont les combinaisons les plus lisibles.",
    tip: "Évite le texte gris sur fond sombre : il devient invisible sur mobile.",
  },
  {
    icon: Type,
    title: "Typographie massive",
    description: "Ton titre doit être lisible sur un écran de smartphone à 5cm. Vise au minimum 60pt pour le texte principal. 3-4 mots maximum.",
    tip: "Si tu ne peux pas lire le titre en 1 seconde, il est trop long.",
  },
  {
    icon: Eye,
    title: "Visage expressif",
    description: "Les visages avec des émotions fortes (surprise, joie, choc) augmentent le CTR de 30%. Un œil qui regarde la caméra crée un lien instantané.",
    tip: "Les émotions de surprise fonctionnent mieux que la neutralité (+42% de CTR).",
  },
  {
    icon: Sparkles,
    title: "Couleurs saturées",
    description: "Les couleurs vives et saturées attirent l'œil dans le flux YouTube. Le cyan, le rose, le jaune et le rouge sont les plus performants.",
    tip: "Évite les tons pastel — ils se noient dans le flux vidéo.",
  },
];

export default function BestPractices() {
  return (
    <SubPageLayout>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Bonnes pratiques</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-4xl md:text-5xl font-bold mb-4">
            Crée des miniatures{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              qui cliquent
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Les règles d'or des créateurs qui surpassent la moyenne du CTR YouTube.
          </p>
        </motion.div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {practices.map((practice, index) => (
            <motion.div
              key={practice.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex gap-5 p-6 bg-[#18181B] border border-[#27272A] rounded-xl"
            >
              <div className="shrink-0 w-12 h-12 bg-[#27272A] rounded-xl flex items-center justify-center">
                <practice.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{practice.title}</h3>
                <p className="text-sm text-[#A1A1AA] mb-2">{practice.description}</p>
                <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-400">
                  {practice.tip}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-8 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-2">Mets ces règles en pratique</h3>
          <p className="text-[#A1A1AA] mb-4">Génère des miniatures optimisées en un clic avec Minia IA.</p>
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
              Ouvrir le générateur
              <ArrowRight className="w-4 h-4" />
            </a>
          </Link>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
