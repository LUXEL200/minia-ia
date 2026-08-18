/**
 * DownloadAnimation — animation de téléchargement « ours IA liquide » :
 * 1. Le rectangle se remplit progressivement de liquide (palette configurable)
 * 2. L'ours IA verse le liquide depuis le haut
 * 3. Une fois rempli, l'ours s'enfuit et la miniature du YouTubeur apparaît
 *
 * Palettes : « multicolor » (défaut), « orange », « white ».
 * Durée : 3400 ms desktop, 3000 ms sur mobile (écran < 640 px).
 *
 * Usage :
 *   const { run, isRunning } = useDownloadAnimation();
 *   run({ thumbnailUrl: "...", title: "...", liquid: "orange" });
 *   {isRunning && <DownloadAnimation state={...} onComplete={...} />}
 */
import { useEffect, useRef, useState } from "react";

const BEAR_POUR = "/manus-storage/bear-ai-pour_92862632.png";
const BEAR_RUN = "/manus-storage/bear-ai-run_7980f85e.png";
const DURATION_DESKTOP_MS = 3400;
const DURATION_MOBILE_MS = 3000; // raccourci sur petit écran

export type LiquidTheme = "multicolor" | "orange" | "white";

export type DownloadAnimationState = {
  thumbnailUrl?: string;
  title?: string;
  liquid?: LiquidTheme;
};

const LIQUID_GRADIENTS: Record<LiquidTheme, string> = {
  multicolor:
    "linear-gradient(180deg, rgba(255,120,50,0.85) 0%, rgba(200,60,180,0.8) 35%, rgba(60,120,255,0.85) 70%, rgba(30,60,140,0.95) 100%)",
  orange:
    "linear-gradient(180deg, rgba(255,190,90,0.9) 0%, rgba(255,140,50,0.9) 40%, rgba(235,90,30,0.95) 100%)",
  white:
    "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(235,238,245,0.95) 45%, rgba(200,210,225,0.98) 100%)",
};

const isMobile = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(max-width: 640px)").matches || window.innerWidth < 640);

export function useDownloadAnimation() {
  const [state, setState] = useState<DownloadAnimationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const run = (next: DownloadAnimationState) => {
    setState(next);
    setIsRunning(true);
    setIsDone(false);
  };

  // isRunning passe à false après la fin de l'animation
  useEffect(() => {
    if (!isRunning) return;
    const dur = isMobile() ? DURATION_MOBILE_MS : DURATION_DESKTOP_MS;
    const t = setTimeout(() => {
      setIsRunning(false);
      setIsDone(true);
    }, dur + 700);
    return () => clearTimeout(t);
  }, [isRunning]);

  return { run, isRunning, isDone, reset: () => { setIsRunning(false); setIsDone(false); setState(null); } };
}

export function getDuration() {
  return isMobile() ? DURATION_MOBILE_MS : DURATION_DESKTOP_MS;
}

/**
 * Composant d'animation plein écran (overlay).
 */
export function DownloadAnimation({
  state,
  onComplete,
}: {
  state: DownloadAnimationState | null;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<"fill" | "reveal">("fill");
  const [progress, setProgress] = useState(0); // 0..100
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const liquid: LiquidTheme = state?.liquid ?? "multicolor";

  useEffect(() => {
    const duration = getDuration();
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhase("reveal");
        const t = setTimeout(() => onComplete?.(), 750);
        return () => clearTimeout(t);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onComplete]);

  // L'ours s'enfuit après le remplissage
  const bearRun = phase === "reveal";

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md"
      aria-hidden="true"
    >
      {/* Conteneur de l'animation */}
      <div className="relative flex flex-col items-center gap-5">
        {/* Rectangle qui se remplit */}
        <div
          className="relative w-72 sm:w-80 h-40 sm:h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {/* Liquide avec vagues (palette selon le thème choisi) */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${progress}%`,
              background: LIQUID_GRADIENTS[liquid],
              transition: "height 0.1s linear",
            }}
          >
            {/* Vagues animées en haut du liquide */}
            <div className="liquid-waves absolute -top-2 left-0 w-[200%] h-4" />
          </div>

          {/* L'ours qui verse (positionné au-dessus du rectangle) */}
          {!bearRun && (
            <div
              className="bear-pour absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-24 z-10 pointer-events-none"
              style={{ filter: "drop-shadow(0 8px 24px rgba(255,140,50,0.5))" }}
            >
              <img src={BEAR_POUR} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Miniature révélée */}
          {phase === "reveal" && state?.thumbnailUrl && (
            <div className="reveal-img absolute inset-0 z-20">
              <img
                src={state.thumbnailUrl}
                alt={state.title || "Miniature"}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          )}

          {/* Progression en % pendant le remplissage */}
          {phase === "fill" && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <span className="text-white font-bold text-3xl drop-shadow-lg tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>

        {/* Texte sous l'animation */}
        <p className="text-white/90 text-sm font-medium tracking-wide animate-in fade-in duration-300">
          {phase === "fill" ? "L'ours IA prépare ta miniature…" : "Terminé ! Miniature prête"}
        </p>

        {/* L'ours qui s'enfuit (transition finale) */}
        {bearRun && (
          <img
            src={BEAR_RUN}
            alt=""
            className="bear-flee absolute -bottom-24 -right-8 w-28 h-28 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
