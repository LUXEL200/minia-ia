import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MousePointer2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const DEMO_BRIEF = "Une vidéo sur les erreurs qui ruinent ta chaîne YouTube";
const STYLE_IDS = { Viral: "viral", Minimaliste: "minimalist", Dramatique: "dramatic" } as const;
type DemoStyle = keyof typeof STYLE_IDS;

function playDemoSound(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(780, audio.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, audio.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.22);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.24);
    window.setTimeout(() => void audio.close(), 350);
  } catch {
    // Les navigateurs peuvent refuser l’AudioContext avant une interaction utilisateur.
  }
}

export default function InteractiveDemo({ onStart }: { onStart: () => void }) {
  const [brief, setBrief] = useState("");
  const [style, setStyle] = useState<DemoStyle>("Dramatique");
  const [running, setRunning] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem("minia-demo-sound") !== "off"; } catch { return true; }
  });
  const [remaining, setRemaining] = useState<number | null>(null);
  const { data: config } = trpc.demo.config.useQuery();
  const demoGeneration = trpc.demo.generate.useMutation();

  useEffect(() => {
    if (brief || running) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setBrief(DEMO_BRIEF.slice(0, index));
      if (index >= DEMO_BRIEF.length) window.clearInterval(timer);
    }, 34);
    return () => window.clearInterval(timer);
  }, [brief, running]);

  useEffect(() => {
    try { localStorage.setItem("minia-demo-sound", soundEnabled ? "on" : "off"); } catch { /* stockage local indisponible */ }
  }, [soundEnabled]);

  const isAvailable = config?.enabled !== false;
  const runDemo = async () => {
    if (!brief.trim() || running || !isAvailable) return;
    setRunning(true);
    setImageUrl(null);
    setError(null);
    try {
      const result = await demoGeneration.mutateAsync({ prompt: brief, style: STYLE_IDS[style] });
      setImageUrl(result.imageUrl);
      setRemaining(result.remaining);
      playDemoSound(soundEnabled);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La génération invitée a échoué.");
    } finally {
      setRunning(false);
    }
  };

  const statusText = useMemo(() => {
    if (running) return "L’ours IA prépare ta miniature…";
    if (error) return error;
    if (imageUrl) return remaining === 0 ? "Dernier essai invité utilisé" : `Miniature prête · ${remaining ?? "—"} essai(s) restant(s)`;
    return "Ton aperçu apparaîtra ici";
  }, [running, error, imageUrl, remaining]);

  return (
    <div className="interactive-demo relative overflow-hidden rounded-xl border border-orange-400/25 bg-[#09090b] text-left shadow-[0_18px_60px_-30px_rgba(249,115,22,.8)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[10px] text-white/45">
        <span className="h-2 w-2 rounded-full bg-orange-400" /><span className="h-2 w-2 rounded-full bg-orange-400/50" /><span className="h-2 w-2 rounded-full bg-orange-400/25" />
        <span className="ml-2 font-mono">minia.ai / brief</span>
        <span className="ml-auto uppercase tracking-[.16em] text-orange-300">Démo réelle · {config?.dailyLimit ?? 2} essais/jour</span>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-[1.1fr_.9fr] sm:p-6">
        <div>
          <p className="text-[10px] uppercase tracking-[.18em] text-orange-300">1 · Décris ton idée</p>
          <label className="mt-3 block text-sm font-medium text-white">Quel est le sujet de ta vidéo ?</label>
          <div className="relative mt-2">
            <textarea value={brief} onChange={(event) => { setBrief(event.target.value); setImageUrl(null); setError(null); }} rows={3} aria-label="Brief de démonstration" className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm leading-6 text-white outline-none transition-colors focus:border-orange-400/60" placeholder="Décris ta vidéo en quelques mots…" />
            <MousePointer2 className="demo-cursor pointer-events-none absolute bottom-3 right-3 h-5 w-5 fill-orange-300 text-white" aria-hidden="true" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(STYLE_IDS) as DemoStyle[]).map((item) => <button key={item} type="button" onClick={() => setStyle(item)} className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${style === item ? "border-orange-300 bg-orange-400 text-[#14100c]" : "border-white/10 text-white/60 hover:border-orange-300/50"}`}>{item}</button>)}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setSoundEnabled(value => !value)} className="inline-flex items-center gap-1.5 text-[11px] text-white/55 hover:text-white" aria-pressed={soundEnabled} title={soundEnabled ? "Désactiver le son" : "Activer le son"}>{soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}{soundEnabled ? "Son activé" : "Son désactivé"}</button>
            <span className="text-[10px] text-white/35">Aucune inscription · quota anti-abus</span>
          </div>
          <Button type="button" onClick={runDemo} disabled={running || !brief.trim() || !isAvailable} className="mt-4 w-full rounded-xl bg-orange-400 text-[#14100c] hover:bg-orange-300 disabled:opacity-50">
            {running ? <><Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Génération réelle…</> : <>{isAvailable ? "Générer une variante" : "Démo temporairement fermée"} <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
        <div className="flex min-h-[210px] flex-col justify-between rounded-xl border border-white/10 bg-white/[.03] p-3">
          <div>
            <p className="text-[10px] uppercase tracking-[.18em] text-white/45">2 · Résultat Forge</p>
            {imageUrl ? <img src={imageUrl} alt="Aperçu de miniature générée" className="mt-3 aspect-video w-full rounded-lg object-cover" /> : <div className={`mt-3 flex aspect-video items-center justify-center rounded-lg border border-dashed text-center text-xs ${error ? "border-red-400/30 text-red-200/80" : "border-white/10 text-white/35"}`}>{statusText}</div>}
          </div>
          <button type="button" onClick={onStart} className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-orange-300/35 px-3 py-2 text-xs text-orange-200 transition-colors hover:bg-orange-400/10">Ouvrir le vrai générateur <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
