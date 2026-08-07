import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function Cgv() {
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
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">CGV</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-3xl md:text-4xl font-bold">
            Conditions Générales de Vente
          </h1>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-8 text-sm text-[#A1A1AA] leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-white mb-3">1. Objet</h2>
            <p>Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Minia IA (ci-après "le Vendeur") et toute personne physique ou morale (ci-après "l'Utilisateur") souhaitant souscrire à un abonnement au service de génération de miniatures par intelligence artificielle.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">2. Plans et tarification</h2>
            <p>Le service est proposé en trois formules : Gratuit (0€/mois), Pro (19€/mois) et Max (49€/mois). Les prix sont exprimés en euros hors taxes. La TVA est ajoutée au moment du paiement selon la réglementation en vigueur.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">3. Facturation et paiement</h2>
            <p>Les abonnements Pro et Max sont facturés mensuellement. Le paiement est effectué par carte bancaire via notre prestataire de paiement sécurisé (Stripe). La facturation a lieu au début de chaque période d'abonnement.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">4. Renouvellement automatique</h2>
            <p>Les abonnements se renouvellent automatiquement à l'issue de chaque période. L'Utilisateur peut résilier à tout moment depuis son dashboard. L'accès reste actif jusqu'à la fin de la période en cours.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">5. Droit de rétractation</h2>
            <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture d'un contenu numérique non fourni sur un support matériel dont l'exécution a commencé après accord préalable exprès de l'Utilisateur et renoncement exprès à son droit de rétractation.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">6. Limitation de responsabilité</h2>
            <p>Minia IA ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du service. La responsabilité de Minia IA est limitée au montant des sommes versées par l'Utilisateur au cours des trois derniers mois.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">7. Propriété intellectuelle</h2>
            <p>Les miniatures générées par le service appartiennent à l'Utilisateur. Minia IA ne revendique aucun droit sur les images produites. L'Utilisateur est seul responsable de l'utilisation conforme aux lois en vigueur de ses miniatures.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">8. Suspension et résiliation</h2>
            <p>Minia IA se réserve le droit de suspendre temporairement ou définitivement l'accès au service en cas de non-paiement, de violation des conditions d'utilisation, ou d'activité suspecte. L'Utilisateur peut résilier à tout moment sans justification.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">9. Droit applicable</h2>
            <p>Les présentes CGV sont soumises au droit français. Tout litige sera soumis à la compétence exclusive des tribunaux compétents, sous réserve des dispositions légales impératives relatives à la protection des consommateurs.</p>
          </div>

          <div className="pt-6 border-t border-[#27272A]">
            <p className="text-xs text-[#52525B]">Dernière mise à jour : Janvier 2026</p>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
