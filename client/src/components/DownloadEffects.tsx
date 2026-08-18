/**
 * DownloadEffects — provider global de l'animation de téléchargement « ours IA liquide ».
 *
 * Permet de declencher l'animation de n'importe quelle page du site
 * (landing, dashboard, galerie, miniatures, notifications...) sans instancier
 * le composant localement :
 *
 *   const { triggerDownload } = useDownloadEffects();
 *   triggerDownload({ thumbnailUrl: "...", liquid: "orange" }, () => { ... });
 *
 * L'overlay se monte automatiquement a la racine (z-[150]).
 */
import React, { createContext, useCallback, useContext, useState } from "react";
import {
  DownloadAnimation,
  getDuration,
  type DownloadAnimationState,
} from "@/components/DownloadAnimation";

interface DownloadEffectsApi {
  triggerDownload: (state: DownloadAnimationState, onReady: () => void) => void;
  isRunning: boolean;
}

const DownloadEffectsContext = createContext<DownloadEffectsApi>({
  triggerDownload: () => {},
  isRunning: false,
});

export function useDownloadEffects() {
  return useContext(DownloadEffectsContext);
}

export function DownloadEffectsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DownloadAnimationState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const onReadyRef = React.useRef<(() => void) | null>(null);

  const triggerDownload = useCallback((next: DownloadAnimationState, onReady: () => void) => {
    onReadyRef.current = onReady;
    setState(next);
    setIsRunning(true);
  }, []);

  const onComplete = useCallback(() => {
    onReadyRef.current?.();
    onReadyRef.current = null;
    setIsRunning(false);
  }, []);

  return (
    <DownloadEffectsContext.Provider value={{ triggerDownload, isRunning }}>
      {children}
      {isRunning && <DownloadAnimation state={state} onComplete={onComplete} />}
    </DownloadEffectsContext.Provider>
  );
}

/** Durée d'animation actuelle (export pour usage ponctuel) */
export { getDuration };
