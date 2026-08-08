import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Users, Video, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const niches = [
  {
    icon: Video,
    name: "YouTubeurs Gaming",
    description: "Génère des miniatures virales avec des réactions expressives, des flèches et des cercles. Style MrBeast ou Viral.",
    stats: "+45% CTR moyen",
  },
  {
    icon: TrendingUp,
    name: "Créateurs Tech",
    description: "Reviews, unboxings, comparatifs — des miniatures photoréalistes qui font pro. Style Tech optimisé.",
    stats: "+32% CTR moyen",
  },
  {
    icon: Users,
    name: "Podcasters",
    description: "Portraits invités, citations percutantes, branding cohérent. Le mode Podcast est fait pour toi.",
    stats: "+52% CTR moyen",
  },
  {
    icon: Clock,
    name: "Créateurs quotidien",
    description: "Tu publies 3-5 vidéos par semaine ? Génère toutes tes miniatures en 10 minutes au lieu de 3 heures.",
    stats: "10x plus rapide",
  },
  {
    icon: Users,
    name: "Agences & Équipes",
    description: "Gère plusieurs chaînes, attribue des tâches, valide en équipe. Le plan Max est conçu pour vous.",
    stats: "Jusqu'à 10 membres",
  },
  {
    icon: TrendingUp,
    name: "Affiliés & Marketeurs",
    description: "Des miniatures qui convertissent pour tes vidéos d'affiliation. Optimisées pour le clic et la vente.",
    stats: "+38% conversion",
  },
];

export default function ForCreators() {
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
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Pour les créateurs</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-4xl md:text-5xl font-bold mb-4">
            Fait pour{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              chaque niche
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Whatever ta niche, Minia IA a un style et un workflow fait pour toi.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {niches.map((niche, index) => (
            <motion.div
              key={niche.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="p-6 bg-[#18181B] border border-[#27272A] rounded-xl hover:border-cyan-500/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-[#27272A] rounded-xl flex items-center justify-center mb-4">
                <niche.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{niche.name}</h3>
              <p className="text-sm text-[#A1A1AA] mb-4">{niche.description}</p>
              <div className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-400 font-medium">
                {niche.stats}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-2">Rejoins la communauté</h3>
          <p className="text-[#A1A1AA] mb-4">Plus de 2 800 créateurs utilisent déjà Minia IA.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
            
              Essayer gratuitement
              <ArrowRight className="w-4 h-4" />
            
          </Link>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
