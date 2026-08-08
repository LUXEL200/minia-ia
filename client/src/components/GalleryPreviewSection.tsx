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
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090B] via-[#0F0F12] to-[#09090B]" />

      <div className="container relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-4"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-[#A1A1AA]">Aperçu communautaire</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-[Space_Grotesk] text-3xl md:text-4xl font-bold mb-4"
          >
            La communauté{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              génère en continu
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#A1A1AA] max-w-lg mx-auto"
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
                className="group relative aspect-video rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A] hover:border-cyan-500/30 transition-all duration-300"
              >
                {thumb.imageUrl ? (
                  <img
                    src={thumb.imageUrl}
                    alt="Miniature générée par la communauté"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#18181B] to-[#27272A]">
                    <Sparkles className="w-8 h-8 text-[#3F3F46]" />
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
                className="relative aspect-video rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A]"
              >
                <div className="w-full h-full bg-gradient-to-br from-[#18181B] to-[#27272A] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#3F3F46] animate-pulse" />
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
          <Link href="/gallery" className="inline-flex items-center gap-2 px-6 py-3 bg-[#18181B] border border-[#27272A] rounded-lg text-white font-medium hover:border-cyan-500/30 hover:bg-[#1F1F23] transition-all duration-300 group">
            <Eye className="w-4 h-4 text-cyan-400" />
            Voir la galerie complète
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
