/**
 * Testimonials Section — REAL user reviews only.
 * Reviews are collected via a public feedback form, submitted pending moderation,
 * and displayed on the landing page ONLY after admin approval (never fabricated).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, MessageSquarePlus, CheckCircle2, Clock, LogIn } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toastRich } from "@/lib/toasts";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import AnimatedSection, { StaggeredContainer, StaggeredItem } from "@/components/AnimatedSection";

export default function TestimonialsSection() {
  const { user, isAuthenticated } = useAuth();
  const { data: approved, isLoading } = trpc.testimonials.approved.useQuery();
  const createMut = trpc.testimonials.create.useMutation({
    onSuccess: () => {
      toastRich(
        "success",
        "Avis envoyé pour modération",
        { description: "Merci pour ton retour ! Après validation par notre équipe, il apparaîtra ici." }
      );
      setRating(5);
      setContent("");
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    },
    onError: () => {
      toastRich(
        "error",
        "Impossible d'envoyer l'avis",
        { description: "Vérifie que le texte fait au moins 10 caractères, puis réessaie." }
      );
    },
  });

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorChannel, setAuthorChannel] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toastRich("warning", "Connecte-toi d'abord", { description: "Ton avis sera lié à ton compte pour éviter les faux avis.", undo: { label: "Se connecter", onClick: startLogin } });
      startLogin();
      return;
    }
    if (content.trim().length < 10) {
      toastRich("warning", "Avis trop court", { description: "Écris au moins 10 caractères pour que ton retour soit utile." });
      return;
    }
    createMut.mutate({
      content: content.trim(),
      rating,
      authorName: authorName.trim() || undefined,
      authorChannel: authorChannel.trim() || undefined,
    });
  };

  const real = (approved ?? []).filter(Boolean);

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="container">
        <AnimatedSection animation="fade-up">
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-orange-400 mb-4 block">
              / Témoignages réels
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
              Ce que <span className="text-orange-400">les créateurs</span> en disent.
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4">
              Uniquement des avis réels, soumis par les utilisateurs connectés et validés par notre équipe. Aucun avis fictif n'est affiché.
            </p>
          </div>
        </AnimatedSection>

        {/* Real approved reviews (or honest empty state) */}
        {isLoading ? (
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="p-6 rounded-[20px] bg-muted border border-border animate-pulse h-44" />
            ))}
          </div>
        ) : real.length > 0 ? (
          <StaggeredContainer staggerDelay={120}>
            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 mb-16">
              {real.map((t, i) => (
                <StaggeredItem key={t.id}>
                  <motion.div
                    className="group relative p-6 rounded-[20px] bg-card/70 border border-border transition-all duration-300 hover:border-orange-400/50 hover:shadow-[0_8px_30px_rgba(251,146,60,0.12)]"
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    style={{ transformOrigin: "center" }}
                  >
                    <motion.span
                      aria-hidden
                      className="absolute inset-[1px] rounded-[19px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: "linear-gradient(135deg, rgba(251,146,60,0.06), rgba(74,222,128,0.06))" }}
                    />
                    <Quote className="w-6 h-6 text-orange-400/40 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-orange-400/70" />
                    <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                      &ldquo;{t.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-300 flex items-center justify-center text-white font-bold text-xs transition-transform duration-300 group-hover:scale-110">
                        {(t.authorName || t.authorChannel || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {t.authorName || (t.authorChannel && `@${t.authorChannel}`) || "Utilisateur vérifié"}
                        </p>
                        <p className="text-xs text-zinc-500">Avis vérifié</p>
                      </div>
                      <div className="ml-auto flex gap-0.5 transition-transform duration-300 group-hover:scale-105">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s < t.rating ? "fill-orange-400 text-orange-400" : "text-zinc-600"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </StaggeredItem>
              ))}
            </div>
          </StaggeredContainer>
        ) : (
          <div className="max-w-xl mx-auto text-center p-8 rounded-[20px] bg-muted border border-dashed border-border mb-16">
            <MessageSquarePlus className="w-8 h-8 text-orange-400/60 mx-auto mb-3" />
            <p className="text-sm font-medium text-white">Soyez le premier à partager votre retour !</p>
            <p className="text-xs text-zinc-400 mt-1">
              Les avis réels des créateurs apparaîtront ici dès la première validation.
            </p>
          </div>
        )}

        {/* Public feedback form */}
        <AnimatedSection animation="fade-up">
          <div className="max-w-xl mx-auto p-6 rounded-[20px] bg-card/70 border border-border backdrop-blur-sm">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-orange-400" />
              Partage ton expérience
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              Ton avis sera soumis à modération avant publication — nous n'affichons jamais de faux témoignages.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star className={`w-6 h-6 ${s <= rating ? "fill-orange-400 text-orange-400" : "text-zinc-600"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Ce que tu as aimé avec Minia IA (minimum 10 caractères)..."
                rows={4}
                className="w-full px-4 py-3 rounded-[20px] bg-muted border border-border text-foreground text-sm placeholder:text-zinc-500 focus:border-orange-400/40 outline-none resize-none transition-all"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Ton nom (optionnel)"
                  className="px-4 py-2.5 rounded-[20px] bg-muted border border-border text-foreground text-xs placeholder:text-zinc-500 focus:border-orange-400/40 outline-none"
                />
                <input
                  value={authorChannel}
                  onChange={e => setAuthorChannel(e.target.value)}
                  placeholder="Ta chaîne YouTube (optionnel)"
                  className="px-4 py-2.5 rounded-[20px] bg-muted border border-border text-foreground text-xs placeholder:text-zinc-500 focus:border-orange-400/40 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={createMut.isPending}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createMut.isPending ? "Envoi..." : sent ? "Avis envoyé ✓" : "Envoyer mon avis"}
              </button>
            </form>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
