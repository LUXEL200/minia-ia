import type { ReactNode } from "react";
import FloatingMenu from "@/components/FloatingMenu";

export default function AppShell({ children, pageLabel }: { children: ReactNode; pageLabel?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <FloatingMenu pageLabel={pageLabel} />
      <div className="min-h-screen">{children}</div>
    </div>
  );
}
