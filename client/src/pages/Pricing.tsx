import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Check, Zap, Star, Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const plans = [
  {
    name: "Gratuit",
    price: "0",
    period: "/mois",
    icon: Zap,
    description: "Pour découvrir Minia IA",
    features: [
      "5 miniatures gratuites",
      "3 styles disponibles",
      "1 génération parallèle",
      "Support communauté",
      "Espace personnel",
    ],
    cta: "Commencer gratuitement",
    ctaHref: "/",
    popular: false,
    color: "border-[#27272A]",
  },
  {
    name: "Pro",
    price: "19",
    period: "/mois",
    icon: Star,
    description: "Pour les créateurs réguliers",
    features: [
      "50 miniatures/mois",
      "6 styles professionnels",
      "4 générations parallèles",
      "Mode Podcast activé",
      "Système Person",
      "Support prioritaire",
      "Export HD",
    ],
    cta: "Passer Pro",
    ctaHref: "/dashboard",
    popular: true,
    color: "border-cyan-500/30 shadow-lg shadow-cyan-500/10",
  },
  {
    name: "Max",
    price: "49",
    period: "/mois",
    icon: Crown,
    description: "Pour les équipes et agences",
    features: [
      "Miniatures illimitées",
      "Tous les styles + futurs",
      "Batch Upload (100/description)",
      "Interface équipe",
      "Validation/Refus collaboratif",
      "Notifications email",
      "API access",
      "Support dédié",
    ],
    cta: "Passer Max",
    ctaHref: "/dashboard",
    popular: false,
    color: "border-[#27272A]",
  },
];

export default function Pricing() {
  return (
    <SubPageLayout>
      <div className="container">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Tarifs transparents</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-4xl md:text-5xl font-bold mb-4">
            Un plan pour chaque{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              créateur
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Commence gratuitement, monte en puissance quand tu es prêt.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative p-6 bg-[#18181B] border ${plan.color} rounded-xl transition-all duration-300 hover:scale-[1.02]`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded-full">
                    POPULAIRE
                  </span>
                </div>
              )}

              <div className="mb-6">
                <plan.icon className={`w-8 h-8 mb-3 ${plan.popular ? "text-cyan-400" : "text-[#71717A]"}`} />
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-[#A1A1AA] mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}€</span>
                <span className="text-[#71717A]">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[#D4D4D8]">
                    <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref}>
                <a className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                  plan.popular
                    ? "bg-cyan-500 text-black hover:bg-cyan-400"
                    : "bg-[#27272A] text-white hover:bg-[#3F3F46]"
                }`}>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 p-8 bg-[#18181B] border border-[#27272A] rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-2">Des questions ?</h3>
          <p className="text-[#A1A1AA] mb-4">Consulte notre FAQ ou contacte-nous directement.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/faq">
              <a className="px-5 py-2.5 bg-[#27272A] text-white rounded-lg hover:bg-[#3F3F46] transition-colors text-sm font-medium">
                Voir la FAQ
              </a>
            </Link>
            <Link href="/contact">
              <a className="px-5 py-2.5 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors text-sm font-medium">
                Nous contacter
              </a>
            </Link>
          </div>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
