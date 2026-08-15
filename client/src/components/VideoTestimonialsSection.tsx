/**
 * DemoSection — Démonstration produit animée (style youthumb.ai) + témoignages vidéo
 *
 * - Par défaut : section "Démonstration" avec maquette produit animée
 *   (maquette de l'interface de création avec cascade de miniatures).
 * - Quand des IDs YouTube réels sont configurés, les témoignages vidéo
 *   s'affichent sous la démo.
 *
 * TO ACTIVATE VIDEOS: Replace the youtubeId values below with real video IDs.
 */
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Play, TrendingUp, Zap, Clock, Sparkles, Minus, Plus } from "lucide-react";

const VIDEO_TESTIMONIALS: Array<{
  id: number;
  title: string;
  creator: string;
  subscribers: string;
  youtubeId: string;
  platform: "youtube";
  metric: string;
  quote: string;
  avatar: string;
  avatarColor: string;
}> = [
  {
    id: 1,
    title: "J'ai remplacé mon designer par l'IA",
    creator: "@LucasCreates",
    subscribers: "245K abonnés",
    youtubeId: "", // ← Replace with real video ID, e.g. "dQw4w9WgXcQ"
    platform: "youtube",
    metric: "+340% CTR",
    quote: "Avant Minia IA, je payais 150€ par miniature. Maintenant je génère 4 variations en 30 secondes.",
    avatar: "LC",
    avatarColor: "#F97316",
  },
  {
    id: 2,
    title: "Comment j'ai fait 1M de vues avec une miniature IA",
    creator: "@SarahVlogs",
    subscribers: "890K abonnés",
    youtubeId: "",
    platform: "youtube",
    metric: "+1M vues",
    quote: "La miniature MrBeast style a fait exploser mes vues. L'IA comprend exactement ce qui marche sur YouTube.",
    avatar: "SV",
    avatarColor: "#EC4899",
  },
  {
    id: 3,
    title: "Minia IA vs Canva — Le test ultime",
    creator: "@TechReview",
    subscribers: "1.2M abonnés",
    youtubeId: "",
    platform: "youtube",
    metric: "10x plus rapide",
    quote: "J'ai comparé 50 miniatures IA vs manuelles. Les viewers ne font pas la différence.",
    avatar: "TR",
    avatarColor: "#8B5CF6",
  },
];

// Check if any real testimonials are configured
const hasRealTestimonials = VIDEO_TESTIMONIALS.some(t => t.youtubeId !== "");
const activeTestimonials = VIDEO_TESTIMONIALS.filter(t => t.youtubeId !== "");

const DEMO_MINIS = [
  { src: "/manus-storage/thumbnail-mrbeast_fc8fbcd3.png", alt: "Style viral", label: "Viral" },
  { src: "/manus-storage/thumbnail-tech_81d69968.png", alt: "Tech review", label: "Tech" },
  { src: "/manus-storage/thumbnail-dramatic_1e94decd.png", alt: "Dramatique", label: "Dramatic" },
];

/** Maquette produit animée — style youthumb.ai (app frame, glow, cascade) */
function ProductDemoFrame({ demoMinimized, setDemoMinimized }: { demoMinimized: boolean; setDemoMinimized: (v: boolean) => void }) {
  const demoRef = useRef<HTMLDivElement>(null);
  const inView = useInView(demoRef, { once: true, margin: "-100px" });

  return (
    <div ref={demoRef} className="relative w-full">
      {/* Glow orange */}
      <div className="absolute -inset-6 bg-orange-400/8 rounded-[2.5rem] blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className={`relative rounded-2xl border border-orange-400/25 bg-card/95 backdrop-blur shadow-2xl shadow-orange-400/15 overflow-hidden transition-all duration-500 ${
          demoMinimized ? "max-h-16" : ""
        }`}
      >
        {/* Barre app */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-secondary/80">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400/20" />
          </div>
          <div className="flex-1 text-center text-[11px] text-muted-foreground font-mono">
            app.minia.ai / create
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDemoMinimized(!demoMinimized)}
              className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
              aria-label={demoMinimized ? "Agrandir la démo" : "Réduire la démo"}
            >
              {demoMinimized ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEMO_MINIS.map((m, i) => (
              <motion.div
                key={m.src}
                initial={{ opacity: 0, y: 20, scale: 0.92, rotate: 0 }}
                animate={demoMinimized ? { opacity: 0, y: 20, scale: 0.92 } : inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{ rotate: demoMinimized ? 0 : i % 2 === 0 ? -2 : 2 }}
                className={`relative rounded-lg overflow-hidden border border-border shadow-lg group ${
                  i === 0 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <img src={m.src} alt={m.alt} className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur text-[9px] font-bold text-foreground">
                  {m.label}
                </div>
                {i === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView && !demoMinimized ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ delay: 1.1 }}
                    className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-400/95 text-black text-[10px] font-bold"
                  >
                    <Zap className="w-2.5 h-2.5" /> Prête
                  </motion.div>
                )}
              </motion.div>
            ))}
            {/* Génération en cours */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={demoMinimized ? { opacity: 0 } : inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="relative rounded-lg overflow-hidden border border-dashed border-orange-400/40 bg-accent/50 flex flex-col items-center justify-center gap-1.5 aspect-video"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent"
              />
              <span className="text-[10px] text-muted-foreground">Génération…</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={demoMinimized ? { opacity: 0, y: 8 } : inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="mt-4 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              4 miniatures générées en 2,4 secondes
            </div>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-400 hover:bg-orange-500 text-black text-xs font-bold transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Essayer maintenant
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VideoTestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [demoMinimized, setDemoMinimized] = useState(false);

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-background relative overflow-hidden">
      {/* Glow de fond */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-400/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Badge style youthumb */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-400/12 border border-orange-400/25 text-orange-400 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Démo
          </span>
        </motion.div>

        {/* Titre percutant */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-foreground mb-4">
            Copie le style. <span className="text-orange-400">Génère en 30s.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
            Colle une inspiration, choisis un style, et Minia IA génère 4 variations virales avec ta face.
          </p>
        </motion.div>

        {/* Maquette produit animée */}
        <div className="mb-16">
          <ProductDemoFrame demoMinimized={demoMinimized} setDemoMinimized={setDemoMinimized} />
        </div>

        {/* Accroche signature */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-muted-foreground mb-16"
        >
          Leur vibe. Tes miniatures. <span className="text-foreground font-bold">30 secondes.</span>
        </motion.p>

        {/* Témoignages vidéo (uniquement si IDs YouTube réels configurés) */}
        {hasRealTestimonials && (
          <>
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-400/12 border border-orange-400/25 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">
                <Play className="w-3.5 h-3.5" />
                Ils en parlent
              </span>
            </div>

            <div className={`grid gap-6 mb-12 ${
              activeTestimonials.length === 1 ? "grid-cols-1 max-w-2xl mx-auto" :
              activeTestimonials.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
              "grid-cols-1 md:grid-cols-3"
            }`}>
              {activeTestimonials.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                  className="rounded-xl bg-card border border-border overflow-hidden group hover:border-orange-400/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-video relative bg-accent/50">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
                      title={video.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: video.avatarColor }}
                      >
                        {video.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{video.creator}</p>
                        <p className="text-xs text-muted-foreground">{video.subscribers}</p>
                      </div>
                    </div>

                    <blockquote className="text-sm text-foreground/80 leading-relaxed mb-4">
                      "{video.quote}"
                    </blockquote>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-400/10 border border-orange-400/25">
                      <TrendingUp className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-medium text-orange-400">{video.metric}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-black font-bold text-sm hover:shadow-lg hover:shadow-orange-400/25 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97]"
          >
            <Play className="w-4 h-4" />
            Créer mes miniatures
          </a>
        </motion.div>
      </div>
    </section>
  );
}
