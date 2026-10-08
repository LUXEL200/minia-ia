import SubPageLayout from "@/components/SubPageLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import { Check, Zap, Star, Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter"
import { PLAN_DEFINITIONS } from "@shared/plans";

const planVisuals = { free: { icon: Zap, popular: false }, pro: { icon: Star, popular: true }, max: { icon: Crown, popular: false } } as const;
const plans = Object.values(PLAN_DEFINITIONS).map(plan => ({
  ...plan,
  ...planVisuals[plan.id],
  price: String(plan.priceCents / 100),
  description: plan.features[0],
}));

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const handleChoose = (planId: "free") => { if (!isAuthenticated) { window.location.href = "/dashboard"; return; } void planId; };

  return (
    <SubPageLayout>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-[#A1A1AA]">Forfaits clairs et évolutifs</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Un plan pour chaque <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">créateur</span></h1>
          <p className="text-lg text-[#A1A1AA]">Choisis le niveau de création adapté à ton rythme et à ton équipe.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className={`relative p-6 bg-[#18181B] border rounded-xl transition-all duration-300 hover:scale-[1.02] ${plan.popular ? "border-orange-400/30 shadow-lg shadow-orange-400/10" : "border-[#27272A]"}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">POPULAIRE</span></div>}
              <div className="mb-6"><plan.icon className={`w-8 h-8 mb-3 ${plan.popular ? "text-orange-400" : "text-[#71717A]"}`} /><h3 className="text-xl font-bold text-white">{plan.name}</h3><p className="text-sm text-[#A1A1AA] mt-1 min-h-10">{plan.description}</p></div>
              <div className="mb-6"><span className="text-4xl font-bold text-white">{plan.price}€</span><span className="text-[#71717A]">/mois</span></div>
              <ul className="space-y-3 mb-8">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-[#D4D4D8]"><Check className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />{feature}</li>)}</ul>
              <button type="button" onClick={() => plan.id === "free" ? handleChoose(plan.id) : undefined} disabled={plan.id !== "free"} className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${plan.id === "free" ? "bg-[#27272A] text-white hover:bg-[#3F3F46]" : "bg-[#27272A]/70 text-[#A1A1AA]"}`}>{plan.id === "free" ? <>Créer mon compte<ArrowRight className="w-4 h-4" /></> : "Bientôt disponible"}</button>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-16 p-8 bg-[#18181B] border border-[#27272A] rounded-xl">
          <h3 className="text-xl font-bold text-white mb-2">Besoin de crédits supplémentaires ?</h3>
          <p className="text-[#A1A1AA] mb-4">Les packs de crédits rechargeables sont disponibles dans la facturation.</p>
          <div className="flex gap-3 justify-center"><Link href="/billing" className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors text-sm font-medium">Voir les packs</Link><Link href="/faq" className="px-5 py-2.5 bg-[#27272A] text-white rounded-lg hover:bg-[#3F3F46] transition-colors text-sm font-medium">Voir la FAQ</Link></div>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
