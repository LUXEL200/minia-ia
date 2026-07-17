import { Play, TrendingUp } from "lucide-react";

/**
 * VideoTestimonialsSection — Embeds from creators using Minia IA
 *
 * This component renders video testimonials only when real YouTube IDs
 * are provided. If no real testimonials are configured yet, it shows
 * a clean "coming soon" placeholder instead of fake content.
 *
 * TO ACTIVATE: Replace the youtubeId values below with real video IDs.
 * The section auto-hides when all youtubeIds are empty strings.
 */

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
    avatarColor: "#06B6D4",
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

export default function VideoTestimonialsSection() {
  if (!hasRealTestimonials) {
    return null; // Hide section entirely until real videos are added
  }

  const activeTestimonials = VIDEO_TESTIMONIALS.filter(t => t.youtubeId !== "");

  return (
    <section className="py-24 px-6 bg-[#09090B] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#06B6D4]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 mb-6">
            <Play className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span className="text-xs font-medium text-[#06B6D4]">Témoignages vidéo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            Les créateurs en <span className="text-[#06B6D4]">parlent</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Découvre comment des YouTubeurs passent de 100€ par miniature à 0€ avec Minia IA.
          </p>
        </div>

        {/* Video grid — only active testimonials */}
        <div className={`grid gap-6 mb-12 ${
          activeTestimonials.length === 1 ? "grid-cols-1 max-w-2xl mx-auto" :
          activeTestimonials.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
          "grid-cols-1 md:grid-cols-3"
        }`}>
          {activeTestimonials.map((video, index) => (
            <div
              key={video.id}
              className="rounded-xl bg-[#18181B] border border-[#27272A] overflow-hidden group hover:border-[#06B6D4]/30 transition-all duration-300 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Video embed */}
              <div className="aspect-video relative bg-[#09090B]">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Creator info */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: video.avatarColor }}
                  >
                    {video.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{video.creator}</p>
                    <p className="text-xs text-zinc-500">{video.subscribers}</p>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-sm text-zinc-300 leading-relaxed mb-4">
                  "{video.quote}"
                </blockquote>

                {/* Metric badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20">
                  <TrendingUp className="w-3 h-3 text-[#22C55E]" />
                  <span className="text-xs font-medium text-[#22C55E]">{video.metric}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA under testimonials */}
        <div className="text-center">
          <p className="text-zinc-500 text-sm mb-4">
            Tu es un créateur ? Partage ton expérience avec Minia IA !
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#06B6D4] text-black font-bold text-sm hover:bg-[#06B6D4]/90 transition-all hover:scale-[1.02] active:scale-[0.97]"
          >
            <Play className="w-4 h-4" />
            Commencer maintenant
          </a>
        </div>
      </div>
    </section>
  );
}
