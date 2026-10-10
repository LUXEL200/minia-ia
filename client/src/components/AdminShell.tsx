import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Bot, ShieldCheck, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BearState from "@/components/BearState";

const links = [
  { href: "/admin", label: "Dashboard général", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/models", label: "Modèles IA & API", icon: Bot },
];

export default function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: access, isLoading: accessLoading } = trpc.admin.accessMe.useQuery(undefined, { enabled: !loading && isAuthenticated });
  const allowed = user?.isAdminOwner === true || access?.enabled === true;

  useEffect(() => {
    if (!loading && !accessLoading && isAuthenticated && !allowed) navigate("/dashboard");
  }, [loading, accessLoading, isAuthenticated, allowed, navigate]);

  if (loading || accessLoading) return <div className="min-h-screen bg-[#07111f] flex items-center justify-center p-6"><BearState title="Ouverture du centre admin" description="Vérification des permissions…" /></div>;
  if (!isAuthenticated) return <div className="min-h-screen bg-[#07111f] flex items-center justify-center p-6"><BearState title="Connexion requise" description="Connecte-toi pour accéder au Super Admin." /></div>;
  if (!allowed) return <div className="min-h-screen bg-[#07111f] flex items-center justify-center p-6"><BearState title="Accès refusé" description="Ton compte ne possède pas les permissions Super Admin." /></div>;

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 md:flex">
      <aside className="w-full border-b border-white/10 bg-[#0a1728] md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <img src="/manus-storage/minia-bear-paint-logo-b_17324125.png" alt="Minia IA" className="h-10 w-10 object-contain" />
          <div><p className="font-semibold">Super Admin</p><p className="text-xs text-slate-400">{user?.email || "Centre opérations"}</p></div>
        </div>
        <nav className="grid gap-1 p-3 md:block">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              <Icon className="h-4 w-4 text-orange-300" />{label}
            </Link>
          ))}
          <Link href="/dashboard" className="mt-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"><ArrowLeft className="h-4 w-4" />Retour à l’espace client</Link>
        </nav>
        <div className="mx-4 mt-3 hidden rounded-xl border border-orange-400/20 bg-orange-400/10 p-3 text-xs text-orange-100 md:block"><ShieldCheck className="mb-2 h-4 w-4" /><p>Accès protégé côté serveur. Stripe reste non connecté.</p></div>
      </aside>
      <main className="min-w-0 flex-1 md:ml-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#07111f]/90 px-4 py-4 backdrop-blur md:px-8"><p className="text-xs text-slate-500">Super Admin / {title}</p><h1 className="mt-1 text-xl font-semibold text-white">{title}</h1></header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
