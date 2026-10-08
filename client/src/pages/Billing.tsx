import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  CreditCard,
  Zap,
  Plus,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPlanDefinition } from "@shared/plans";

function formatPrice(amountCents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amountCents / 100);
}

export default function BillingPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  const { data: credits } = trpc.thumbnail.credits.useQuery();
  const { data: catalog } = trpc.packs.catalog.useQuery();
  const { data: purchases, refetch: refetchPurchases } = trpc.packs.purchases.useQuery();
  const { data: creditHistory } = trpc.thumbnail.creditHistory.useQuery();

  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [successPack, setSuccessPack] = useState<string | null>(null);

  const selected = catalog?.find((p) => p.id === selectedPack) ?? null;

  const utils = trpc.useUtils();
  const purchase = trpc.packs.purchase.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.purchase.packLabel} acheté ! ${data.purchase.creditsGranted} crédits ajoutés à ton compte.`);
      setSuccessPack(data.purchase.packLabel);
      refetchPurchases();
      utils.thumbnail.credits.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "L'achat a échoué, réessaie.");
    },
  });

  useEffect(() => {
    if (!successPack) return;
    const t = setTimeout(() => setSuccessPack(null), 4000);
    return () => clearTimeout(t);
  }, [successPack]);

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
          subtitle="Gère ton abonnement, recharge tes crédits et vois ton historique"
          breadcrumb={[{ label: "Facturation" }]}
          right={
            <Link href="/pricing" aria-disabled="true" onClick={(event) => event.preventDefault()} className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-block cursor-not-allowed">
              Bientôt disponible
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
              <p className="text-lg font-medium">{getPlanDefinition(credits?.planType).name}</p>
              <p className="text-sm text-zinc-400">{credits?.credits ?? 0} crédits restants sur le quota actif</p>
            </div>
            <button
              onClick={() => {
                document.getElementById("recharge-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#ff0050] hover:bg-[#e60048] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>

        {/* Recharge section */}
        <div id="recharge-section" className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="text-[#00e0ff]" size={20} />
            <h2 className="text-lg font-semibold">Recharger des crédits</h2>
            <span className="text-[10px] bg-[#00e0ff]/10 text-[#00e0ff] border border-[#00e0ff]/20 px-2 py-0.5 rounded-full ml-auto">
              Packs de crédits
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Les packs rechargeables resteront disponibles après activation du paiement Stripe.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {catalog?.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  pack.popular
                    ? "border-[#ff0050] bg-[#ff0050]/5"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-[#ff0050] text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                    Le plus populaire
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Plus size={16} className="text-[#00e0ff]" />
                  <h3 className="font-semibold text-sm">{pack.label}</h3>
                </div>
                <p className="text-2xl font-bold mb-0.5">{pack.credits}</p>
                <p className="text-xs text-zinc-400 mb-4">crédits</p>
                <button
                  disabled={purchase.isPending}
                  onClick={() => setSelectedPack(pack.id)}
                  className="w-full py-2 rounded-lg text-xs font-medium bg-[#00e0ff] hover:bg-[#00c2dd] text-black transition-colors disabled:opacity-60"
                >
                  Acheter {formatPrice(pack.amountCents)}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase history */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="text-[#00e0ff]" size={20} />
            <h2 className="text-lg font-semibold">Historique des achats</h2>
          </div>
          {!purchases || purchases.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center">
              <Receipt className="mx-auto mb-2 text-zinc-600" size={24} />
              <p className="text-sm text-zinc-400">Aucun achat pour le moment</p>
              <p className="text-xs text-zinc-600 mt-1">Tes packs achetés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-zinc-950/70 text-[11px] uppercase tracking-wide text-zinc-500">
                <span>Pack</span>
                <span className="text-right">Crédits</span>
                <span className="text-right">Montant</span>
                <span className="text-right">Date</span>
              </div>
              {purchases.map((p) => (
                <div key={p.id} className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-zinc-800/70 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{p.packLabel}</span>
                    {p.status === "completed" && (
                      <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                        Payé
                      </span>
                    )}
                  </span>
                  <span className="text-right text-[#00e0ff] font-medium">+{p.creditsGranted}</span>
                  <span className="text-right text-zinc-300">{formatPrice(p.amountCents)}</span>
                  <span className="text-right text-xs text-zinc-500">
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credit ledger */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-orange-400" size={20} />
            <h2 className="text-lg font-semibold">Mouvements de crédits</h2>
          </div>
          {!creditHistory || creditHistory.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-sm text-zinc-400">Aucun mouvement enregistré</p>
              <p className="text-xs text-zinc-600 mt-1">Les générations et remboursements apparaîtront ici.</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-zinc-950/70 text-[11px] uppercase tracking-wide text-zinc-500">
                <span>Opération</span>
                <span className="text-right">Variation</span>
                <span className="text-right">Solde</span>
                <span className="text-right">Date</span>
              </div>
              {creditHistory.map((entry) => {
                const isDebit = entry.type === "debit";
                const label = entry.type === "debit" ? "Génération" : entry.type === "refund" ? "Remboursement" : "Recharge";
                return (
                  <div key={entry.id} className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-zinc-800/70 text-sm">
                    <span className="truncate">{label}</span>
                    <span className={`text-right font-medium ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
                      {isDebit ? "-" : "+"}{entry.amount}
                    </span>
                    <span className="text-right text-zinc-300">{entry.balanceAfter}</span>
                    <span className="text-right text-xs text-zinc-500">
                      {new Date(entry.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Simulated payment dialog */}
      <Dialog open={selectedPack !== null} onOpenChange={(open) => !open && !purchase.isPending && setSelectedPack(null)}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
          {successPack ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="text-orange-400" size={20} />
                  Paiement simulé réussi
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {successPack} a été « payé » en simulation. Tes crédits ont été ajoutés au compte et une
                  notification de confirmation t'a été envoyée.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => { setSuccessPack(null); setSelectedPack(null); }} className="bg-[#ff0050] hover:bg-[#e60048]">
                  Parfait
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Confirmer l'achat — {selected?.label}</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Tu vas « payer » {selected ? formatPrice(selected.amountCents) : ""} en simulation.
                  {selected ? ` ${selected.credits} crédits seront ajoutés immédiatement à ton solde.` : ""}
                  <br />
                  <span className="text-xs text-zinc-600">Aucune vraie carte bancaire n'est demandée (parcours pré-Stripe).</span>
                </DialogDescription>
              </DialogHeader>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Pack</span>
                  <span>{selected?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Crédits ajoutés</span>
                  <span className="text-[#00e0ff] font-medium">+{selected?.credits}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2">
                  <span className="text-zinc-400">Total</span>
                  <span className="font-bold">{selected ? formatPrice(selected.amountCents) : ""}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPack(null)} disabled={purchase.isPending} className="border-zinc-700 text-white hover:bg-zinc-800">
                  Annuler
                </Button>
                <Button
                  onClick={() => selectedPack && purchase.mutate({ packId: selectedPack as "starter" | "creator" | "pro" | "max" })}
                  disabled={purchase.isPending}
                  className="bg-[#00e0ff] hover:bg-[#00c2dd] text-black"
                >
                  {purchase.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Paiement...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Payer en simulation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
