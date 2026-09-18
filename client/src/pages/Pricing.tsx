import SubPageLayout from "@/components/SubPageLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Check, Zap, Star, Crown, ArrowRight, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const plans = [
  { id: "free" as const, name: "Gratuit", price: "0", description: "Pour découvrir Minia IA sans engagement.", icon: Zap, features: ["5 miniatures gratuites", "3 styles disponibles", "1 génération parallèle", "Espace personnel"], popular: false },
  { id: "pro" as const, name: "Pro", price: "19", description: "Pour les créateurs réguliers qui publient chaque semaine.", icon: Star, features: ["50 miniatures par mois", "6 styles professionnels", "4 générations parallèles", "Export HD", "Support prioritaire"], popular: true },
  { id: "max" as const, name: "Max", price: "49", description: "Pour les équipes, agences et workflows collaboratifs.", icon: Crown, features: ["Miniatures illimitées", "Tous les styles + futurs", "Batch Upload", "Interface équipe", "Accès API", "Support dédié"], popular: false },
];

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const choosePlan = trpc.plans.choose.useMutation({
    onSuccess: (result) => {
      toast.success(`Forfait ${result.planType === "free" ? "Gratuit" : result.planType === "pro" ? "Pro" : "Max"} sélectionné`, {
        description: "Sélection enregistrée en mode simulation. Aucun paiement réel n’a été effectué.",
      });
      navigate("/dashboard");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleChoose = (planId: "free" | "pro" | "max") => {
    if (!isAuthenticated) {
      const returnPath = `/pricing?plan=${planId}`;
      window.history.replaceState({}, "", returnPath);
      startLogin();
      return;
    }
    choosePlan.mutate({ planType: planId });
  };

  return (
    <SubPageLayout>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-[#A1A1AA]">Forfaits clairs et évolutifs</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Un plan pour chaque <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">créateur</span></h1>
          <p className="text-lg text-[#A1A1AA]">Choisis un forfait pour créer ton espace Minia IA. Le paiement réel sera branché plus tard.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className={`relative p-6 bg-[#18181B] border rounded-xl transition-all duration-300 hover:scale-[1.02] ${plan.popular ? "border-orange-400/30 shadow-lg shadow-orange-400/10" : "border-[#27272A]"}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">POPULAIRE</span></div>}
              <div className="mb-6"><plan.icon className={`w-8 h-8 mb-3 ${plan.popular ? "text-orange-400" : "text-[#71717A]"}`} /><h3 className="text-xl font-bold text-white">{plan.name}</h3><p className="text-sm text-[#A1A1AA] mt-1 min-h-10">{plan.description}</p></div>
              <div className="mb-6"><span className="text-4xl font-bold text-white">{plan.price}€</span><span className="text-[#71717A]">/mois</span></div>
              <ul className="space-y-3 mb-8">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-[#D4D4D8]"><Check className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />{feature}</li>)}</ul>
              <button type="button" disabled={choosePlan.isPending} onClick={() => handleChoose(plan.id)} className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-60 ${plan.popular ? "bg-orange-500 text-white hover:bg-orange-400" : "bg-[#27272A] text-white hover:bg-[#3F3F46]"}`}>
                {choosePlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{plan.id === "free" ? "Créer mon compte" : `Choisir ${plan.name}`}<ArrowRight className="w-4 h-4" /></>}
              </button>
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
