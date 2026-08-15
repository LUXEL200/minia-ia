/**
 * Comparison Section v2
 * Minia IA vs Freelance vs Canva vs Midjourney
 * Cyan-primary highlighting for Minia IA column
 */
import { motion } from "framer-motion";
import { Check, X, Zap } from "lucide-react";

const comparisonData = [
  { feature: "Temps de génération", minia: "30 secondes", freelance: "24-48h", canva: "2 heures", midjourney: "5-10 min" },
  { feature: "Cohérence du visage", minia: true, freelance: true, canva: false, midjourney: false },
  { feature: "A/B testing intégré", minia: true, freelance: false, canva: false, midjourney: false },
  { feature: "Génération parallèle (4x)", minia: true, freelance: false, canva: false, midjourney: false },
  { feature: "Mode Podcast", minia: true, freelance: false, canva: false, midjourney: false },
  { feature: "Coût par miniature", minia: "~0.20€", freelance: "~30€", canva: "~12€/mois", midjourney: "~0.04€" },
  { feature: "Finitions pré-construites", minia: true, freelance: true, canva: false, midjourney: false },
  { feature: "Export 4K", minia: true, freelance: true, canva: true, midjourney: true },
];

function CellContent({ value, isMinia }: { value: boolean | string; isMinia: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={`w-4 h-4 mx-auto ${isMinia ? "text-orange-400" : "text-zinc-500"}`} />
    ) : (
      <X className="w-4 h-4 mx-auto text-zinc-700" />
    );
  }
  return (
    <span className={`text-sm font-medium ${isMinia ? "text-orange-400" : "text-zinc-400"}`}>
      {value}
    </span>
  );
}

export default function ComparisonSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-orange-400 mb-4 block">
            / Comparaison
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Minia IA vs{" "}
            <span className="text-orange-400">la concurrence</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
            La comparaison est sans appel.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider"></th>
                <th className="text-center py-4 px-4 w-28">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-orange-400 font-display font-bold text-sm">Minia IA</span>
                    <Zap className="w-3 h-3 text-orange-400" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 w-24">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Freelance</span>
                </th>
                <th className="text-center py-4 px-4 w-24">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Canva</span>
                </th>
                <th className="text-center py-4 px-4 w-24">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Midjourney</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="py-4 px-4 text-sm text-zinc-300 font-medium">
                    {row.feature}
                  </td>
                  <td className="py-4 px-4 text-center bg-[#06B6D4]/3">
                    <CellContent value={row.minia} isMinia={true} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CellContent value={row.freelance} isMinia={false} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CellContent value={row.canva} isMinia={false} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <CellContent value={row.midjourney} isMinia={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
