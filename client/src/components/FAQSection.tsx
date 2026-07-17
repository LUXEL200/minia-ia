/**
 * FAQ Section v2
 * Clean accordion with neon accents
 */
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "C'est quoi exactement Minia IA ?",
    answer: "Minia IA est un outil de génération de miniatures YouTube par intelligence artificielle. Tu uploades ton visage une fois, tu choisis un style d'inspiration, et notre IA génère jusqu'à 4 variations de miniatures virales en moins de 30 secondes. Pas besoin de designer, pas d'attente, pas de compétences techniques.",
  },
  {
    question: "Ça remplace vraiment un minia maker ?",
    answer: "Oui. Si tu cherches une miniature rapide, cohérente avec ta marque et optimisée pour le CTR, Minia IA fait le travail en 30 secondes contre 24-48h pour un freelance. Pour des miniatures ultra-customisées avec un style unique, tu peux toujours garder ton designer pour les vidéos spéciales.",
  },
  {
    question: "Comment fonctionne le système Person ?",
    answer: "Tu uploades 3-5 photos de ton visage, tu décris tes caractéristiques (lunettes, barbe, couleur de cheveux...), et l'IA enregistre ta ressemblance. Ensuite, à chaque génération, elle intègre automatiquement ton visage dans chaque miniature. Plus besoin de re-upload à chaque fois.",
  },
  {
    question: "Je peux essayer gratuitement ?",
    answer: "Oui ! Le plan gratuit inclut 10 crédits, ce qui te permet de générer 5 miniatures (2 variations par génération). Pas besoin de carte bancaire. Tu peux voir le résultat avant de payer quoi que ce soit.",
  },
  {
    question: "C'est quoi la qualité de sortie ?",
    answer: "Les miniatures sont générées en 1280x720 (standard YouTube) et peuvent être exportées en 4K pour une qualité maximale. La qualité est comparable à ce qu'un designer freelance expérimenté produirait, avec l'avantage de la vitesse et du A/B testing intégré.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Oui. Tes photos et ton profil Person sont stockés de manière sécurisée et ne sont utilisés que pour générer tes miniatures. Nous ne partageons jamais tes données avec des tiers. Tu peux supprimer ton profil Person à tout moment depuis les paramètres.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 lg:py-32 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#06B6D4] mb-4 block">
            / FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Questions <span className="text-[#06B6D4]">Fréquentes</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
            Tout ce que tu veux savoir avant de te lancer.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-[#27272A] rounded-lg bg-[#18181B] px-6"
              >
                <AccordionTrigger className="text-left text-white hover:text-[#06B6D4] font-medium py-5 no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
