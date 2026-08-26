import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Layers, Sparkles, X } from "lucide-react";
import { buildCanvasRoute } from "@/lib/generationCanvasRoute";

export { buildCanvasRoute };

export type GenerationCanvasPayload = {
  imageUrl: string;
  prompt: string;
  style: string;
  styleLabel: string;
};

type GenerationCanvasTransitionProps = {
  payload: GenerationCanvasPayload;
  onOpen: () => void;
  onCancel: () => void;
};


const steps = [
  { label: "Brief reçu", caption: "Ton idée est prête" },
  { label: "Variantes prêtes", caption: "La meilleure piste est sélectionnée" },
  { label: "Canvas prêt", caption: "Dernière retouche avant export" },
];

export default function GenerationCanvasTransition({
  payload,
  onOpen,
  onCancel,
}: GenerationCanvasTransitionProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(8);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    setActiveStep(0);
    setProgress(8);

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      setProgress(Math.min(100, Math.round((elapsed / 1500) * 100)));
      if (elapsed < 1500) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const firstStep = window.setTimeout(() => setActiveStep(1), 420);
    const secondStep = window.setTimeout(() => setActiveStep(2), 820);
    const openTimer = window.setTimeout(() => onOpenRef.current(), 1650);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(firstStep);
      window.clearTimeout(secondStep);
      window.clearTimeout(openTimer);
    };
  }, [payload.imageUrl]);

  return (
    <AnimatePresence>
      <motion.div
        key="generation-canvas-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto bg-[#05070d]/90 p-4 backdrop-blur-xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generation-transition-title"
        aria-describedby="generation-transition-description"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-orange-400/25 bg-[#0a0f1c] shadow-[0_30px_120px_-40px_rgba(249,115,22,.75)]"
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_0%,rgba(249,115,22,.16),transparent_35%),radial-gradient(circle_at_90%_100%,rgba(52,87,170,.16),transparent_40%)]" />
          <div className="relative">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-orange-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300 shadow-[0_0_14px_rgba(249,115,22,.9)]" />
                Passage vers le Canvas
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Rester sur le tableau de bord"
                title="Rester sur le tableau de bord"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[.9fr_1.1fr] md:items-center">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-300/25 bg-orange-400/10 text-orange-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 id="generation-transition-title" className="font-display text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">
                  Ta miniature est prête.
                </h2>
                <p id="generation-transition-description" className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                  On prépare ton espace de travail pour que tu puisses ajuster chaque détail dans le Canvas.
                </p>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/[.04] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-orange-400/10 px-2.5 py-1 text-[10px] font-medium text-orange-200">{payload.styleLabel}</span>
                    <span className="text-[10px] text-white/40">{progress}%</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/60">{payload.prompt}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-orange-200"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2">
                <motion.img
                  src={payload.imageUrl}
                  alt="Miniature générée prête à être modifiée dans le Canvas"
                  className="aspect-video w-full rounded-xl object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                />
                <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between rounded-lg border border-white/15 bg-black/55 px-3 py-2 backdrop-blur-md">
                  <span className="flex items-center gap-2 text-[10px] text-white/75"><Layers className="h-3.5 w-3.5 text-orange-200" /> Édition libre</span>
                  <Check className="h-4 w-4 text-orange-200" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-5 sm:px-8">
              <div className="grid gap-3 sm:grid-cols-3">
                {steps.map((step, index) => {
                  const complete = index <= activeStep;
                  return (
                    <div key={step.label} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${complete ? "border-orange-300/30 bg-orange-400/[.08]" : "border-white/10 bg-white/[.02]"}`}>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${complete ? "border-orange-200 bg-orange-300 text-[#15100b]" : "border-white/20 text-white/40"}`}>
                        {complete ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-xs font-medium ${complete ? "text-white" : "text-white/45"}`}>{step.label}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-white/40">{step.caption}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={onCancel} className="text-xs text-white/45 transition-colors hover:text-white">Rester sur le dashboard</button>
                <button type="button" onClick={onOpen} className="inline-flex items-center justify-center rounded-full bg-orange-300 px-5 py-2.5 text-xs font-semibold text-[#15100b] transition-transform hover:-translate-y-0.5 active:scale-[.98]">
                  Ouvrir le Canvas <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

