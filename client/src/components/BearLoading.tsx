const BEAR_LOGO = "/manus-storage/minia-bear-paint-logo-b_17324125.png";

export default function BearLoading({ label = "Minia IA prépare ton espace…" }: { label?: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-center" role="status" aria-live="polite">
      <div className="bear-loading-mark" aria-hidden="true">
        <span className="bear-loading-paint" />
        <img src={BEAR_LOGO} alt="" className="relative z-10 h-20 w-20 object-contain" onError={(event) => { event.currentTarget.src = "/minia-bear-favicon.png"; }} />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
