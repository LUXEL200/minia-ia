import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Clock, PenLine } from "lucide-react";

const posts = [
  {
    title: "10 techniques pour des miniatures YouTube qui convertissent",
    excerpt: "Découvre les stratégies éprouvées pour augmenter ton taux de clic de 30% avec des miniatures optimisées.",
    date: "15 Jan 2026",
    readTime: "8 min",
    category: "Guide",
  },
  {
    title: "Comment l'IA révolutionne la création de miniatures",
    excerpt: "De Canva à Minia IA : l'évolution des outils de création de miniatures et ce que ça change pour les créateurs.",
    date: "10 Jan 2026",
    readTime: "5 min",
    category: "Tendance",
  },
  {
    title: "Style MrBeast vs Style Viral : lequel choisir ?",
    excerpt: "Analyse comparative des deux styles les plus populaires et comment choisir le bon pour ta niche.",
    date: "5 Jan 2026",
    readTime: "6 min",
    category: "Comparatif",
  },
  {
    title: "Le guide complet du CTR YouTube en 2026",
    excerpt: "Tout ce que tu dois savoir sur le taux de clic YouTube : benchmarks, facteurs d'influence et optimisation.",
    date: "28 Déc 2025",
    readTime: "12 min",
    category: "Guide",
  },
  {
    title: "Comment générer 100 miniatures en une heure",
    excerpt: "Notre stratégie Batch Upload pour les équipes de créateurs qui gèrent plusieurs chaînes.",
    date: "20 Déc 2025",
    readTime: "4 min",
    category: "Tutoriel",
  },
  {
    title: "Podcast YouTube : les miniatures qui font cliquer",
    excerpt: "Les codes visuels spécifiques aux podcasts vidéo et comment les appliquer avec Minia IA.",
    date: "15 Déc 2025",
    readTime: "7 min",
    category: "Niche",
  },
];

export default function Blog() {
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
            <PenLine className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Blog & Ressources</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Apprends à{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              performer
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Guides, analyses et tutoriels pour optimiser tes miniatures YouTube.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {posts.map((post, index) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group bg-[#18181B] border border-[#27272A] rounded-xl p-6 hover:border-cyan-500/20 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-400">
                  {post.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-[#A1A1AA] mb-4 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-[#52525B]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.article>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[#71717A] text-sm">Plus d'articles bientôt disponibles</p>
        </div>
      </div>
    </SubPageLayout>
  );
}
