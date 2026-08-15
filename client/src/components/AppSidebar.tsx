import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  LayoutDashboard, Image, UserRound, Grid3X3, Plus, XCircle,
  ChevronRight, Zap,   Sun, Moon, Key, TrendingUp, Settings, Bell, LogOut, Users, ImagePlus,
  Type, Shield, CreditCard, Eye, RectangleHorizontal, Star, Trash,
  Building2, Mail,
} from "lucide-react";

/**
 * AppSidebar — menu hamburger complet (tous les sous-menus de gauche) réutilisable
 * sur toutes les pages du dashboard. S'ouvre avec un overlay + slide-in depuis la gauche.
 *
 * Usage : <AppSidebar pageLabel="Mon tableau de bord"> ... </AppSidebar>
 * L'enfant reçoit le bouton hamburger via {open} ou on utilise AppHeader avec le bouton intégré.
 */
export function useAppSidebar() {
  const [showSidebar, setShowSidebar] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSidebar(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { showSidebar, setShowSidebar, openSidebar: () => setShowSidebar(true) };
}

export function AppSidebar({
  open,
  onClose,
  pageLabel = "Minia IA",
}: {
  open: boolean;
  onClose: () => void;
  pageLabel?: string;
}) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountsDialog, setShowAccountsDialog] = useState(false);

  const { data: credits } = trpc.thumbnail.credits.useQuery(undefined, {
    enabled: false, // never auto-fetch in the shared sidebar: pages fetch it themselves when authenticated
  });

  // Close the profile dropdown when the sidebar closes
  useEffect(() => {
    if (!open) {
      setShowProfileMenu(false);
      setShowAccountsDialog(false);
    }
  }, [open]);

  // Sync local accounts store (multi-account support, stored in localStorage)
  const [accounts, setAccounts] = useState<
    { id: string; email: string; name: string; createdAt: number; current: boolean }[]
  >([]);

  useEffect(() => {
    if (!showAccountsDialog) return;
    const raw = localStorage.getItem("minia-accounts");
    let list: typeof accounts = [];
    try {
      list = raw ? JSON.parse(raw) : [];
    } catch {
      list = [];
    }
    // Ensure the logged-in user is registered in the list
    if (user && !list.find(a => a.email === user.email)) {
      list = [
        ...list,
        {
          id: user.openId || `u-${user.email}`,
          email: user.email || "",
          name: user.name || "Moi",
          createdAt: Date.now(),
          current: true,
        },
      ];
      localStorage.setItem("minia-accounts", JSON.stringify(list));
    }
    setAccounts(list);
  }, [showAccountsDialog, user]);

  const persistAccounts = (next: typeof accounts) => {
    setAccounts(next);
    localStorage.setItem("minia-accounts", JSON.stringify(next));
  };

  // ===== Overlay =====
  const overlay = open && (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
  );

  // ===== Sidebar panel =====
  const panel = (
    <aside
      className={`fixed top-0 left-0 h-full w-[300px] max-w-[85vw] z-[70] bg-[#111] border-r border-white/5 shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full overflow-y-auto pb-4">
        {/* Org info */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.name || "Mon organisation"}</p>
              <p className="text-[10px] text-zinc-500 truncate">Organisation pour {user?.email || "moi"}</p>
            </div>
            <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-white transition-colors p-1">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create thumbnail CTA */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={() => { onClose(); navigate("/dashboard"); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Créer une miniature
          </button>
        </div>

        {/* Platform selector */}
        <div className="p-4 border-b border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Plate-forme</p>
          <button
            onClick={() => setShowAccountsDialog(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#181818] border border-white/5 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Compte
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
          </button>
        </div>

        {/* Minia IA section */}
        <div className="px-4 py-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Minia IA</p>
          <nav className="space-y-1">
            <Link href="/dashboard" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Tableau de bord
            </Link>
            <a
              href="/dashboard#miniatures"
              onClick={() => {
                onClose();
                navigate("/dashboard");
                setTimeout(() => window.location.hash = "miniatures", 150);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
            >
              <Image className="w-4 h-4" /> Miniatures
            </a>
            <a
              href="/dashboard#equipe"
              onClick={() => {
                onClose();
                navigate("/dashboard");
                setTimeout(() => window.location.hash = "equipe", 150);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
            >
              <Users className="w-4 h-4" /> Personnes
            </a>
            <Link href="/templates" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <Grid3X3 className="w-4 h-4" /> Modèles
            </Link>
          </nav>
        </div>

        {/* Extra tools section */}
        <div className="px-4 py-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Outils supplémentaires</p>
          <nav className="space-y-1">
            <Link href="/editor" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <Type className="w-4 h-4" /> Espace Canva
            </Link>
            <Link href="/ab-test" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" /> Tests A/B
            </Link>
            <Link href="/avatars" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <UserRound className="w-4 h-4" /> Avatars
            </Link>
            <Link href="/preview" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <Eye className="w-4 h-4" /> Aperçu miniature
            </Link>
            <Link href="/endcards" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <RectangleHorizontal className="w-4 h-4" /> Générateur de cartes YouTube
            </Link>
            <Link href="/favorites" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <Star className="w-4 h-4" /> Favoris
            </Link>
            <Link href="/trash" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <Trash className="w-4 h-4" /> Poubelle
            </Link>
          </nav>
        </div>

        {/* Workspace section */}
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Espace de travail</p>
          <nav className="space-y-1">
            <Link href="/organisation" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <Building2 className="w-4 h-4" /> Organisation
            </Link>
            <Link href="/invitations" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
              <Mail className="w-4 h-4" /> Invitations
            </Link>
          </nav>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-auto px-4 pt-4">
          <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-white font-medium mb-1">Passez à la version Pro</p>
            <p className="text-[10px] text-zinc-500 mb-3">Débloquez toutes les fonctionnalités et améliorez vos vignettes.</p>
            <Link href="/pricing" onClick={onClose}
              className="block w-full py-2.5 rounded-lg bg-gradient-to-r from-[#EC4899] to-[#F43F5E] text-white text-xs font-medium text-center hover:opacity-90 transition-opacity">
              <Zap className="w-3 h-3 inline mr-1" />
              Mise à niveau
            </Link>
          </div>
        </div>

        {/* User profile with dropdown */}
        <div className="px-4 pt-3 mt-auto border-t border-white/5 relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#181818] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white font-medium truncate">{user?.name || "Moi"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email || ""}</p>
            </div>
            <svg className="w-3 h-3 text-zinc-500 flex-shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showProfileMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-80">
              <div className="p-3 border-b border-white/5">
                <p className="text-xs text-white font-medium">{user?.name || "Moi"}</p>
                <p className="text-[10px] text-zinc-500">{user?.email || ""}</p>
              </div>

              <div className="py-1">
                <Link href="/pricing" onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-[#181818] transition-colors">
                  <Zap className="w-4 h-4 text-pink-500" />
                  <span className="font-medium">Passez à la version Pro</span>
                </Link>
              </div>

              <div className="py-1 border-t border-white/5">
                <button
                  onClick={() => {
                    onClose();
                    if (toggleTheme) {
                      toggleTheme();
                      toast.success(
                        theme === "dark" ? "Mode clair activé" : "Mode sombre activé",
                      );
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4" /> Mode clair
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" /> Mode sombre
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    setShowAccountsDialog(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                >
                  <UserRound className="w-4 h-4" /> Compte
                </button>
                <Link href="/api-keys" onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
                  <Key className="w-4 h-4" /> Clés API
                </Link>
                <Link href="/settings" onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
                  <Settings className="w-4 h-4" /> Paramètres
                </Link>
                <Link href="/billing" onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
                  <CreditCard className="w-4 h-4" /> Facturation
                </Link>
                <Link href="/notifications" onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors">
                  <Bell className="w-4 h-4" /> Notifications
                  <span className="ml-auto bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</span>
                </Link>
              </div>

              {/* Admin link — visible only to admins */}
              {user?.role === "admin" && (
                <div className="py-1 border-t border-white/5">
                  <Link href="/admin" onClick={onClose}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                    <Shield className="w-4 h-4" />
                    Super Admin
                    <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">ADMIN</span>
                  </Link>
                </div>
              )}

              <div className="py-1 border-t border-white/5">
                <button
                  onClick={() => { onClose(); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-300 hover:bg-[#181818] hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  // ===== Multi-account dialog =====
  const accountsDialog = showAccountsDialog && (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => setShowAccountsDialog(false)}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div>
            <p className="text-sm text-white font-medium">Comptes</p>
            <p className="text-[10px] text-zinc-500">Basculer entre tes comptes ou en créer un nouveau</p>
          </div>
          <button
            onClick={() => setShowAccountsDialog(false)}
            className="text-zinc-500 hover:text-white transition-colors p-1"
            aria-label="Fermer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5 max-h-[46vh] overflow-y-auto">
          {accounts.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-4">Aucun compte enregistré.</p>
          )}
          {accounts.map(acc => {
            const isCurrent = acc.email === user?.email;
            return (
              <div
                key={acc.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                  isCurrent
                    ? "border-cyan-500/40 bg-cyan-500/10"
                    : "border-white/5 bg-[#181818] hover:bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#EC4899] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white font-medium truncate">{acc.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{acc.email}</p>
                </div>
                {isCurrent ? (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full">Actuel</span>
                ) : (
                  <button
                    onClick={() => {
                      // Switch account: mark target as current, then re-login with the new account
                      const next = accounts.map(a => ({ ...a, current: a.email === acc.email }));
                      persistAccounts(next);
                      toast.info(`Sélection de ${acc.email} — le navigateur va ouvrir la connexion.`);
                      setTimeout(() => startLogin(), 300);
                    }}
                    className="text-[10px] font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-full transition-colors"
                  >
                    Utiliser
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-white/5 space-y-2">
          <button
            onClick={() => {
              setShowAccountsDialog(false);
              toast.info("Connecte-toi avec un autre compte pour l'ajouter à la liste.");
              setTimeout(() => startLogin(), 300);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <ImagePlus className="w-3.5 h-3.5" /> Créer un nouveau compte
          </button>
          {accounts.length > 1 && (
            <p className="text-[10px] text-zinc-600 text-center">
              Les comptes sont enregistrés localement sur cet appareil.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {overlay}
      {panel}
      {accountsDialog}
    </>
  );
}

/**
 * AppHeader — en-tête générique avec bouton hamburger, titre de page et crédits.
 * À utiliser sur toutes les pages du dashboard en remplacement des en-têtes manuels.
 */
export function AppHeader({
  pageLabel,
  showCredits = false,
  children,
}: {
  pageLabel: string;
  showCredits?: boolean;
  children?: React.ReactNode;
}) {
  const { openSidebar } = useAppSidebar();
  const { isAuthenticated } = useAuth();
  const { data: credits } = trpc.thumbnail.credits.useQuery(undefined, { enabled: showCredits });
  const creditsCount = credits?.credits ?? 10;
  return (
    <header className="sticky top-0 z-50 bg-[#000]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={openSidebar} className="text-zinc-400 hover:text-white transition-colors p-1">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-sm text-zinc-300 font-medium truncate">{pageLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {children}
          {showCredits && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181818] border border-white/5 text-xs text-zinc-300">
              <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
              {creditsCount} crédit{creditsCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
