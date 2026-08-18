import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Eye, Sparkles } from "lucide-react";

export default function GalleryPreviewSection() {
  const { data: thumbnails } = trpc.gallery.thumbnails.useQuery({
    limit: 6,
  });

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />

      <div className="container relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-card/70 border border-border rounded-full px-4 py-2 mb-4"
          >
            <Eye className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-muted-foreground">Aperçu communautaire</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl font-bold mb-4"
          >
            La communauté{" "}
            <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              génère en continu
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            Des milliers de créateurs génèrent leurs miniatures avec Minia IA chaque jour.
            Explore la galerie complète.
          </motion.p>
        </div>

        {/* Preview grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {thumbnails && thumbnails.length > 0 ? (
            thumbnails.map((thumb, index) => (
              <motion.div
                key={thumb.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative aspect-video rounded-[20px] overflow-hidden bg-card/70 border border-border hover:border-orange-400/30 transition-all duration-300"
              >
                {thumb.imageUrl ? (
                  <img
                    src={thumb.imageUrl}
                    alt="Miniature générée par la communauté"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                    <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            /* Placeholder grid showing style diversity */
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative aspect-video rounded-[20px] overflow-hidden bg-card/70 border border-border"
              >
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/50 animate-pulse" />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* CTA to full gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link href="/gallery" className="inline-flex items-center gap-2 px-6 py-3 bg-card/70 border border-border rounded-lg text-foreground font-medium hover:border-orange-400/30 hover:bg-muted transition-all duration-300 group">
            <Eye className="w-4 h-4 text-orange-400" />
            Voir la galerie complète
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
