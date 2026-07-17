/**
 * Pricing Section v2
 * 3-tier pricing with cyan-primary CTA, asymmetric emphasis
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Gratuit",
    priceMonthly: 0,
    priceYearly: 0,
    credits: "10 crédits",
    variations: "2 à la fois",
    persons: "1 profil Person",
    description: "Pour essayer",
    cta: "Commencer gratuitement",
    popular: false,
    color: "#06B6D4",
  },
  {
    name: "Pro",
    priceMonthly: 19,
    priceYearly: 190,
    credits: "100 crédits/mois",
    variations: "4 à la fois",
    persons: "Jusqu'à 5 profils",
    description: "Pour créateurs solo",
    cta: "Essayer Pro",
    popular: true,
    color: "#06B6D4",
  },
  {
    name: "Max",
    priceMonthly: 49,
    priceYearly: 490,
    credits: "500 crédits/mois",
    variations: "4 à la fois",
    persons: "Profils illimités",
    description: "Pour duos & agences",
    cta: "Essayer Max",
    popular: false,
    color: "#06B6D4",
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#06B6D4] mb-4 block">
            / Tarifs
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Moins cher qu'une{" "}
            <span className="text-[#06B6D4]">miniature freelance</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4 mb-8">
            1 miniature freelance = 30€ en moyenne. Fais le calcul.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#18181B] border border-[#27272A]">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !isYearly ? "bg-[#27272A] text-white" : "text-zinc-500"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isYearly ? "bg-[#27272A] text-white" : "text-zinc-500"
              }`}
            >
              Annuel
              <span className="text-xs bg-[#22C55E]/10 text-[#22C55E] px-1.5 py-0.5 rounded">
                -17%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-xl border transition-all duration-300 ${
                plan.popular
                  ? "bg-[#18181B] border-[#06B6D4]/40 lg:scale-105 shadow-xl shadow-[#06B6D4]/5"
                  : "bg-[#18181B] border-[#27272A] hover:border-[#27272A]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-[#06B6D4] text-black text-xs font-bold">
                  Plus Populaire
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-display font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-zinc-500">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-[#06B6D4]">
                    {isYearly ? plan.priceYearly : plan.priceMonthly}$
                  </span>
                  <span className="text-sm text-zinc-500">
                    /{isYearly ? "an" : "mois"}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  plan.credits,
                  plan.variations,
                  plan.persons,
                ].map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 flex-shrink-0 text-[#06B6D4]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] ${
                  plan.popular
                    ? "bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black"
                    : "bg-[#27272A] text-white hover:bg-[#3F3F46]"
                }`}
              >
                {plan.cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
