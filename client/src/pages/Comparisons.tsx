import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Check, X, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const comparisons = [
  {
    feature: "Temps de génération",
    minia: "30 secondes",
    competitor1: "5-15 minutes",
    competitor2: "2-5 jours",
  },
  {
    feature: "Coût par miniature",
    minia: "À partir de 0,38€",
    competitor1: "2-5€",
    competitor2: "15-50€",
  },
  {
    feature: "Génération parallèle",
    minia: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: "Styles professionnels",
    minia: "6 styles",
    competitor1: "2-3 styles",
    competitor2: "1 template",
  },
  {
    feature: "Mode Podcast",
    minia: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: "Système Person (branding)",
    minia: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: "Interface équipe",
    minia: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: "Batch Upload",
    minia: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: "Galerie communautaire",
    minia: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: "Export HD (1280x720)",
    minia: true,
    competitor1: true,
    competitor2: true,
  },
  {
    feature: "API disponible",
    minia: true,
    competitor1: false,
    competitor2: false,
  },
];

export default function Comparisons() {
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
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Comparatif</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Minia IA vs la{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              concurrence
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Compare Minia IA aux autres solutions du marché.
          </p>
        </motion.div>

        <div className="overflow-x-auto max-w-4xl mx-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272A]">
                <th className="text-left py-4 px-4 text-[#71717A] font-medium">Fonctionnalité</th>
                <th className="text-center py-4 px-4">
                  <span className="font-bold text-cyan-400">Minia IA</span>
                </th>
                <th className="text-center py-4 px-4 text-[#71717A]">Canva</th>
                <th className="text-center py-4 px-4 text-[#71717A]">Freelance</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, index) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="border-b border-[#27272A]/50 hover:bg-[#18181B]/50 transition-colors"
                >
                  <td className="py-3 px-4 text-white">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.minia === "boolean" ? (
                      row.minia ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-cyan-400 font-medium">{row.minia}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.competitor1 === "boolean" ? (
                      row.competitor1 ? <Check className="w-4 h-4 text-[#71717A] mx-auto" /> : <X className="w-4 h-4 text-red-400/50 mx-auto" />
                    ) : (
                      <span className="text-[#71717A]">{row.competitor1}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.competitor2 === "boolean" ? (
                      row.competitor2 ? <Check className="w-4 h-4 text-[#71717A] mx-auto" /> : <X className="w-4 h-4 text-red-400/50 mx-auto" />
                    ) : (
                      <span className="text-[#71717A]">{row.competitor2}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-8 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 border border-cyan-500/20 rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-2">La différence est claire</h3>
          <p className="text-[#A1A1AA] mb-4">Essaie gratuitement et vois par toi-même.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
            
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            
          </Link>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
