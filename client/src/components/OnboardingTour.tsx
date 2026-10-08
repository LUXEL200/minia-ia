import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Étapes du tutoriel d'onboarding — chaque step cible un sélecteur DOM du Dashboard */
export const ONBOARDING_STEPS = [
  {
    selector: null,
    title: "Bienvenue dans Minia IA !",
    description:
      "Ton espace de création de miniatures YouTube par IA. On va te montrer l'essentiel en 6 étapes rapides — tu peux passer ou rejouer la visite à tout moment.",
  },
  {
    selector: "[data-tour=\"stats\"]",
    title: "Tes statistiques",
    description:
      "Le miniatures, générations, avatars et crédits disponibles d'un coup d'œil. Les cartes se mettent à jour en temps réel.",
  },
  {
    selector: "[data-tour=\"create\"]",
    title: "Créer une miniature",
    description:
      "Point de départ : clique ici pour décrire ta miniature et laisser l'IA en générer jusqu'à 4 variantes en quelques secondes.",
  },
  {
    selector: "[data-tour=\"recent\"]",
    title: "Tes générations",
    description:
      "Toutes tes miniatures apparaissent ici. Passe la souris pour accéder aux actions : favori, partager, valider, modifier ou supprimer (restaurable depuis la Poubelle).",
  },
  {
    selector: "[data-tour=\"search\"]",
    title: "Recherche globale",
    description:
      "Ctrl+K (ou depuis le menu) : retrouve instantanément une miniature dans ton historique, tes favoris, la galerie ou la poubelle.",
  },
  {
    selector: "[data-tour=\"hamburger\"]",
    title: "Tout est dans le menu",
    description:
      "L'espace Canva, les templates, l'A/B test, l'organisation, les notifications et tous les paramètres sont accessibles depuis ce menu, présent sur toutes les pages.",
  },
];

const LS_KEY = "minia-onboarding-done-v1";

function stepRect(selector: string | null): DOMRect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = (el as HTMLElement).getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
}

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) setDismissed(true);
  }, []);

  const done = () => {
    localStorage.setItem(LS_KEY, "1");
    setDismissed(true);
  };

  const next = () => (step + 1 >= ONBOARDING_STEPS.length ? done() : setStep(step + 1));
  const prev = () => setStep(Math.max(0, step - 1));
  const skip = done;

  const current = ONBOARDING_STEPS[step];
  const rect = stepRect(current.selector);

  // Positionner la bulle : sous l'élément s'il est visible, sinon centrée
  const isIntro = !rect;
  const bubbleWidth = Math.min(380, Math.max(280, window.innerWidth - 32));
  const bubbleStyle: React.CSSProperties = isIntro
    ? { top: "14%", left: Math.max(16, (window.innerWidth - bubbleWidth) / 2) }
    : {
        top: Math.min(window.innerHeight - 260, rect.bottom + 16),
        left: Math.min(Math.max(rect.left, 16), Math.max(16, window.innerWidth - bubbleWidth - 16)),
      };

  return (
    <AnimatePresence>
      {!dismissed && (
        <div className="fixed inset-0 z-[100] pointer-events-none" data-onboarding-tour>
          {/* Voile sombre */}
          <motion.div
            className="absolute inset-0 bg-midnight-deep/60 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          {/* Spotlight sur l'élément cible */}
          {rect && (
            <motion.div
              className="absolute pointer-events-none rounded-xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              initial={false}
              animate={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              style={{ boxShadow: "0 0 0 9999px rgba(10, 14, 30, 0.5)" }}
            />
          )}

          {/* Bulle de tutoriel */}
          <motion.div
            className="absolute pointer-events-auto max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-2xl"
            style={{ ...bubbleStyle, width: bubbleWidth }}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-7 h-7 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </span>
                <span className="min-w-0 truncate text-[10px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Visite guidée · {step + 1}/{ONBOARDING_STEPS.length}
                </span>
              </div>
              <button
                onClick={skip}
                className="touch-target shrink-0 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fermer la visite"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-display font-bold text-base mb-1.5">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
            {/* Barre de progression */}
            <div className="flex gap-1 mt-3">
              {ONBOARDING_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                    i <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={step === 0}
                className="w-full sm:w-auto justify-center text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Précédent
              </Button>
              <Button size="sm" onClick={next} className="w-full sm:w-auto justify-center">
                {step + 1 >= ONBOARDING_STEPS.length ? (
                  <>Commencer à créer</>
                ) : (
                  <>
                    Suivant <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Hook pour rejouer la visite depuis un bouton (ex : aide dans le dashboard) */
export function useReplayTour(): () => void {
  return () => {
    localStorage.removeItem(LS_KEY);
    window.location.reload();
  };
}
