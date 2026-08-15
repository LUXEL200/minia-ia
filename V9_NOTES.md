# Notes vague v9 (15/08)

## Demande utilisateur
1. Mode clair/sombre incomplet → corriger l'intégralité, harmoniser
2. Polices → intégrer l'intégralité complète, harmoniser
3. Rappels par notification : notif in-app (J-1) pour miniatures planifiées proches de publication
4. Vue Calendrier : grille mensuelle des publications planifiées (dans Dashboard)

## Audit hardcodés dark (60+ fichiers)
`bg-black|bg-\[#0C|bg-\[#1[0-9a-fA-F]|text-zinc-[0-9]{2,3}|bg-white/[0-9]|border-white/[0-9]`
Touchés : AppSidebar, GlobalSearchDialog, TestContributionsPanel, Navbar, PageHeader, FloatingMenu, toutes les pages dashboard (AbTest, Account, Admin, ApiKeys, Avatars, Billing, Dashboard, Editor, EndCards, Favorites, Gallery, Generator, Invitations, Miniatures, Models, Notifications, Organization, Personnes, Settings, ShareAbTest, TemplateEditor, Templates, ThumbnailPreview, Trash, Fav...) + landing sections + ui components (alert-dialog, dialog, drawer, sheet).

## Stratégie retenue
- Ne pas réécrire 60 fichiers hardcodés ; stratégie : override CSS global `.light` qui force les couleurs pour les classes Tailwind hardcodées (bg-black → blanc, text-zinc-* → sombre, bg-white/5 → noir léger, border-white/5 → bordure grise). C'est le pattern déjà utilisé v6 (override global .light) ; il faut le COMPLÉTER.
- index.css : complète .light { ... } avec toutes les classes hardcodées (bg-black, bg-\[#0C0C0E\], bg-\[#0A0A0B\], text-zinc-50…900, bg-white/5, border-white/5, border-white/10, ring-white/10).
- Dialogs/shadcn : ajouter .light overrides pour bg-popover bg-white text-foreground.
- Polices : définir 1 famille (ex : "Space Grotesk" pour titres, "Inter" corps) dans index.css : font-sans / font-display + forcer les pages/pages hardcodées (font-['Inter'] etc.). Vérifier index.html fonts Google.
- Notifications J-1 : cron quotidien (heartbeat/periodic skill) OU à la connexion : procédure getScheduleReminders + créer notifications in-app (table notifications existe déjà ? vérifier schema) ; utiliser skill webdev-periodic-updates.
- Calendrier : page/composant CalendarView dans Dashboard (grille mois, navigation prev/next, événements = schedules avec titre + compte à rebours), tab dans Dashboard (/dashboard calendrier) + lien dans sidebar.

## État technique
- tRPC existant : schedules.list/create/delete, search.global, notifications (trpc.notifications? vérifier) ; table publishedSchedules (id, userId, thumbnailId, youtubeTitle, scheduledAt).
- Tables notifications déjà existantes (page Notifications.tsx les utilise) — vérifier schema drizzle.
- Tests : 36/36 vitest OK (server/features.v2.test.ts, features.v8.test.ts, auth.logout.test.ts).
- Checkpoint v8 = e180bfd1, auto-publish actif (domaine miniagenerat-3x8qnuoe.manus.space).
- ThemeContext : dark/light, localStorage minia-theme (vérifier nom exact dans client/src/contexts/ThemeContext.tsx).
- Fonts actuelles : vérifier client/index.html (probablement Space Grotesk + Inter ou autre).

## Cron Heartbeat créé
- Nom : daily-planning-reminders
- task_uid : VbrfJAhiBmczMrfR6paBHJ
- Cron : 0 0 7 * * * (07h00 UTC = 08h00 Europe/Paris en été)
- Path : /api/scheduled/fireReminders (handler monté dans server/_core/index.ts, app.post AVANT le tRPC)
- tRPC : reminders.fire (publicProcedure) + schedules.listMonth (protected, year/month 1-12)
- DB : publishedSchedules.reminded (int 0/1) + helpers getRemindersToFire/markScheduleReminded/getSchedulesByMonth
- Checkpoint v9 partie 1 = cea00126 (auto-publié)

## Reste à faire (frontend)
1. Vue Calendrier : composant CalendarView monté dans Dashboard (onglet/vue "Calendrier" avec navigation mois + événements par jour + compte à rebours) — utiliser trpc.schedules.listMonth
2. Tests vitest : reminders.fire (notifications créées, reminded marqué), schedules.listMonth
3. Cocher todo v9 + checkpoint final

## Structure Dashboard.tsx (pour vue Calendrier)
- state : activeView "home"|"generate" ; upcomingSchedules = trpc.schedules.list ; countdownOf(scheduledAt) formate "dans Xj Yh Zm" ou "En retard !"; deleteSchedule/createSchedule mutations ; tick setInterval 1s.
- Imports lucide : déjà CalendarRange, CalendarClock (ligne 16).
- Prochaines étapes : ajouter `const [calMonth, setCalMonth]` avec query trpc.schedules.listMonth({year, month}), composant CalendarView (grille 7 colonnes, Jours FR L-D), navigation < > mois, chaque jour affiche le nombre + mini popover avec titre + image + countdownOf.
- Ajouter bouton/onglet "Calendrier" dans la home view (près du panneau Planifiées) — chercher le rendu du panneau "Planifiées" dans renderHomeView.
- Tests v9 : file server/features.v9.test.ts (mock pattern = features.v8.test.ts : vi.mock("../db") avec les helpers, vi.mock("./_core/trpc") pour ctx, test reminders.fire avec nowIso = date à J-1, listMonth retourne schedules du mois).
- Pense au cron déjà créé (task_uid VbrfJAhiBmczMrfR6paBHJ, cron 0 0 7 * * *).

## État final v9 (prêt checkpoint)
Vue Calendrier intégrée dans le Dashboard (CalendarView.tsx, monté sous « À publier bientôt », navigation mois FR, grille L-D, événements cyan cliquables, état vide). Screenshots OK : calendrier affiche bien Août 2026, jour 15 surligné cyan. Tests vitest 50/50, tsc OK. Cron Heartbeat créé (daily-planning-reminders, 0 0 7 * * *). Thème clair harmonisé via overrides .light dans index.css. Reste : cocher todo.md v9 + checkpoint final + message résultat.
