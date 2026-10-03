import { motion } from "framer-motion";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Image as ImageIcon,
  LayoutTemplate,
  MousePointer2,
  Play,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InteractiveDemo from "@/components/InteractiveDemo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const fallbackThumbs = [
  "/manus-storage/thumbnail-mrbeast_fc8fbcd3.png",
  "/manus-storage/thumbnail-tech_81d69968.png",
  "/manus-storage/thumbnail-dramatic_1e94decd.png",
  "/manus-storage/thumbnail-mrbeast_fc8fbcd3.png",
  "/manus-storage/thumbnail-tech_81d69968.png",
  "/manus-storage/thumbnail-dramatic_1e94decd.png",
];

const heroDemoVideo = "/manus-storage/minia-ia-current-flow-demo_949660e2.mp4";
const heroDemoPoster = "/manus-storage/minia-ia-current-flow-poster_ca0fa27a.jpg";

const workflow = [
  { number: "01", icon: Wand2, title: "Décris ton idée", text: "Un sujet, une émotion, un style. Minia IA transforme ton intention en direction visuelle." },
  { number: "02", icon: LayoutTemplate, title: "Compare les variantes", text: "Génère plusieurs pistes et choisis celle qui porte le mieux ton titre et ton visage." },
  { number: "03", icon: SlidersHorizontal, title: "Finalise dans le Canvas", text: "Déplace, redimensionne, ajoute du texte et exporte une miniature prête pour YouTube." },
];

const faqs = [
  ["Combien de variantes puis-je générer ?", "Le générateur peut produire plusieurs variantes à partir d'une même idée afin de comparer les directions visuelles."],
  ["Puis-je importer ma propre image ?", "Oui. Tu peux importer une image comme fond ou comme calque modifiable dans l'éditeur Canvas."],
  ["Puis-je modifier une miniature après génération ?", "Oui. Chaque résultat peut être ouvert dans le Canvas pour ajuster le cadrage, les textes, les couleurs et les calques."],
  ["Le téléchargement ajoute-t-il un filigrane ?", "Le plan gratuit ajoute un filigrane Minia IA à l'export. Les offres supérieures sont prévues pour des exports sans filigrane."],
];

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.65, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: publicThumbs } = trpc.gallery.thumbnails.useQuery({ limit: 12 });
  const gallery = useMemo(() => {
    const remote = (publicThumbs ?? []).map(item => item.imageUrl).filter(Boolean) as string[];
    return remote.length > 0 ? remote : fallbackThumbs;
  }, [publicThumbs]);
  const marqueeGallery = [...gallery, ...gallery];

  const openGenerator = () => {
    if (isAuthenticated) navigate("/dashboard");
    else startLogin();
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden editorial-landing">
      <Navbar />
      <main>
        <section className="relative min-h-[calc(100vh-1rem)] flex items-center justify-center pt-28 pb-20 px-4">
          <div className="absolute inset-0 editorial-grid opacity-70 pointer-events-none" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[min(70vw,720px)] h-[420px] bg-orange-500/[0.07] blur-[120px] rounded-full pointer-events-none" />
          <div className="container relative z-10 max-w-5xl text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-card/70 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(249,115,22,.85)]" />
                Générateur de miniatures par IA
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-8 font-display text-5xl sm:text-6xl lg:text-[5.7rem] font-semibold tracking-[-0.065em] leading-[0.94]">
                Crée des miniatures
                <br />
                <span className="font-serif italic font-normal text-orange-300">qui arrêtent le scroll.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mx-auto mt-7 max-w-2xl text-base sm:text-lg leading-8 text-muted-foreground">
                Décris ta vidéo, choisis une direction et obtiens des variantes prêtes à tester — puis ajuste chaque détail dans ton Canvas.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={openGenerator} className="rounded-full bg-orange-400 px-7 py-6 text-sm font-semibold text-[#14100c] shadow-[0_12px_40px_-15px_rgba(249,115,22,.9)] transition-transform hover:-translate-y-0.5 hover:bg-orange-300 active:scale-[.97]">
                  Créer ma miniature <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link href="/gallery" className="inline-flex items-center rounded-full border border-border bg-card/40 px-7 py-3.5 text-sm text-foreground transition-colors hover:border-orange-400/50 hover:bg-card">
                  <Play className="mr-2 h-4 w-4 text-orange-300" /> Voir la galerie
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-orange-300" /> Sans page blanche</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-orange-300" /> Canvas inclus</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-orange-300" /> Export PNG</span>
              </div>
            </Reveal>

            <Reveal delay={0.36} className="mt-16 sm:mt-20">
              <div className="relative mx-auto max-w-4xl rounded-[1.5rem] border border-orange-400/25 bg-card/80 p-2 shadow-[0_30px_100px_-36px_rgba(249,115,22,.48)] backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2 text-left">
                  <span className="h-2 w-2 rounded-full bg-orange-400" /><span className="h-2 w-2 rounded-full bg-orange-400/50" /><span className="h-2 w-2 rounded-full bg-orange-400/25" />
                  <span className="ml-2 text-[10px] font-mono text-muted-foreground">minia.ai / generate</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> en attente d'une idée</span>
                </div>
                <div className="p-3">
                  <div className="relative overflow-hidden rounded-xl border border-border bg-background">
                    <video
                      className="block aspect-video w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
                      poster={heroDemoPoster}
                      aria-label="Démonstration vidéo du générateur de miniatures Minia IA"
                    >
                      <source src={heroDemoVideo} type="video/mp4" />
                      Ton navigateur ne peut pas lire cette vidéo. Lance directement le générateur pour découvrir Minia IA.
                    </video>
                    <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-[#09090b]/80 px-3 py-1.5 text-[10px] uppercase tracking-[.16em] text-orange-200 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-300" /> Démo produit
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 px-1 pt-4 text-left sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[.18em] text-orange-300">Brief → variantes → Canvas → export</p>
                      <p className="mt-1 text-xs text-muted-foreground">Créer une miniature → brief et style → génération → Canvas.</p>
                    </div>
                    <button onClick={openGenerator} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-400 px-3 py-2 text-[11px] font-semibold text-[#14100c] transition-transform hover:-translate-y-0.5">Essayer avec ton idée <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></button>
                  </div>
                  <div className="mt-5 border-t border-border/60 pt-5">
                    <InteractiveDemo onStart={openGenerator} />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-border/70 py-4 overflow-hidden bg-card/20">
          <div className="marquee-track flex w-max items-center gap-3 px-3">
            {marqueeGallery.map((src, index) => (
              <div key={`${src}-${index}`} className="h-20 w-36 sm:h-28 sm:w-52 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-card transition-transform duration-500 hover:-translate-y-1 hover:rotate-1">
                <img src={src} alt="Miniature YouTube générée" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </section>

        <section className="container py-28 sm:py-36">
          <Reveal>
            <div className="mb-12 max-w-2xl">
              <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-orange-300">Le workflow</p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-[-0.05em]">De l'idée à la miniature,<br /><span className="font-serif italic font-normal text-orange-300">sans repartir de zéro.</span></h2>
            </div>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item, index) => {
              const Icon = item.icon;
              return <Reveal key={item.number} delay={index * 0.08} className="h-full"><article className="editorial-card group h-full p-6 sm:p-8"><div className="flex items-start justify-between"><span className="font-mono text-xs text-orange-300">{item.number}</span><Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-orange-300" /></div><h3 className="mt-16 font-display text-xl font-semibold tracking-tight">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p></article></Reveal>;
            })}
          </div>
        </section>

        <section className="relative border-y border-border/70 bg-card/20 py-28 sm:py-36">
          <div className="container grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <Reveal><div><p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-orange-300">Le gain de temps</p><h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-[-0.055em]">Même vidéo.<br /><span className="font-serif italic font-normal text-orange-300">Deux façons de la préparer.</span></h2><p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">La page blanche ralentit les créateurs. Minia IA te donne une direction, des variantes et les outils pour décider rapidement.</p></div></Reveal>
            <Reveal delay={0.12}><div className="grid gap-4 sm:grid-cols-2"><div className="editorial-card p-6"><p className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">Avant · sans Minia IA</p><div className="mt-8 space-y-4 text-sm text-muted-foreground"><p className="flex gap-3"><span className="text-muted-foreground">×</span> Chercher une idée visuelle</p><p className="flex gap-3"><span className="text-muted-foreground">×</span> Construire la composition</p><p className="flex gap-3"><span className="text-muted-foreground">×</span> Refaire les exports</p></div></div><div className="editorial-card editorial-card-accent p-6"><p className="text-[10px] uppercase tracking-[.18em] text-orange-300">Après · avec Minia IA</p><div className="mt-8 space-y-4 text-sm text-foreground/90"><p className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-orange-300" /> Décrire ta vidéo</p><p className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-orange-300" /> Comparer les variantes</p><p className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-orange-300" /> Finaliser dans le Canvas</p></div></div></div></Reveal>
          </div>
        </section>

        <section className="container py-28 sm:py-36">
          <Reveal><div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-orange-300">Pour chaque format</p><h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-[-0.05em]">Des outils pour publier<br /><span className="font-serif italic font-normal text-orange-300">avec plus d'impact.</span></h2></div><Link href="/features" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">Voir toutes les fonctions <ArrowRight className="h-4 w-4" /></Link></div></Reveal>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[{ icon: Sparkles, title: "Styles cohérents", text: "Viral, tech, dramatique ou minimaliste." }, { icon: ImageIcon, title: "Image inspirée", text: "Ajoute une image ou un lien comme référence." }, { icon: MousePointer2, title: "Canvas", text: "Déplace, redimensionne et compose librement." }, { icon: Clock3, title: "Historique", text: "Retrouve tes générations, versions et favoris." }].map((item, index) => { const Icon = item.icon; return <Reveal key={item.title} delay={index * .06}><div className="editorial-card min-h-48 p-6"><Icon className="h-5 w-5 text-orange-300" /><h3 className="mt-10 font-display text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></div></Reveal>; })}
          </div>
        </section>

        <section className="container pb-28 sm:pb-36">
          <Reveal><div className="rounded-[1.5rem] border border-orange-400/30 bg-orange-400/[0.06] p-8 sm:p-12 text-center"><p className="text-[10px] uppercase tracking-[0.24em] text-orange-300">Prêt à créer ?</p><h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl sm:text-6xl font-semibold tracking-[-0.06em]">Arrête de repartir de zéro.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Transforme une idée en miniature lisible, expressive et prête à être testée sur YouTube.</p><Button onClick={openGenerator} className="mt-8 rounded-full bg-orange-400 px-7 py-6 font-semibold text-[#14100c] hover:bg-orange-300">Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" /></Button></div></Reveal>
        </section>

        <section className="container max-w-3xl pb-28 sm:pb-36" id="faq">
          <Reveal><div className="text-center"><p className="text-[10px] uppercase tracking-[0.24em] text-orange-300">FAQ</p><h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-[-0.05em]">Questions fréquentes</h2></div></Reveal>
          <div className="mt-10 divide-y divide-border border-y border-border">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left font-display text-sm font-medium"><span>{question}</span><ChevronDown className="h-4 w-4 shrink-0 text-orange-300 transition-transform group-open:rotate-180" /></summary><p className="max-w-2xl pt-4 text-sm leading-7 text-muted-foreground">{answer}</p></details>)}</div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
