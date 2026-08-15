import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Brain, Zap, Clock } from "lucide-react";

const models = [
  {
    name: "Minia v3 — Turbo",
    type: "Image Generation",
    speed: "~3s/image",
    quality: "Haute",
    description: "Notre modèle phare. Optimisé spécifiquement pour les miniatures YouTube avec un focus sur le CTR. Génère des images 1280x720 prêtes à l'emploi.",
    bestFor: ["Gaming", "Vlog", "Challenges"],
    status: "active",
  },
  {
    name: "Minia v3 — Creative",
    type: "Image Generation",
    speed: "~5s/image",
    quality: "Très haute",
    description: "Modèle créatif avec plus de liberté artistique. Idéal pour les niches lifestyle, beauté et mode où l'esthétique prime.",
    bestFor: ["Lifestyle", "Beauté", "Mode"],
    status: "active",
  },
  {
    name: "Minia v3 — Dramatic",
    type: "Image Generation",
    speed: "~4s/image",
    quality: "Haute",
    description: "Spécialisé dans les contrastes forts, l'éclairage dramatique et les compositions cinématiques. Pour le storytelling.",
    bestFor: ["Storytelling", "Documentaire", "Horreur"],
    status: "active",
  },
  {
    name: "Minia v3 — Tech",
    type: "Image Generation",
    speed: "~3s/image",
    quality: "Haute",
    description: "Optimisé pour les produits tech, gadgets et reviews. Rendu photoréaliste avec un style épuré et professionnel.",
    bestFor: ["Tech", "Unboxing", "Reviews"],
    status: "active",
  },
];

export default function Models() {
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
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Modèles IA</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Nos{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              modèles IA
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Chaque modèle est spécialisé pour un type de contenu et optimisé pour le CTR YouTube.
          </p>
        </motion.div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {models.map((model, index) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{model.name}</h3>
                  <p className="text-sm text-[#71717A]">{model.type}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400">
                  Actif
                </span>
              </div>
              <p className="text-sm text-[#A1A1AA] mb-4">{model.description}</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs text-[#71717A]">
                  <Zap className="w-3 h-3" />
                  {model.speed}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#71717A]">
                  <Clock className="w-3 h-3" />
                  Qualité {model.quality}
                </div>
              </div>
              <div className="flex gap-2">
                {model.bestFor.map((niche) => (
                  <span key={niche} className="px-2 py-0.5 bg-[#27272A] rounded text-xs text-[#A1A1AA]">
                    {niche}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SubPageLayout>
  );
}
