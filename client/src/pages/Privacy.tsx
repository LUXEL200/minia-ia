import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function Privacy() {
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
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Politique de confidentialité</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-3xl md:text-4xl font-bold">
            Politique de confidentialité
          </h1>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-8 text-sm text-[#A1A1AA] leading-relaxed">
          <div>
            <h2 className="text-lg font-bold text-white mb-3">1. Données collectées</h2>
            <p>Nous collectons uniquement les données nécessaires au fonctionnement du service : adresse email, nom d'utilisateur, et les prompts de génération de miniatures. Aucune donnée de navigation intrusive n'est collectée.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">2. Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour : gérer votre compte, générer des miniatures, améliorer notre service, et vous envoyer des notifications (si vous y consentez). Nous ne vendons jamais vos données à des tiers.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">3. Stockage des images</h2>
            <p>Les miniatures que vous générez sont stockées de manière sécurisée. Vous pouvez les supprimer à tout moment depuis votre dashboard. Après suppression, les images sont définitivement effacées de nos serveurs.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">4. Galerie publique</h2>
            <p>Les miniatures affichées dans la galerie publique sont anonymisées : aucun identifiant utilisateur, email ou nom n'est exposé. Seules l'image et la description du prompt sont visibles.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">5. Cookies</h2>
            <p>Nous utilisons des cookies de session pour maintenir votre connexion et des cookies analytiques pour comprendre l'utilisation du service. Vous pouvez désactiver les cookies analytiques depuis les paramètres de votre navigateur.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">6. Vos droits (RGPD)</h2>
            <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous via la page <a href="/contact" className="text-cyan-400 hover:underline">Contact</a>.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">7. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données : chiffrement en transit (TLS), stockage sécurisé, et accès limité aux données utilisateurs.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3">8. Contact</h2>
            <p>Pour toute question relative à la confidentialité, contactez-nous via la page <a href="/contact" className="text-cyan-400 hover:underline">Contact</a>.</p>
          </div>

          <div className="pt-6 border-t border-[#27272A]">
            <p className="text-xs text-[#52525B]">Dernière mise à jour : Janvier 2026</p>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
