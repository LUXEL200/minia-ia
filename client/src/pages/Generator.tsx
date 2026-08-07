import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Lock } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Generator() {
  const { isAuthenticated } = useAuth();

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
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Générateur de miniatures</span>
          </div>
          <h1 className="font-[Space_Grotesk] text-4xl md:text-5xl font-bold mb-4">
            Génère ta miniature{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              en 30 secondes
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Connecte-toi pour accéder au générateur propulsé par l'IA.
          </p>
        </motion.div>

        {/* Preview / Login CTA */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-[#27272A] rounded-2xl flex items-center justify-center">
              {isAuthenticated ? (
                <Zap className="w-8 h-8 text-cyan-400" />
              ) : (
                <Lock className="w-8 h-8 text-[#71717A]" />
              )}
            </div>

            {isAuthenticated ? (
              <>
                <h3 className="text-xl font-bold text-white mb-2">Accès au générateur</h3>
                <p className="text-[#A1A1AA] mb-6">Rends-toi sur le dashboard pour générer tes miniatures.</p>
                <Link href="/dashboard">
                  <a className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
                    Ouvrir le dashboard
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-2">Connexion requise</h3>
                <p className="text-[#A1A1AA] mb-6">Connecte-toi pour accéder au générateur de miniatures IA et créer tes premières miniatures.</p>
                <Link href="/">
                  <a className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
                    Se connecter
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
                <p className="text-xs text-[#52525B] mt-4">Sans carte bancaire • 5 miniatures gratuites</p>
              </>
            )}
          </div>

          {/* Features reminder */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "6 styles", sublabel: "professionnels" },
              { label: "4 variantes", sublabel: "par génération" },
              { label: "30 sec", sublabel: "en moyenne" },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 bg-[#18181B] border border-[#27272A] rounded-xl">
                <div className="text-lg font-bold text-cyan-400">{item.label}</div>
                <div className="text-xs text-[#71717A]">{item.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
