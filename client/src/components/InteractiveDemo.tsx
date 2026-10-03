import { useEffect, useState } from "react";
import { ArrowRight, MousePointer2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_BRIEF = "Une vidéo sur les erreurs qui ruinent ta chaîne YouTube";
const DEMO_THUMB = "/manus-storage/thumbnail-dramatic_1e94decd.png";

export default function InteractiveDemo({ onStart }: { onStart: () => void }) {
  const [brief, setBrief] = useState("");
  const [style, setStyle] = useState("Dramatique");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

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

  const runDemo = () => {
    if (!brief.trim()) return;
    setRunning(true);
    setDone(false);
    window.setTimeout(() => { setRunning(false); setDone(true); }, 1500);
  };

  return (
    <div className="interactive-demo relative overflow-hidden rounded-xl border border-orange-400/25 bg-[#09090b] text-left shadow-[0_18px_60px_-30px_rgba(249,115,22,.8)]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[10px] text-white/45">
        <span className="h-2 w-2 rounded-full bg-orange-400" /><span className="h-2 w-2 rounded-full bg-orange-400/50" /><span className="h-2 w-2 rounded-full bg-orange-400/25" />
        <span className="ml-2 font-mono">minia.ai / brief</span>
        <span className="ml-auto uppercase tracking-[.16em] text-orange-300">Démo interactive</span>
      </div>
      <div className="grid gap-5 p-4 sm:grid-cols-[1.1fr_.9fr] sm:p-6">
        <div>
          <p className="text-[10px] uppercase tracking-[.18em] text-orange-300">1 · Décris ton idée</p>
          <label className="mt-3 block text-sm font-medium text-white">Quel est le sujet de ta vidéo ?</label>
          <div className="relative mt-2">
            <textarea
              value={brief}
              onChange={(event) => { setBrief(event.target.value); setDone(false); }}
              rows={3}
              aria-label="Brief de démonstration"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[.04] p-3 text-sm leading-6 text-white outline-none transition-colors focus:border-orange-400/60"
              placeholder="Décris ta vidéo en quelques mots…"
            />
            <MousePointer2 className="demo-cursor pointer-events-none absolute bottom-3 right-3 h-5 w-5 fill-orange-300 text-white" aria-hidden="true" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Viral", "Minimaliste", "Dramatique"].map((item) => (
              <button key={item} type="button" onClick={() => setStyle(item)} className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${style === item ? "border-orange-300 bg-orange-400 text-[#14100c]" : "border-white/10 text-white/60 hover:border-orange-300/50"}`}>
                {item}
              </button>
            ))}
          </div>
          <Button type="button" onClick={runDemo} disabled={running || !brief.trim()} className="mt-4 w-full rounded-xl bg-orange-400 text-[#14100c] hover:bg-orange-300">
            {running ? <><Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Génération en cours…</> : <>Générer une variante <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
        <div className="flex min-h-[210px] flex-col justify-between rounded-xl border border-white/10 bg-white/[.03] p-3">
          <div>
            <p className="text-[10px] uppercase tracking-[.18em] text-white/45">2 · Résultat</p>
            {done ? (
              <img src={DEMO_THUMB} alt="Aperçu de miniature générée" className="mt-3 aspect-video w-full rounded-lg object-cover" />
            ) : (
              <div className="mt-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/10 text-center text-xs text-white/35">{running ? "L’ours IA prépare ta miniature…" : "Ton aperçu apparaîtra ici"}</div>
            )}
          </div>
          <button type="button" onClick={onStart} className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-orange-300/35 px-3 py-2 text-xs text-orange-200 transition-colors hover:bg-orange-400/10">
            Ouvrir le vrai générateur <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
