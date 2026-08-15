/**
 * Final CTA Section v2
 * Strong cyan-primary CTA with urgency
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06B6D4]/8 via-transparent to-[#EC4899]/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#06B6D4]/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6">
            Arrête de perdre des vues à cause de{" "}
            <span className="text-orange-400">miniatures médiocres</span>.
          </h2>
          <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Miniatures virales en 30 secondes. Meilleur CTR. Production plus rapide. Sans frais de minia maker.
          </p>
          
          <Button
            size="lg"
            className="bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-black font-bold text-lg px-10 py-7 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-lg shadow-[#06B6D4]/25"
          >
            <Zap className="mr-2 w-5 h-5" />
            Créer une Miniature Virale Gratuitement
          </Button>

          <p className="text-sm text-zinc-500 mt-4">
            Sans carte bancaire. Annule à tout moment.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
