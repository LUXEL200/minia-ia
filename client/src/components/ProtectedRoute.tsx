import type { ReactNode } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import BearState from "@/components/BearState";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <BearState title="Ouverture de ton espace" description="Vérification de ta session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
          <BearState title="Connecte-toi pour continuer" description="Cet espace est réservé aux créateurs connectés." />
          <button type="button" onClick={startLogin} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-semibold text-white transition hover:bg-orange-400 active:scale-[.98]">
            Se connecter
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
