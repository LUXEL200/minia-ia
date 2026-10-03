import { Button } from "@/components/ui/button";

const BEAR_LOGO = "/manus-storage/minia-bear-paint-logo-b_17324125.png";

type BearStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "empty" | "error";
};

export default function BearState({ title, description, actionLabel, onAction, tone = "empty" }: BearStateProps) {
  return (
    <div className={`bear-state bear-state-${tone}`} role={tone === "error" ? "alert" : undefined}>
      <div className="bear-state-art" aria-hidden="true">
        <span className="bear-state-splash" />
        <img src={BEAR_LOGO} alt="" onError={(event) => { event.currentTarget.src = "/minia-bear-favicon.png"; }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button type="button" variant="outline" size="sm" onClick={onAction} className="mt-1 min-h-10">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
