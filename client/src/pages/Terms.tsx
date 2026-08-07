import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function Terms() {
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
            <span className="text-sm text-[#A1A1AA]">Conditions d'utilisation</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-3xl md:text-4xl font-bold">
            Conditions d'utilisation
          </h1>
        </motion.div>

        <div className="max-w-3xl mx-auto prose prose-invert">
          <div className="space-y-8 text-sm text-[#A1A1AA] leading-relaxed">
            <div>
              <h2 className="text-lg font-bold text-white mb-3">1. Acceptation des conditions</h2>
              <p>En accédant et en utilisant le service Minia IA, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">2. Description du service</h2>
              <p>Minia IA est un service de génération de miniatures YouTube par intelligence artificielle. Le service permet aux utilisateurs de créer des images de type miniature à partir de descriptions textuelles et de styles prédéfinis.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">3. Compte utilisateur</h2>
              <p>Pour utiliser certaines fonctionnalités du service, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion et de toutes les activités qui se déroulent sur votre compte.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">4. Contenu généré</h2>
              <p>Les miniatures générées par Minia IA vous appartiennent et vous pouvez les utiliser librement pour vos projets. Nous ne revendiquons aucun droit sur les images que vous créez via notre plateforme.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">5. Restrictions d'utilisation</h2>
              <p>Il est interdit d'utiliser Minia IA pour générer du contenu illégal, offensant, ou qui enfreint les droits de tiers. Nous nous réservons le droit de suspendre les comptes qui violent ces restrictions.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">6. Paiements et abonnements</h2>
              <p>Les plans payants sont facturés mensuellement. Vous pouvez annuler votre abonnement à tout moment. L'accès reste actif jusqu'à la fin de la période facturée en cours.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">7. Limitation de responsabilité</h2>
              <p>Minia IA est fourni "tel quel" sans garantie explicite ou implicite. Nous ne garantissons pas que le service sera ininterrompu ou sans erreur.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">8. Modifications</h2>
              <p>Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications seront publiées sur cette page et entreront en vigueur immédiatement.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-3">9. Contact</h2>
              <p>Pour toute question relative à ces conditions, contactez-nous via la page <a href="/contact" className="text-cyan-400 hover:underline">Contact</a>.</p>
            </div>

            <div className="pt-6 border-t border-[#27272A]">
              <p className="text-xs text-[#52525B]">Dernière mise à jour : Janvier 2026</p>
            </div>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
