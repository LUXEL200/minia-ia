/**
 * Social Proof Section v2
 * Asymmetric stats bar with cyan-primary numbers
 */
import { motion } from "framer-motion";
import { TrendingUp, Users, Clock, Star } from "lucide-react";

const stats = [
  { icon: TrendingUp, value: "+38%", label: "CTR moyen", color: "#F97316" },
  { icon: Users, value: "14,589+", label: "Créateurs actifs", color: "#F97316" },
  { icon: Clock, value: "<30s", label: "Génération", color: "#EC4899" },
  { icon: Star, value: "4.9/5", label: "Note moyenne", color: "#FBBF24" },
];

export default function SocialProofSection() {
  return (
    <section className="py-12 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="lift-card p-6 lg:p-8 text-center glass feature-edge"
            >
              <stat.icon className="w-4 h-4 mx-auto mb-3" style={{ color: stat.color }} />
              <p className="text-2xl sm:text-3xl font-display font-bold mb-1 font-mono" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
