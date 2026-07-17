/**
 * Styles Gallery Section v2
 * Showcases different thumbnail styles with cyan accent tags
 */
import { motion } from "framer-motion";
import { Palette } from "lucide-react";

const styles = [
  { name: "MrBeast Style", color: "#EF4444" },
  { name: "Tech Review", color: "#06B6D4" },
  { name: "Dramatique", color: "#8B5CF6" },
  { name: "Lifestyle", color: "#F97316" },
  { name: "Gaming", color: "#22C55E" },
  { name: "Business", color: "#3B82F6" },
];

export default function StylesSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#06B6D4] mb-4 block">
            / Tous les Styles
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Choisis et génère n'importe quel{" "}
            <span className="text-[#06B6D4]">style de miniature</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
            De MrBeast aux vidéos tech, en passant par le lifestyle et le gaming — notre IA maîtrise tous les styles qui convertissent.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-xl overflow-hidden border border-[#27272A] mb-8">
            <img
              src="/manus-storage/styles-gallery_c41ef858.png"
              alt="Galerie de styles Minia IA"
              className="w-full"
            />
          </div>

          {/* Style tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {styles.map((style, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: `${style.color}40`,
                  color: style.color,
                  backgroundColor: `${style.color}08`,
                }}
              >
                {style.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
