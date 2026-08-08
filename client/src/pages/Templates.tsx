import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Sparkles, Eye, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const templates = [
  {
    name: "Viral Hook",
    category: "Gaming",
    style: "viral",
    description: "Titre accrocheur en rouge, visage expressif, flèches et cercles. Optimisé pour les niches gaming.",
    thumbnail: "/manus-storage/thumbnail-mrbeast.png",
  },
  {
    name: "Tech Review",
    category: "Tech",
    style: "tech",
    description: "Fond sombre, produit en lumière, typographie clean. Parfait pour les reviews et unboxings.",
    thumbnail: "/manus-storage/thumbnail-tech.png",
  },
  {
    name: "Dramatic Story",
    category: "Storytelling",
    style: "dramatic",
    description: "Contraste fort, éclairage dramatique, expressions intenses. Pour les vidéos de storytelling.",
    thumbnail: "/manus-storage/thumbnail-dramatic.png",
  },
  {
    name: "Podcast Guest",
    category: "Podcast",
    style: "viral",
    description: "Portrait invité, nom en gros, citation percutante. Format vertical et horizontal disponible.",
    thumbnail: "/manus-storage/podcast-mode.png",
  },
  {
    name: "MrBeast Style",
    category: "Challenge",
    style: "mrbeast",
    description: "Couleurs saturées, gros textes, réactions exagérées. Le format MrBeast qui convertit.",
    thumbnail: "/manus-storage/thumbnail-mrbeast.png",
  },
  {
    name: "Minimal Art",
    category: "Design",
    style: "minimalist",
    description: "Espace négatif, palette limitée, typographie élégante. Pour les créateurs premium.",
    thumbnail: "/manus-storage/styles-gallery.png",
  },
];

const categories = ["Tous", "Gaming", "Tech", "Storytelling", "Podcast", "Challenge", "Design"];

export default function Templates() {
  return (
    <SubPageLayout>
      <div className="container">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Templates professionnels</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-4xl md:text-5xl font-bold mb-4">
            Des templates qui{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              convertissent
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Inspire-toi des meilleures pratiques et génère ta miniature en un clic.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-10 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:border-cyan-500/30 hover:text-white transition-all"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {templates.map((template, index) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <span className="px-2 py-0.5 bg-[#27272A] rounded text-xs text-[#A1A1AA]">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-[#71717A] mb-4">{template.description}</p>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Eye className="w-4 h-4" />
                  Utiliser ce template
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-2">Prêt à créer ?</h3>
          <p className="text-[#A1A1AA] mb-4">Génère ta miniature en 30 secondes depuis le dashboard.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
            Ouvrir le générateur
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </SubPageLayout>
  );
}
