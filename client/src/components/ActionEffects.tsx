import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

// ------------------------------------------------------------------
// ActionEffects — effets spéciaux déclenchés par les actions utilisateur
// (activer, supprimer, modifier, enregistrer, sauvegarder, télécharger)
// ------------------------------------------------------------------

export type ActionEffectType =
  | "confetti" // sauvegarder / télécharger / réussite
  | "flash"    // activer / modifier / enregistrer
  | "shake"    // supprimer / erreur
  | "pop";     // clic bouton

type ActionEffectsApi = {
  triggerConfetti: (origin?: { x: number; y: number }) => void;
  triggerFlash: () => void;
  triggerShake: () => void;
  triggerPop: () => void;
};

const ActionEffectsContext = createContext<ActionEffectsApi | null>(null);

export function ActionEffectsProvider({ children }: { children: ReactNode }) {
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiOrigin, setConfettiOrigin] = useState<{ x: number; y: number } | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [popKey, setPopKey] = useState(0);

  const triggerConfetti = useCallback((origin?: { x: number; y: number }) => {
    setConfettiOrigin(origin ?? { x: 0.5, y: 0.4 });
    setConfettiKey(k => k + 1);
  }, []);

  const triggerFlash = useCallback(() => setFlashKey(k => k + 1), []);
  const triggerShake = useCallback(() => setShakeKey(k => k + 1), []);
  const triggerPop = useCallback(() => setPopKey(k => k + 1), []);

  return (
    <ActionEffectsContext.Provider value={{ triggerConfetti, triggerFlash, triggerShake, triggerPop }}>
      {children}
      <ConfettiOverlay key={`confetti-${confettiKey}`} origin={confettiOrigin} />
      <FlashOverlay key={`flash-${flashKey}`} />
      <ShakeMarker key={`shake-${shakeKey}`} />
      <PopMarker key={`pop-${popKey}`} />
    </ActionEffectsContext.Provider>
  );
}

export function useActionEffect(): ActionEffectsApi {
  const api = useContext(ActionEffectsContext);
  return (
    api ?? {
      triggerConfetti: () => {},
      triggerFlash: () => {},
      triggerShake: () => {},
      triggerPop: () => {},
    }
  );
}

// ------------------------------------------------------------------
// Confetti — particules canvas légères (~30) depuis l'origine
// ------------------------------------------------------------------
function ConfettiOverlay({ origin }: { origin: { x: number; y: number } | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;

  const colors = ["#fb923c", "#fdba74", "#1e2a4a", "#f8fafc", "#38bdf8", "#f59e0b"];
  const particles = Array.from({ length: 34 }, (_, i) => ({
    x: (origin?.x ?? 0.5) * viewportWidth + (Math.random() - 0.5) * 120,
    y: (origin?.y ?? 0.4) * viewportHeight,
    vx: (Math.random() - 0.5) * 10,
    vy: -Math.random() * 12 - 4,
    g: 0.45 + Math.random() * 0.15,
    size: 4 + Math.random() * 5,
    color: colors[i % colors.length],
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.35,
    life: 1,
    decay: 0.008 + Math.random() * 0.008,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    let frameId = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        p.life -= p.decay;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (alive) frameId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [origin]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[120] pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ------------------------------------------------------------------
// Flash — halo orange rapide couvrant l'écran
// ------------------------------------------------------------------
function FlashOverlay() {
  if (typeof window === "undefined") return null;
  return (
    <div
      className="fixed inset-0 z-[115] pointer-events-none animate-action-flash"
      aria-hidden="true"
    />
  );
}

// ------------------------------------------------------------------
// Shake — secousse visuelle déclenchée via event DOM sur .shake-target
// ------------------------------------------------------------------
function ShakeMarker() {
  if (typeof window === "undefined") return null;
  // Déclenche l'animation shake sur tous les éléments .shake-target visibles
  requestAnimationFrame(() => {
    document
      .querySelectorAll<HTMLElement>(".shake-target")
      .forEach(el => {
        el.classList.remove("animate-action-shake");
        void el.offsetWidth; // reflow
        el.classList.add("animate-action-shake");
        el.addEventListener(
          "animationend",
          () => el.classList.remove("animate-action-shake"),
          { once: true }
        );
      });
    // Si rien de ciblé, secouer la page (conteneur principal)
    const main = document.querySelector<HTMLElement>("main") ?? document.body;
    if (!document.querySelector(".shake-target")) {
      main.classList.remove("animate-action-shake");
      void main.offsetWidth;
      main.classList.add("animate-action-shake");
      main.addEventListener(
        "animationend",
        () => main.classList.remove("animate-action-shake"),
        { once: true }
      );
    }
  });
  return null;
}

// ------------------------------------------------------------------
// Pop — pulse sur tous les boutons ciblés (.pop-target)
// ------------------------------------------------------------------
function PopMarker() {
  if (typeof window === "undefined") return null;
  requestAnimationFrame(() => {
    document
      .querySelectorAll<HTMLElement>(".pop-target")
      .forEach(el => {
        el.classList.remove("animate-action-pop");
        void el.offsetWidth;
        el.classList.add("animate-action-pop");
        el.addEventListener(
          "animationend",
          () => el.classList.remove("animate-action-pop"),
          { once: true }
        );
      });
  });
  return null;
}

// ------------------------------------------------------------------
// Bouton à effet pop : pop sur clic (activer / enregistrer / télécharger)
// ------------------------------------------------------------------
export function PopButton({
  children,
  onClick,
  effect,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { effect?: "confetti" | "flash" | "none" }) {
  const api = useActionEffect();
  const ref = useRef<HTMLButtonElement>(null);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    api.triggerPop();
    if (effect === "confetti") {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      api.triggerConfetti({
        x: rect.left / window.innerWidth + rect.width / 2 / window.innerWidth,
        y: rect.top / window.innerHeight,
      });
    } else if (effect === "flash") {
      api.triggerFlash();
    }
    onClick?.(e);
  };
  return (
    <button ref={ref} onClick={handleClick} className="pop-target" {...props}>
      {children}
    </button>
  );
}
