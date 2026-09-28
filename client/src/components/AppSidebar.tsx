import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  LayoutDashboard, Image, UserRound, Grid3X3, Plus, XCircle,
  ChevronRight, Zap, Sun, Moon, Key, TrendingUp, Settings, Bell, LogOut, Users, ImagePlus,
  Type, CreditCard, Eye, RectangleHorizontal, Star, Trash, Search,
  Building2, Mail,
} from "lucide-react";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";

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
  const utils = trpc.useUtils();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountsDialog, setShowAccountsDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // Cloche dynamique : compteur réel des notifications non lues
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, { enabled: !!user });

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
      className={`fixed top-0 left-0 h-full w-[300px] max-w-[85vw] z-[70] bg-background border-r border-border shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Org info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/manus-storage/minia-bear-paint-logo-b_17324125.png" alt="Minia IA — ours touchant la peinture" className="w-10 h-10 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-foreground font-medium truncate">{user?.name || "Mon organisation"}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">Organisation pour {user?.email || "moi"}</p>
            </div>
            <button onClick={onClose} className="ml-auto text-muted-foreground/70 hover:text-foreground transition-colors p-1">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create thumbnail CTA */}
        <div className="p-4 border-b border-border">
          <button
            onClick={() => { onClose(); navigate("/dashboard"); }}
            className="w-full py-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-black text-sm font-bold flex items-center justify-center gap-2 glow-btn"
          >
            <Plus className="w-4 h-4" />
            Créer une miniature
          </button>
        </div>

        {/* Platform selector */}
        <div className="p-4 border-b border-border">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-2">Plate-forme</p>
          <button
            onClick={() => setShowAccountsDialog(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Compte
            </span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
          </button>
        </div>

        {/* Minia IA section */}
        <div className="px-4 py-3">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-2">Minia IA</p>
          <nav className="space-y-1">
            <Link href="/dashboard" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Tableau de bord
            </Link>
            <Link href="/miniatures" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Image className="w-4 h-4" /> Miniatures
            </Link>
            <Link href="/personnes" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Users className="w-4 h-4" /> Personnes
            </Link>
            <Link href="/templates" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Grid3X3 className="w-4 h-4" /> Modèles
            </Link>
          </nav>
        </div>

        {/* Extra tools section */}
        <div className="px-4 py-3">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-2">Outils supplémentaires</p>
          <nav className="space-y-1">
            <Link href="/editor" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Type className="w-4 h-4" /> Espace Canva
            </Link>
            <Link href="/ab-test" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <TrendingUp className="w-4 h-4" /> Tests A/B
            </Link>
            <Link href="/avatars" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <UserRound className="w-4 h-4" /> Avatars
            </Link>
            <Link href="/preview" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Eye className="w-4 h-4" /> Aperçu miniature
            </Link>
            <Link href="/endcards" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <RectangleHorizontal className="w-4 h-4" /> Générateur de cartes YouTube
            </Link>
            <Link href="/favorites" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Star className="w-4 h-4" /> Favoris
            </Link>
            <Link href="/trash" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Trash className="w-4 h-4" /> Poubelle
            </Link>
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" /> Recherche globale <span className="ml-auto text-[9px] text-muted-foreground/60 border border-border rounded px-1">⌘K</span>
            </button>
          </nav>
        </div>

        {/* Workspace section */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-2">Espace de travail</p>
          <nav className="space-y-1">
            <Link href="/organisation" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Building2 className="w-4 h-4" /> Organisation
            </Link>
            <Link href="/invitations" onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Mail className="w-4 h-4" /> Invitations
            </Link>
          </nav>
        </div>

        <GlobalSearchDialog open={showSearch} onClose={() => setShowSearch(false)} />

        {/* Upgrade CTA */}
        <div className="mt-auto px-4 pt-4">
          <div className="bg-card border border-border rounded-[20px] p-4 feature-edge">
            <p className="text-xs text-foreground font-medium mb-1">Passez à la version Pro</p>
            <p className="text-[10px] text-muted-foreground mb-3">Débloquez toutes les fonctionnalités et améliorez vos vignettes.</p>
            <Link href="/pricing" onClick={onClose}
              className="block w-full py-2.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-black text-xs font-bold text-center glow-btn">
              <Zap className="w-3 h-3 inline mr-1" />
              Mise à niveau
            </Link>
          </div>
        </div>

        {/* User profile with dropdown */}
        <div className="px-4 pt-3 mt-auto border-t border-border relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-300 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground font-medium truncate">{user?.name || "Moi"}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{user?.email || ""}</p>
            </div>
            <svg className="w-3 h-3 text-muted-foreground/70 flex-shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showProfileMenu ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-80">
              <div className="p-3 border-b border-border">
                <p className="text-xs text-foreground font-medium">{user?.name || "Moi"}</p>
                <p className="text-[10px] text-muted-foreground/70">{user?.email || ""}</p>
              </div>

              <div className="py-1">
                <Link href="/pricing" onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Passez à la version Pro</span>
                </Link>
              </div>

              <div className="py-1 border-t border-border">
                <button
                  onClick={() => {
                    onClose();
                    if (toggleTheme) {
                      toggleTheme();
                      // Après toggle, le thème vient de basculer : afficher le NOUVEAU thème
                      const next = theme === "dark" ? "light" : "dark";
                      toast.success(next === "dark" ? "Mode sombre activé" : "Mode clair activé", {
                        duration: 1800,
                        position: "top-right",
                        style: {
                          borderRadius: 999,
                          background: "var(--popover)",
                          color: "var(--popover-foreground)",
                          border: "1px solid var(--border)",
                          boxShadow: "0 10px 40px rgba(0,0,0,.35)",
                          fontSize: 12,
                          fontWeight: 600,
                          minWidth: 180,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        },
                        icon: next === "dark" ? "🌙" : "☀️",
                      });
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <UserRound className="w-4 h-4" /> Compte
                </button>
                <Link href="/api-keys" onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Key className="w-4 h-4" /> Clés API
                </Link>
                <Link href="/settings" onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Settings className="w-4 h-4" /> Paramètres
                </Link>
                <Link href="/billing" onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <CreditCard className="w-4 h-4" /> Facturation
                </Link>
                {/* Cloche : clic direct vers la page Notifications (rappels J-1 visibles dedans) */}
                <Link href="/notifications" onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Bell className="w-4 h-4" /> Notifications
                  {unreadCount !== undefined && unreadCount > 0 && (
                    <span className="ml-auto badge-pulse bg-red-600 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              <div className="py-1 border-t border-border">
                <button
                  onClick={() => { onClose(); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
        className="relative w-full max-w-sm max-h-[calc(100dvh-2rem)] bg-[#111] border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="text-sm text-foreground font-medium">Comptes</p>
            <p className="text-[10px] text-muted-foreground/70">Basculer entre tes comptes ou en créer un nouveau</p>
          </div>
          <button
            onClick={() => setShowAccountsDialog(false)}
            className="text-muted-foreground/70 hover:text-foreground transition-colors p-1"
            aria-label="Fermer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5 max-h-[46vh] overflow-y-auto">
          {accounts.length === 0 && (
            <p className="text-xs text-muted-foreground/70 text-center py-4">Aucun compte enregistré.</p>
          )}
          {accounts.map(acc => {
            const isCurrent = acc.email === user?.email;
            return (
              <div
                key={acc.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                  isCurrent
                    ? "border-orange-400/40 bg-orange-400/10"
                    : "border-border bg-muted hover:bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-300 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground font-medium truncate">{acc.name}</p>
                  <p className="text-[10px] text-muted-foreground/70 truncate">{acc.email}</p>
                </div>
                {isCurrent ? (
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-400/15 border border-orange-400/30 px-2 py-0.5 rounded-full">Actuel</span>
                ) : (
                  <button
                    onClick={() => {
                      // Switch account: mark target as current, then re-login with the new account
                      const next = accounts.map(a => ({ ...a, current: a.email === acc.email }));
                      persistAccounts(next);
                      toast.info(`Sélection de ${acc.email} — le navigateur va ouvrir la connexion.`);
                      setTimeout(() => startLogin(), 300);
                    }}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-border px-2.5 py-1 rounded-full transition-colors"
                  >
                    Utiliser
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={() => {
              setShowAccountsDialog(false);
              toast.info("Connecte-toi avec un autre compte pour l'ajouter à la liste.");
              setTimeout(() => startLogin(), 300);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-black text-black text-xs font-bold glow-btn"
          >
            <ImagePlus className="w-3.5 h-3.5" /> Créer un nouveau compte
          </button>
          {accounts.length > 1 && (
            <p className="text-[10px] text-muted-foreground/60 text-center">
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
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={openSidebar} data-tour="hamburger" className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/60">
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-sm text-muted-foreground font-medium truncate">{pageLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {children}
          {showCredits && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-400/15 to-orange-300/15 border border-primary/20 text-xs text-foreground font-medium">
              <CreditCard className="w-3.5 h-3.5 text-orange-400" />
              {creditsCount} crédit{creditsCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
