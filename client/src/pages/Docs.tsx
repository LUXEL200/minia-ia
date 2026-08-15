import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { BookOpen, Code, Image, Users, Mail, Zap } from "lucide-react";
import { Link } from "wouter";

const sections = [
  {
    icon: Zap,
    title: "Démarrage rapide",
    description: "Crée ton compte, ouvre le dashboard, génère ta première miniature en 2 minutes.",
    topics: ["Créer un compte", "Première génération", "Choisir un style", "Télécharger"],
  },
  {
    icon: Image,
    title: "Guide des styles",
    description: "Comprendre les 6 styles disponibles et quand les utiliser pour maximiser ton taux de clic.",
    topics: ["Style Viral", "Style MrBeast", "Style Minimaliste", "Style Dramatique", "Style Tech", "Style Retro"],
  },
  {
    icon: Users,
    title: "Interface équipe",
    description: "Gérer les collaborateurs, attribuer des tâches, valider ou refuser les propositions.",
    topics: ["Inviter un collaborateur", "Attribuer une tâche", "Valider/Refuser", "Historique"],
  },
  {
    icon: Code,
    title: "API & Intégrations",
    description: "Intégrer Minia IA dans ton workflow avec notre API REST. Documentation complète.",
    topics: ["Authentification API", "Endpoints", "Rate limits", "Webhooks"],
  },
  {
    icon: Mail,
    title: "Notifications",
    description: "Configurer les alertes email pour les générations terminées et les crédits bas.",
    topics: ["Emails de notification", "Préférences", "Templates d'email"],
  },
  {
    icon: BookOpen,
    title: "Bonnes pratiques",
    description: "Optimiser tes miniatures pour les algorithmes YouTube avec nos recommandations.",
    topics: ["CTR optimal", "A/B testing", "Couleurs qui convertissent", "Typographie"],
  },
];

export default function Docs() {
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
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-[#A1A1AA]">Documentation</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Centre de{" "}
            <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              documentation
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Tout ce dont tu as besoin pour maîtriser Minia IA.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="p-6 bg-[#18181B] border border-[#27272A] rounded-xl hover:border-orange-400/20 transition-all duration-300 group"
            >
              <section.icon className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{section.title}</h3>
              <p className="text-sm text-[#A1A1AA] mb-4">{section.description}</p>
              <ul className="space-y-1.5">
                {section.topics.map((topic) => (
                  <li key={topic} className="text-xs text-[#71717A] group-hover:text-[#A1A1AA] transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 bg-orange-400 rounded-full" />
                    {topic}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Coming soon note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-6 bg-[#18181B] border border-[#27272A] rounded-xl"
        >
          <p className="text-[#A1A1AA]">
            La documentation complète est en cours de rédaction. En attendant, consulte la{" "}
            <Link href="/faq"><span className="text-orange-400 hover:underline">FAQ</span></Link>{" "}
            ou <Link href="/contact"><span className="text-orange-400 hover:underline">contacte-nous</span></Link>.
          </p>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
