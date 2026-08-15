import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Eye, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const examples = [
  {
    category: "Gaming",
    before: "Miniature amateur — fond flou, texte illisible, pas de sujet clair",
    after: "Miniature Minia IA — personnage centré, titre en 3 mots, couleurs saturées, CTR +45%",
    result: "+45% CTR",
  },
  {
    category: "Tech Review",
    before: "Photo produit sur fond blanc, aucun accroche visuelle",
    after: "Produit en lumière dramatique, titre accrocheur, style tech premium",
    result: "+32% CTR",
  },
  {
    category: "Lifestyle",
    before: "Selfie flou, pas de texte, couleurs ternes",
    after: "Portrait net, titre percutant, couleurs chaudes, composition soignée",
    result: "+38% CTR",
  },
  {
    category: "Podcast",
    before: "Capture d'écran Zoom, pas de branding",
    after: "Portrait invité, nom en gros, citation percutante, style podcast pro",
    result: "+52% CTR",
  },
  {
    category: "Éducation",
    before: "Slide PowerPoint copié en miniature",
    after: "Concept illustré, titre choc, couleurs éducatives, layout clair",
    result: "+28% CTR",
  },
  {
    category: "Finance",
    before: "Graphique boursier illisible",
    after: "Chiffre clé en gros, visage expert, fond sombre premium",
    result: "+41% CTR",
  },
];

export default function Examples() {
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
            <Eye className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-[#A1A1AA]">Avant / Après</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Les résultats{" "}
            <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              parlent d'eux-mêmes
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Avant Minia IA vs Après. Chaque créateur voit une amélioration significative de son CTR.
          </p>
        </motion.div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {examples.map((example, index) => (
            <motion.div
              key={example.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 hover:border-orange-400/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{example.category}</h3>
                <span className="px-3 py-1 bg-cyan-500/10 border border-orange-400/20 rounded text-sm font-bold text-orange-400">
                  {example.result}
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <span className="text-xs text-red-400 font-medium mb-1 block">AVANT</span>
                  <p className="text-sm text-[#A1A1AA]">{example.before}</p>
                </div>
                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                  <span className="text-xs text-orange-400 font-medium mb-1 block">APRÈS MINIA IA</span>
                  <p className="text-sm text-[#A1A1AA]">{example.after}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-8 bg-[#18181B] border border-[#27272A] rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-2">Explore la galerie communautaire</h3>
          <p className="text-[#A1A1AA] mb-4">Des milliers de miniatures générées par des créateurs comme toi.</p>
          <Link href="/gallery" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
            
              Voir la galerie
              <ArrowRight className="w-4 h-4" />
            
          </Link>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
