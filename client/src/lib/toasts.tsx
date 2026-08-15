import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Undo2,
  type LucideIcon,
} from "lucide-react";

/**
 * Toasts enrichis inspirés des patterns 21st.dev :
 * icône colorée par type, titre en gras + description, durée 4s,
 * action « Annuler » optionnelle (ex : après suppression).
 */
export function toastRich(
  variant: "success" | "error" | "info" | "warning",
  title: string,
  opts?: { description?: string; undo?: { label?: string; onClick: () => void } }
) {
  const icons: Record<string, LucideIcon> = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };
  const Icon = icons[variant];

  toast(variant === "error" ? "error" : variant === "warning" ? "warning" : "message", {
    description: (
      <span className="flex items-start gap-2.5">
        <Icon
          className={`w-4 h-4 mt-0.5 shrink-0 ${
            variant === "success"
              ? "text-emerald-400"
              : variant === "error"
                ? "text-red-400"
                : variant === "warning"
                  ? "text-amber-400"
                  : "text-cyan-400"
          }`}
        />
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">{title}</span>
          {opts?.description && <span className="text-zinc-400 text-xs">{opts.description}</span>}
        </span>
      </span>
    ),
    duration: 4000,
    ...(opts?.undo
      ? {
          action: {
            label: opts.undo.label ?? "Annuler",
            onClick: opts.undo.onClick,
          },
        }
      : {}),
  });
}

export const toastSuccess = (title: string, description?: string) => toastRich("success", title, { description: description });
export const toastError = (title: string, description?: string) => toastRich("error", title, { description: description });
