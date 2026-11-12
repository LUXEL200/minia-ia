import type { ReactNode } from "react";
import FloatingMenu from "@/components/FloatingMenu";
import { useLocation } from "wouter";

export default function AppShell({ children, pageLabel }: { children: ReactNode; pageLabel?: string }) {
  const [location] = useLocation();
  const labels: Record<string, string> = {
    "/dashboard": "Tableau de bord",
    "/editor": "Espace Canva",
    "/avatars": "Avatars",
    "/team": "Team",
    "/templates": "Templete par défaut",
    "/settings": "Paramètres",
    "/billing": "Facturation",
    "/notifications": "Notifications",
  };
  const currentLabel = pageLabel ?? labels[location] ?? "Minia IA";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <FloatingMenu pageLabel={currentLabel} />
      <div className="min-h-screen">{children}</div>
    </div>
  );
}
