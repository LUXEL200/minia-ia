/**
 * Footer v2
 * Clean dark footer with neon accent top border
 */
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/30 to-transparent" />
      
      <div className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold text-white">
                  Minia<span className="text-[#06B6D4]">IA</span>
                </span>
              </div>
              <p className="text-sm text-zinc-500">
                Le générateur de miniatures YouTube le plus rapide du marché.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Produit
              </h4>
              <ul className="space-y-2.5">
                {["Fonctionnalités", "Tarifs", "Templates", "Générateur", "FAQ", "Documentation"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Ressources
              </h4>
              <ul className="space-y-2.5">
                {["Blog", "Modèles", "Bonnes pratiques", "Exemples", "Comparatifs", "Pour créateurs"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Légal
              </h4>
              <ul className="space-y-2.5">
                {["Conditions d'utilisation", "Politique de confidentialité", "Contact", "CGV"].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-[#27272A]">
            <p className="text-xs text-zinc-600">
              © 2026 Minia IA. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <select className="bg-transparent border border-[#27272A] text-xs text-zinc-500 rounded px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]/50">
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="pt">🇧🇷 Português</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
