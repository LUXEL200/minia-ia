import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Zap, Crown, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const plans = [
  {
    name: "Gratuit",
    price: "0€",
    credits: 5,
    features: ["5 crédits / mois", "Génération standard", "1 style"],
    icon: Zap,
    current: true,
  },
  {
    name: "Pro",
    price: "19€",
    credits: 100,
    features: ["100 crédits / mois", "Tous les styles", "Batch upload", "Priorité génération"],
    icon: Crown,
    current: false,
    popular: true,
  },
  {
    name: "Max",
    price: "49€",
    credits: 500,
    features: ["500 crédits / mois", "Tout illimité", "Équipe (5 membres)", "API access"],
    icon: Sparkles,
    current: false,
  },
];

export default function BillingPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);
  const { data: credits } = trpc.thumbnail.credits.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <PageHeader
          title="Facturation"
          subtitle="Gère ton abonnement et tes crédits"
          breadcrumb={[{ label: "Facturation" }]}
          right={
            <Link href="/pricing" className="bg-[#ff0050] hover:bg-[#e60048] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-block">
              Mettre à niveau
            </Link>
          }
        />

        {/* Current Plan */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="text-[#ff0050]" size={20} />
            <h2 className="font-semibold">Plan actuel</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">Gratuit</p>
              <p className="text-sm text-zinc-400">{credits?.credits ?? 0} crédits restants</p>
            </div>
            <button className="bg-[#ff0050] hover:bg-[#e60048] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Mettre à niveau
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 transition-colors ${
                plan.popular
                  ? "border-[#ff0050] bg-[#ff0050]/5"
                  : plan.current
                  ? "border-zinc-600 bg-zinc-900"
                  : "border-zinc-800 bg-zinc-950"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <plan.icon size={18} className={plan.popular ? "text-[#ff0050]" : "text-zinc-400"} />
                <h3 className="font-semibold">{plan.name}</h3>
                {plan.popular && (
                  <span className="text-[10px] bg-[#ff0050] text-white px-2 py-0.5 rounded-full ml-auto">Populaire</span>
                )}
              </div>
              <p className="text-2xl font-bold mb-1">{plan.price}<span className="text-sm text-zinc-400">/mois</span></p>
              <p className="text-sm text-zinc-400 mb-4">{plan.credits} crédits inclus</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-zinc-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#ff0050] rounded-full" />
                    {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button className="w-full py-2 rounded-lg text-sm font-medium border border-zinc-700 hover:bg-zinc-800 transition-colors">
                  Choisir
                </button>
              )}
              {plan.current && (
                <p className="text-center text-xs text-zinc-500 py-2">Plan actuel</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
