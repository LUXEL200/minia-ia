/**
 * Pricing Section v3
 * Enhanced animations, hover effects, magnetic buttons
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import AnimatedSection, { StaggeredContainer, StaggeredItem } from "@/components/AnimatedSection";

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
    color: "#F97316",
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
    color: "#F97316",
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
    color: "#F97316",
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="container">
        <AnimatedSection animation="fade-up">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-orange-400 mb-4 block">
              / Tarifs
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
              Moins cher qu'une{" "}
              <span className="text-orange-400">miniature freelance</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 mb-8">
              1 miniature freelance = 30€ en moyenne. Fais le calcul.
            </p>

            {/* Toggle */}
            <motion.div
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-card/70 border border-border"
              layout
            >
              <motion.button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  !isYearly ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                Mensuel
              </motion.button>
              <motion.button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isYearly ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                Annuel
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-xs bg-[#FDBA74]/10 text-[#FDBA74] px-1.5 py-0.5 rounded font-bold"
                >
                  -17%
                </motion.span>
              </motion.button>
            </motion.div>
          </div>
        </AnimatedSection>

        <StaggeredContainer staggerDelay={100}>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <StaggeredItem key={i}>
                <motion.div
                  className={`relative p-8 rounded-[20px] border transition-all duration-300 ${
                    plan.popular
                      ? "bg-card/70 border-[#F97316]/40 lg:scale-105 shadow-xl shadow-[#F97316]/5 hover:border-[#F97316]/60"
                      : "bg-card/70 border-border hover:border-[#F97316]/20"
                  }`}
                  whileHover={{ y: plan.popular ? -4 : -6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {plan.popular && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-[#F97316] text-black text-xs font-bold"
                    >
                      Plus Populaire
                    </motion.div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-display font-bold text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <motion.div
                      className="flex items-baseline gap-1"
                      key={isYearly ? "yearly" : "monthly"}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-4xl font-display font-bold text-orange-400">
                        {isYearly ? plan.priceYearly : plan.priceMonthly}$
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{isYearly ? "an" : "mois"}
                      </span>
                    </motion.div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      plan.credits,
                      plan.variations,
                      plan.persons,
                    ].map((item, j) => (
                      <motion.li
                        key={j}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: j * 0.1 }}
                        className="flex items-center gap-3 text-sm text-foreground/80"
                      >
                        <Check className="w-4 h-4 flex-shrink-0 text-orange-400" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-lg font-semibold magnetic-btn ${
                      plan.popular
                        ? "bg-[#F97316] hover:bg-[#F97316]/90 text-black"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              </StaggeredItem>
            ))}
          </div>
        </StaggeredContainer>
      </div>
    </section>
  );
}
