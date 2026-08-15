# Notes techniques vague v8 (interne, à supprimer avant checkpoint)

## Backend déjà fait
- Migration 0007 appliquée : tables `abTestContributions` (abTestId, userId, orgId, variant enum a/b, views, clicks, channelName, note) et `publishedSchedules` (userId, thumbnailId, youtubeTitle, scheduledAt).
- db.ts : nouveaux helpers importés — addAbTestContribution, getAbTestContributions, deleteAbTestContribution, globalSearch (retourne {thumbnails, favorites, gallery, trash}), createPublishedSchedule, deletePublishedSchedule, getUpcomingSchedules, getThumbnailByIdWithCheck.
- routers.ts : `abTests.contributions` (list/add/delete), `abTests.getAggregated` (base + contributions, ctr agrégé), `search.global` (query min 1 char), `schedules` (list/create/delete). Enregistrés dans appRouter.
- tsc OK.

## Architecture Dashboard actuel (client/src/pages/Dashboard.tsx)
- activeView = "home" | "generate" | "team" | "all-generations" (un seul composant, 4 vues inline).
- Lignes 74-82 : useEffect deep-linking hash `#miniatures` → all-generations, `#equipe/#team/#personnes` → team. (À SUPPRIMER pour v8.)
- renderHeader() : header sticky noir + crédits + icône message (lignes 335-353).
- renderHomeView() : stats 2x2 (Miniatures/Générations/Avatars/Crédits), "Vos personnes" (self + teamMembers.slice(0,3) + bouton inviter), "Générations récentes" (4 cartes + overlays hover favoris/partage), "Modèles" (4 thumbs), Avatars récents, CTA générer (lignes 356-564).
- renderTeamView() ~ lignes 823-936 (team members table + tasks).
- renderAllGenerationsView() ~ lignes 938-1061 (grille complète + filtres search/style/date/youtube + plan dialog).
- Planify dialog : handleOpenPlan (246), planMutation.thumbnail.planYoutube (102-105), setPlanTarget (246-249), handlePlanConfirm (251-257).
- Icônes lucide importées : Image, CreditCard, Download, Trash2, Loader2, Sparkles, ArrowRight, Home, Plus, Users, ListChecks, Heart, CheckCircle2, XCircle, ChevronRight, UserCircle2, Menu, LayoutDashboard, UserRound, Grid3X3, Eye, RectangleHorizontal, Star, Trash, Zap, Sun, Key, TrendingUp, Settings, Bell, LogOut, Type, Shield, Upload, Share2, Copy, Search, CalendarRange, Youtube, CalendarClock, X.
- STYLES array (l.19-26) et STYLE_LABELS (l.28).

## AppSidebar (client/src/components/AppSidebar.tsx)
- Lignes 152-186 : nav Minia IA — "Tableau de bord" → /dashboard, "Miniatures" → /dashboard#miniatures (impératif), "Personnes" → /dashboard#equipe (impératif). À remplacer par /dashboard, /miniatures, /personnes.
- Section outils 189-237 : lieu d'insertion du trigger recherche globale.
- Plateformes 137-149.

## App.tsx
- Routes existantes : /dashboard, /gallery, /avatars, /endcards, /favorites, /trash, /notifications, /account, /api-keys, /organisation, /invitations, /settings, /billing, /preview, /editor, /template-editor, /ab-test, /share-ab/:token, /admin. À ajouter : /miniatures, /personnes.
- FloatingMenu monté globalement (hamburger top-right partout).

## Ce qui reste à faire (frontend v8)
1. Créer client/src/pages/Miniatures.tsx — version all-generations avec filtres + grille + plan (réutiliser composant ThumbnailCard overlay hover du Dashboard : edit /editor?image=, preview dialog, download, favori (likes.toggle), share, valider (team.createTask), modifier (Type), supprimer (thumbnail.delete), planifier (CalendarClock)).
2. Créer client/src/pages/Personnes.tsx — hub personnes : self + membres (org.me) + inviter par email (org.invite) + invitations reçues/envoyées (org.receivedInvitations/sentInvitations) + tâches (team.tasks avec workflow validation/refus/cancellation).
3. Dashboard : retirer vue team et all-generations (garder home + generate) + panneau "Planifiées" avec compte à rebours (trpc.schedules.list, badge countdown, annuler le plan).
4. Planifier → créer aussi une entrée publishedSchedules (scheduledAt). Dialog Planifier : ajouter champ date/heure (default +24h) + title, mutation schedules.create, toast.
5. Countdown live : setInterval 1s ou formatage "dans Xj Xh Xm", composant CountdownBadge.
6. Panel stats collaboratives dans AbTest.tsx : abTests.contributions.list/add/delete + getAggregated ; section "Contributions d'équipe" avec formulaire (variant a/b, vues, clics, channelName) + liste contributions + totaux agrégés ; badge "agrégé équipe" sur les CTR.
7. Recherche globale : composant GlobalSearchDialog (Dialog, field query, trpc.search.global, sections : Historique / Favoris / Galerie / Poubelle, lien vers éditeur/preview/favorites/trash). Trigger depuis AppSidebar (item "Rechercher" + raccourci) ou FloatingMenu.
8. App.tsx : routes /miniatures + /personnes.
9. AppSidebar : liens directs /dashboard /miniatures /personnes (supprimer hash).
10. Tests vitest pour contributions/schedules/search (server/v8.test.ts).
11. Checkpoint + deliver.

## Détails exacts relevés
- Dashboard.tsx : views inline — renderTeamView (823-936), renderAllGenerationsView (940-1061), main render (1064-1072), floating nav 3 boutons Accueil/Générer/Équipe (1075-1105), plan dialog v5 (1110-1191), invite modal (1194-1234), preview dialog (1237-1276). displayThumbnails défini ligne 939 (used inside renderAllGenerationsView + plan dialog).
- AbTest.tsx : updateStat (72-79), declareWinner (81-92), carte test (132-262) avec input vues/clics inline, badge CTR, create modal (268-336). Style AbTest : bg-zinc-950 border-white/10, accent #ff0050.
- AppSidebar : liens hash /dashboard#miniatures (160-170) et #equipe (171-181) → à remplacer par /miniatures et /personnes (Link). Section outils 189-222 : insérer item "Rechercher" avec Search icon après Espace Canva (ou au-dessus), ouvre un GlobalSearchDialog.
- Invitations.tsx : page dédiée style Youthumb (reçues lignes 67-149, envoyées + form 151-249) — réutilisable comme section de /personnes.

## Conventions UI du projet
- Fond noir pur #000, cartes #181818, bordures border-white/5 ou border-zinc-800, text-zinc-300/500, accent cyan-600 (boutons) et rose/pink gradient, badges pills bg-[#181818] border border-white/5.
- PageHeader composant partagé (titre + breadcrumb) utilisé sur toutes les pages admin/outils.
- Dark mode = default, .light override dans index.css pour mode clair.
- toasts via sonner, Button shadcn, Dialog shadcn, Link wouter.

## Statut v8 (mis à jour)
- FAIT : Migration 0007 appliquée ; backend (contributions, schedules, global search) OK ; tsc OK.
- FAIT : Miniatures.tsx créé (/miniatures) avec filtres + grille + overlays + plan dialog.
- FAIT : Personnes.tsx créé (/personnes) : membres, invitations, tâches.
- FAIT : Dashboard refondu — views team/all-generations supprimées (home + generate), nav flottante : Accueil/Générer/Miniatures (navigate /miniatures), "Vos personnes" → /personnes, "Générations récentes" → /miniatures. displayThumbnails = [...completedThumbnails] (pour plan dialog).
- RESTE : 3. Panneau "Planifiées" countdown (schedules.list) ; 4. Dialog plan → schedules.create (champ date) ; 5. CountdownBadge ; 6. AbTest contributions panel ; 7. GlobalSearchDialog + trigger sidebar ; 8. Routes App.tsx ; 9. Sidebar liens ; 10. Tests ; 11. Checkpoint.
- Attention sidebar : liens hash → remplacer par Link /miniatures /personnes ; supprimer deep-linking hash du Dashboard (déjà retiré).

## Avancement (mise à jour 2)
- Dashboard : fait (panneau planifiées + countdown, dialog plan avec date, nav flottante 3 boutons, views team/all supprimées). tsc OK.
- Routes : /miniatures + /personnes ajoutées dans App.tsx (imports OK). Sidebar : liens directs (plus de hash), trigger Recherche globale ajouté, GlobalSearchDialog monté. tsc OK.
- GlobalSearchDialog.tsx créé (sections Historique/Favoris/Galerie/Poubelle, debounce 250ms, onCopy/onOpen, champs réels : results.thumbnails/favorites/gallery/trash mapés en {id,imageUrl,prompt}).
- AbTest.tsx : state contrib + mutations add/delete contributions ajoutées + appel TestContributionsPanel (COMPOSANT À CRÉER encore).
- RESTE : 1) Créer TestContributionsPanel (composant dans client/src/components/TestContributionsPanel.tsx ou inline AbTest : query contributions.list par test, getAggregated, formulaire variant/vues/clics/chaîne, liste contributions avec delete) ; 2) tsc ; 3) Tests vitest server/v8.test.ts (contributions + schedules + search) ; 4) Screenshots desktop+mobile ; 5) todo.md + checkpoint.
- Signatures : abTests.contributions.add input {abTestId, variant "a"|"b", views, clicks, channelName?, note?}; delete {contributionId}; list {abTestId}; getAggregated {abTestId} retourne {viewsA,clicksA,viewsB,clicksB,ctrA,ctrB,contributionCount}. getAbTestContributions retourne lignes abTestContributions (abTestId, userId, orgId, variant, views, clicks, channelName, note, createdAt).
- Note : contributions.list require abTestId valide (erreur NOT_FOUND si test n'appartient pas au user) → query enabled conditionnel.

## Screenshots v8 (vérifiés)
Dashboard : home avec 4 stat cards, générations récentes, nav flottante (Accueil/Générer/Miniatures), panneau planifiées visible uniquement quand schedules. OK.
Miniatures : page dédiée OK (recherche, filtres style/date/statut, grille + badge filigrane, boutons actions).
Personnes : page dédiée OK (tabs Membres/Invitations/Tâches, liste membres, bouton Inviter).
AbTest : state vide OK, TestContributionsPanel intégré (à vérifier avec un vrai test).
Gallery : page landing + grille OK.
RESTE : tests vitest (contributions/schedules/search.global dans server/v8.test.ts), todo.md, checkpoint.
