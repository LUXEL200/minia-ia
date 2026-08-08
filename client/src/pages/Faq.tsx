import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Link } from "wouter";

const faqs = [
  {
    question: "Qu'est-ce que Minia IA ?",
    answer: "Minia IA est un outil de génération de miniatures YouTube par intelligence artificielle. Il permet de créer des miniatures professionnelles en 30 secondes, sans graphiste ni outil de design complexe.",
  },
  {
    question: "Comment fonctionne la génération ?",
    answer: "Tu décris ta vidéo (titre, sujet, ambiance), tu choisis un style et un nombre de variantes (1 à 4), et notre IA génère les miniatures automatiquement. Tu n'as plus qu'à télécharger celle qui te plaît.",
  },
  {
    question: "Quels styles sont disponibles ?",
    answer: "Nous proposons 6 styles professionnels : Viral, MrBeast, Minimaliste, Dramatique, Tech et Retro. Chaque style est optimisé pour les algorithmes YouTube et testé sur des milliers de vidéos.",
  },
  {
    question: "Puis-je utiliser les miniatures commercialement ?",
    answer: "Oui, toutes les miniatures générées te sont livrées en pleine propriété. Tu peux les utiliser sur YouTube, TikTok, Instagram ou tout autre plateforme sans restriction.",
  },
  {
    question: "Le plan gratuit suffit-il ?",
    answer: "Le plan gratuit inclut 5 miniatures avec 3 styles. C'est parfait pour tester le produit. Pour un usage régulier, le plan Pro (19€/mois) offre 50 miniatures et tous les styles.",
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer: "Absolument. Tes prompts et images ne sont jamais partagés avec d'autres utilisateurs. Chaque utilisateur ne voit que ses propres miniatures. Nous ne stockons aucune donnée personnelle au-delà du nécessaire.",
  },
  {
    question: "Comment fonctionne le système d'équipe ?",
    answer: "Le plan Max inclut une interface équipe complète : invitations, attribution de tâches, validation/refus des propositions, et historique des actions. Parfait pour les agences et les équipes de créateurs.",
  },
  {
    question: "Puis-je annuler mon abonnement ?",
    answer: "Oui, à tout moment depuis ton dashboard. Ton accès reste actif jusqu'à la fin de la période facturée. Aucun engagement minimum.",
  },
  {
    question: "Quel est le délai de génération ?",
    answer: "En moyenne 30 secondes par miniature. La génération parallèle (jusqu'à 4 variantes) prend environ 45 secondes au total grâce à notre infrastructure optimisée.",
  },
  {
    question: "Le service fonctionne-t-il pour toutes les niches ?",
    answer: "Oui. Minia IA a été entraîné sur des miniatures de toutes les niches : gaming, tech, lifestyle, éducation, finance, podcast, et plus. Les résultats sont adaptés à ton sujet.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SubPageLayout>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Questions fréquentes</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-4xl md:text-5xl font-bold mb-4">
            On répond à{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              tout
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Tu ne trouves pas ta réponse ? Contacte-nous directement.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-[#18181B] border border-[#27272A] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex items-center justify-between w-full p-5 text-left"
              >
                <span className="text-white font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#71717A] shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-48 pb-5" : "max-h-0"
                }`}
              >
                <p className="px-5 text-sm text-[#A1A1AA] leading-relaxed">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-8 bg-[#18181B] border border-[#27272A] rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-2">Pas de réponse à ta question ?</h3>
          <p className="text-[#A1A1AA] mb-4">Notre équipe répond en moins de 24h.</p>
          <Link href="/contact">
            
              Nous contacter →
            
          </Link>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
