import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import BearState from "@/components/BearState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FileImage, FileText, Loader2, Sparkles, UploadCloud, X, CheckCircle2, AlertCircle } from "lucide-react";

type QueueItem = { id: string; prompt: string; preview?: string; source: "brief" | "image"; status: "queued" | "generating" | "completed" | "failed" };

export default function BatchUpload() {
  const { data: credits, isLoading: creditsLoading } = trpc.thumbnail.credits.useQuery();
  const generate = trpc.batch.generate.useMutation();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [brief, setBrief] = useState("");
  const [style, setStyle] = useState("viral");
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const isMax = credits?.planType === "max";
  const queued = useMemo(() => items.filter(item => item.status === "queued"), [items]);

  const addBrief = () => {
    const value = brief.trim();
    if (value.length < 10) {
      toast.error("Décris ta miniature en au moins 10 caractères.");
      return;
    }
    setItems(prev => [...prev, { id: crypto.randomUUID(), prompt: value, source: "brief", status: "queued" }]);
    setBrief("");
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 20 - items.length).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => setItems(prev => [...prev, {
        id: crypto.randomUUID(),
        prompt: `Créer une miniature YouTube professionnelle inspirée de l'image ${file.name}`,
        preview: String(reader.result),
        source: "image",
        status: "queued",
      }]);
      reader.readAsDataURL(file);
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const runBatch = async () => {
    if (!queued.length || generate.isPending) return;
    setItems(prev => prev.map(item => item.status === "queued" ? { ...item, status: "generating" } : item));
    setProgress(8);
    const timer = window.setInterval(() => setProgress(value => Math.min(value + 7, 88)), 500);
    try {
      const result = await generate.mutateAsync({ prompts: queued.map(item => item.prompt), style: style as "viral" | "mrbeast" | "minimalist" | "dramatic" | "tech" | "retro" });
      setItems(prev => prev.map((item, index) => ({ ...item, status: result.thumbnails[index]?.status === "completed" ? "completed" : "failed" })));
      setProgress(100);
      toast.success(`${result.successful} miniature(s) générée(s)`, { description: `${result.creditsRemaining} crédit(s) restant(s).` });
    } catch (error) {
      setItems(prev => prev.map(item => item.status === "generating" ? { ...item, status: "failed" } : item));
      toast.error(error instanceof Error ? error.message : "La génération en lot a échoué.");
      setProgress(0);
    } finally {
      window.clearInterval(timer);
    }
  };

  if (creditsLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-400" /></div>;
  if (!isMax) return <div className="min-h-screen bg-background text-foreground px-4 py-8"><div className="max-w-xl mx-auto"><PageHeader title="Batch Upload" subtitle="Workflow de génération en série" /><BearState title="Fonctionnalité réservée à Max" description="Le Batch Upload permet de préparer plusieurs briefs et images en une seule file d’attente." actionLabel="Voir les forfaits" onAction={() => { window.location.href = "/pricing"; }} /></div></div>;

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Batch Upload" subtitle="Prépare plusieurs briefs ou images, puis lance une génération suivie étape par étape." />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-orange-400" /><h2 className="font-semibold">Ajouter des briefs</h2></div>
              <Textarea value={brief} onChange={event => setBrief(event.target.value)} placeholder="Un brief par ajout — ex. Une miniature gaming avec une victoire spectaculaire…" className="min-h-28 resize-y" />
              <Button type="button" onClick={addBrief} className="mt-3 min-h-11 rounded-full bg-orange-500 text-white hover:bg-orange-400"><Sparkles className="w-4 h-4 mr-2" />Ajouter à la file</Button>
            </div>
            <div className="rounded-3xl border border-dashed border-orange-400/40 bg-orange-500/5 p-5 sm:p-6 text-center">
              <UploadCloud className="mx-auto w-8 h-8 text-orange-400 mb-2" />
              <h2 className="font-semibold">Importer plusieurs images</h2>
              <p className="text-sm text-muted-foreground mt-1">PNG, JPG ou WEBP · 20 éléments maximum</p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={event => addFiles(event.target.files)} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="mt-4 min-h-11 rounded-full"><FileImage className="w-4 h-4 mr-2" />Choisir des images</Button>
            </div>
          </section>
          <aside className="rounded-3xl border border-border bg-card p-5 h-fit lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-4"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">File d’attente</p><p className="text-2xl font-bold mt-1">{items.length}<span className="text-sm font-normal text-muted-foreground"> / 20</span></p></div><span className="rounded-full bg-orange-400/15 px-3 py-1 text-xs font-semibold text-orange-400">MAX</span></div>
            <label className="text-sm font-medium">Style</label>
            <select value={style} onChange={event => setStyle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"><option value="viral">Viral</option><option value="mrbeast">MrBeast</option><option value="minimalist">Minimaliste</option><option value="dramatic">Dramatique</option><option value="tech">Tech</option><option value="retro">Rétro</option></select>
            <Button type="button" onClick={runBatch} disabled={!queued.length || generate.isPending} className="mt-4 w-full min-h-12 rounded-full bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-50">{generate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Générer {queued.length} élément(s)</Button>
            {progress > 0 && <div className="mt-5"><div className="flex justify-between text-xs text-muted-foreground mb-2"><span>Progression</span><span>{progress}%</span></div><Progress value={progress} /></div>}
            <Link href="/miniatures" className="block mt-4 text-center text-xs text-muted-foreground hover:text-foreground">Voir mes miniatures →</Link>
          </aside>
        </div>
        <section className="mt-6 rounded-3xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between"><h2 className="font-semibold">Éléments en attente</h2><span className="text-xs text-muted-foreground">{queued.length} à traiter</span></div>
          {items.length === 0 ? <div className="p-10"><BearState title="Ta file est vide" description="Ajoute des briefs ou importe plusieurs images pour commencer." /></div> : <div className="divide-y divide-border">{items.map(item => <div key={item.id} className="flex items-center gap-3 p-4"><div className="w-14 h-10 shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">{item.preview ? <img src={item.preview} alt="" className="w-full h-full object-cover" /> : <FileText className="w-4 h-4 text-muted-foreground" />}</div><p className="flex-1 min-w-0 text-sm truncate">{item.prompt}</p><span className={`text-xs flex items-center gap-1 ${item.status === "completed" ? "text-emerald-500" : item.status === "failed" ? "text-red-400" : item.status === "generating" ? "text-orange-400" : "text-muted-foreground"}`}>{item.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : item.status === "failed" ? <AlertCircle className="w-4 h-4" /> : item.status === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : "En attente"}</span>{item.status === "queued" && <button type="button" onClick={() => removeItem(item.id)} aria-label="Retirer de la file" className="min-w-11 min-h-11 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}</div>)}</div>}
        </section>
      </div>
    </main>
  );
}
