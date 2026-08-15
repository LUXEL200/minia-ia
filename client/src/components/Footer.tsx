/**
 * Footer with all links pointing to real pages
 */
import { Zap } from "lucide-react";
import { Link } from "wouter";

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
                  Minia<span className="text-cyan-400">IA</span>
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
                <li><Link href="/features"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Fonctionnalités</span></Link></li>
                <li><Link href="/pricing"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Tarifs</span></Link></li>
                <li><Link href="/templates"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Templates</span></Link></li>
                <li><Link href="/generator"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Générateur</span></Link></li>
                <li><Link href="/faq"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">FAQ</span></Link></li>
                <li><Link href="/docs"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Documentation</span></Link></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Ressources
              </h4>
              <ul className="space-y-2.5">
                <li><Link href="/blog"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Blog</span></Link></li>
                <li><Link href="/models"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Modèles</span></Link></li>
                <li><Link href="/best-practices"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Bonnes pratiques</span></Link></li>
                <li><Link href="/examples"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Exemples</span></Link></li>
                <li><Link href="/comparisons"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Comparatifs</span></Link></li>
                <li><Link href="/for-creators"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Pour créateurs</span></Link></li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Légal
              </h4>
              <ul className="space-y-2.5">
                <li><Link href="/terms"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Conditions d'utilisation</span></Link></li>
                <li><Link href="/privacy"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Politique de confidentialité</span></Link></li>
                <li><Link href="/contact"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Contact</span></Link></li>
                <li><Link href="/cgv"><span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">CGV</span></Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border">
            <p className="text-xs text-zinc-600">
              © 2026 Minia IA. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <select className="bg-transparent border border-border text-xs text-zinc-500 rounded px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]/50">
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
