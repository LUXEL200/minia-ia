/**
 * DownloadAnimation — animation de téléchargement « ours IA liquide » :
 * 1. Le rectangle se remplit progressivement de liquide (palette configurable)
 * 2. L'ours IA verse le liquide depuis le haut
 * 3. Une fois rempli, le compteur reste à 100 % tant que l'API génère ; puis
 *    l'ours s'enfuit et la miniature apparaît
 * 4. Si aucune miniature ne revient jamais, l'ours revient avec un panneau « Réessaie »
 *
 * Palettes : « multicolor » (défaut), « orange », « white ».
 * Durée : 3400 ms desktop, 3000 ms sur mobile (écran < 640 px).
 * Son « plouf » : Web Audio synthétisé, désactivable via localStorage « minia-sound ».
 *
 * Usage :
 *   const { run, isRunning } = useDownloadAnimation();
 *   run({ thumbnailUrl: "...", title: "...", liquid: "orange" });
 *   {isRunning && <DownloadAnimation state={...} onComplete={...} />}
 */
import { useEffect, useRef, useState } from "react";

// Mascotte de marque partagée par le header, le chargement, la génération et le téléchargement.
const BEAR_MASCOT = "/manus-storage/minia-bear-paint-logo-b_17324125.png";
const DURATION_DESKTOP_MS = 3400;
const DURATION_MOBILE_MS = 3000; // raccourci sur petit écran
const FAILURE_AFTER_MS = 30_000; // panneau « Réessaie » si rien n'est revenu après 30 s

export type LiquidTheme = "multicolor" | "orange" | "white";

export type DownloadAnimationState = {
  thumbnailUrl?: string;
  title?: string;
  liquid?: LiquidTheme;
  /**
   * Mode « génération » : l'ours IA remplit le rectangle pendant que la
   * miniature est créée côté API. Aucune révélation d'image avant que le
   * dashboard appelle showResult(url) avec la vraie miniature. Pas de
   * téléchargement automatique.
   */
  mode?: "download" | "generate";
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

/** Le son est activé par défaut ; l'utilisateur peut le désactiver dans Paramètres (stocké dans localStorage) */
export function isSoundEnabled(): boolean {
  try {
    if (typeof localStorage === "undefined") return true;
    const v = localStorage.getItem("minia-sound");
    return v !== "off";
  } catch {
    return true;
  }
}

/** Son « plouf » synthétisé (Web Audio, aucun fichier externe requis) */
let audioCtx: AudioContext | null = null;

export function playPlopSound() {
  if (!isSoundEnabled()) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioCtx ?? new Ctx();
    audioCtx = ctx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    // Goutte qui tombe : ton qui descend (fréquence glissante) + filtre passe-bas
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // Petit « splash » de bulles : bruit blanc court
    const len = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now + 0.15);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 900;
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(now + 0.15);
  } catch {
    // Audio non supporté — rien de grave
  }
}

export function useDownloadAnimation() {
  const [state, setState] = useState<DownloadAnimationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [soundOff, setSoundOff] = useState(false);

  const run = (next: DownloadAnimationState) => {
    setState({ mode: "download", ...next });
    setIsRunning(true);
    setIsDone(false);
  };

  /**
   * Mode « génération » : lance l'animation de remplissage pendant la création
   * d'une miniature (API). Passer `resultUrl` / `phaseForce="reveal"` au
   * composant <DownloadAnimation /> pour révéler la miniature quand l'API répond.
   */
  const runGenerate = (opts?: { liquid?: LiquidTheme; disableSound?: boolean }) => {
    setState({ mode: "generate", liquid: opts?.liquid ?? "multicolor" });
    if (opts?.disableSound) setSoundOff(true);
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

  return { run, runGenerate, state, isRunning, isDone, soundOff, reset: () => { setIsRunning(false); setIsDone(false); setState(null); setSoundOff(false); } };
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
  resultUrl,
  phaseForce,
  onRetry,
  disableSound,
}: {
  state: DownloadAnimationState | null;
  onComplete?: () => void;
  resultUrl?: string | null;
  phaseForce?: "reveal" | null;
  /** Appelée quand l'utilisateur clique « Réessayer » après un échec */
  onRetry?: () => void;
  /** Désactive le son « plouf » de la révélation */
  disableSound?: boolean;
}) {
  const [phase, setPhase] = useState<"fill" | "reveal" | "failed">("fill");
  const [progress, setProgress] = useState(0); // 0..100
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [stuckAtFull, setStuckAtFull] = useState(false);
  const plopPlayed = useRef(false);
  const [retryShown, setRetryShown] = useState(false);

  const liquid: LiquidTheme = state?.liquid ?? "multicolor";
  const genMode = state?.mode === "generate";
  const revealUrl = resultUrl ?? state?.thumbnailUrl;
  const displayProgress = stuckAtFull ? 100 : progress;

  useEffect(() => {
    if (phaseForce === "reveal") {
      setPhase("reveal");
      const t = setTimeout(() => onComplete?.(), 750);
      return () => clearTimeout(t);
    }
    const duration = getDuration();
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (genMode && !resultUrl) {
          // Le remplissage est terminé : rester à 100 % jusqu'au retour de l'API.
          // Ne jamais relancer une animation de respiration, qui pouvait boucler
          // autour d'une valeur intermédiaire et empêcher la fin visuelle.
          setStuckAtFull(true);
        } else {
          setPhase("reveal");
          const t = setTimeout(() => onComplete?.(), 750);
          return () => clearTimeout(t);
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete, genMode, resultUrl, phaseForce]);

  // Panneau « Réessaie » si rien n'est revenu après un délai long
  useEffect(() => {
    if (!genMode || !stuckAtFull || resultUrl) return;
    const t = setTimeout(() => {
      setRetryShown(true);
      setPhase("failed");
    }, FAILURE_AFTER_MS);
    return () => clearTimeout(t);
  }, [genMode, stuckAtFull, resultUrl]);

  // En mode generate, passer en reveal dès que l'API renvoie la miniature
  useEffect(() => {
    if (genMode && stuckAtFull && resultUrl && phaseForce !== "reveal") {
      setPhase("reveal");
      const t = setTimeout(() => onComplete?.(), 750);
      return () => clearTimeout(t);
    }
  }, [genMode, stuckAtFull, resultUrl, onComplete, phaseForce]);

  // Son « plouf » au moment de la révélation (une seule fois, désactivable)
  useEffect(() => {
    if (phase === "reveal" && !plopPlayed.current && !disableSound) {
      plopPlayed.current = true;
      playPlopSound();
    }
  }, [phase, disableSound]);

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
              height: `${displayProgress}%`,
              background: LIQUID_GRADIENTS[liquid],
              transition: "height 0.15s linear",
            }}
          >
            {/* Vagues animées en haut du liquide */}
            <div className="liquid-waves absolute -top-2 left-0 w-[200%] h-4" />
          </div>

          {/* L'ours qui verse (positionné au-dessus du rectangle) */}
          {!bearRun && phase !== "failed" && (
            <div
              className="bear-pour absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-24 z-10 pointer-events-none"
              style={{ filter: "drop-shadow(0 8px 24px rgba(255,140,50,0.5))" }}
            >
              <img src={BEAR_MASCOT} alt="" className="w-full h-full object-contain" onError={(event) => { event.currentTarget.src = "/minia-bear-favicon.png"; }} />
            </div>
          )}

          {/* Miniature révélée */}
          {phase === "reveal" && revealUrl && (
            <div className="reveal-img absolute inset-0 z-20">
              <img
                src={revealUrl}
                alt={state?.title || "Miniature"}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          )}

          {/* Progression en % pendant le remplissage (ou la respiration) */}
          {phase === "fill" && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <span className="text-white font-bold text-3xl drop-shadow-lg tabular-nums">
                {Math.round(displayProgress)}%
              </span>
            </div>
          )}

          {/* Panneau « Réessaie » si toutes les générations ont échoué */}
          {phase === "failed" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm">
              <img src={BEAR_MASCOT} alt="" className="w-16 h-16 object-contain" onError={(event) => { event.currentTarget.src = "/minia-bear-favicon.png"; }} />
              <p className="text-white text-xs font-medium">Oups, la génération a échoué</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white text-xs font-semibold shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  Réessayer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Texte sous l'animation */}
        <p className="text-white/90 text-sm font-medium tracking-wide animate-in fade-in duration-300">
          {phase === "fill"
            ? genMode
              ? stuckAtFull
                ? "L'ours IA finalise ta miniature…"
                : "L'ours IA crée ta miniature…"
              : "L'ours IA prépare ta miniature…"
            : phase === "failed"
              ? "Réessaie quand tu veux"
              : "Terminé ! Miniature prête"}
        </p>

        {/* L'ours qui s'enfuit (transition finale) */}
        {bearRun && (genMode && !revealUrl ? null : (
          <img
            src={BEAR_MASCOT}
            alt=""
            className="bear-flee absolute -bottom-24 -right-8 w-28 h-28 pointer-events-none"
            onError={(event) => { event.currentTarget.src = "/minia-bear-favicon.png"; }}
          />
        ))}
      </div>
    </div>
  );
}
