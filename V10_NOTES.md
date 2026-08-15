# Notes v10 (15/08)

## Demandes utilisateur v10
1. Corriger points sombres restants en mode clair (capture mobile : hamburger rond noir, badge "ABCD + 14589+" sombre sur landing)
2. Calendrier interactif : clic événement → dialog Planifier (modifier heure/titre)
3. Vue semaine dans le calendrier (bascule mois/semaine)
4. Badge J-1 dans la cloche Notifications + lien direct vers miniature

## État réalisé
- index.css : overrides .light ajoutés — bg-black/5 à bg-black/90, bg-zinc-900/50, border-white/15-30, text-zinc-100/200/400 (lignes ~444-475)
- FloatingMenu.tsx : thème-aware via useTheme (isLight → fond blanc/95 + bordure zinc-200 + texte zinc-800)
- Navbar.tsx : thème-aware (navBg/navBorder/linkText/mobilePanel/mobileLinkText, logo texte zinc-900 en light, cyan #0891B2 en light)

## PROBLÈME IMPORTANT (screenshots vérifiés)
Le mode clair NE S'APPLIQUE PAS dans les screenshots (landing + dashboard montrent le mode sombre !).
- Cause probable : le thème est persisté dans localStorage sur le sandbox du navigateur de screenshot → reste en dark.
- Ou : la landing n'a jamais le mode clair par défaut (default dark), et la session screenshot est en dark.
- → Pour tester le light : ajouter ?theme=light au preview ? Non : le ThemeProvider lit localStorage/theme. Le screenshot utilise une session navigateur persistante.
- Alternative : vérifier comment ThemeContext applique le thème (client/src/contexts/ThemeContext.tsx).

## Reste à faire
1. Vérifier pourquoi les screenshots persistent en dark (ThemeContext : peut-être que la session de test est en dark → NORMAL : l'utilisateur bascule lui-même). Mais la capture utilisateur mobile montre light avec des zones noires : donc light S'applique bien pour lui. → Mes screenshots sont en dark car MA session sandbox est dark. C'est OK.
   - IMPORTANT : le composant FloatingMenu useTheme.theme retourne "light"|"dark". Vérifier la signature exportée.
2. Badge landing "ABCD + miniatures" : pill sombre bg-[#18181B] ? À vérifier dans HeroSection (probablement bg-[#09090B]/80 ou similaire) → ajouter override .light si besoin ou rendre thème-aware.
3. Calendrier interactif : modifier CalendarView.tsx — onClick événement → ouvrir un dialog (PlanScheduleDialog déjà existant dans Dashboard.tsx ? vérifier) pour éditer heure/titre (schedules.create ne permet pas l'edit → peut-être ajouter schedules.update ? Ou : supprimer + recréer. Mieux : accepter un scheduleId optionnel = édition, côté backend : schedules.update({id, youtubeTitle, scheduledAt}) avec ownership check + delete old).
   - Backend : ajouter schedules.update (router schedules, db helper updatePublishedSchedule)
   - Frontend : PlanDialog acceptant un schedule existant → mode édition.
4. Vue semaine : ajouter mode "semaine" dans CalendarView (grille 7 colonnes L→D de la semaine courante, navigation semaine par semaine, events sur chaque jour).
5. Badge J-1 Notifications : page Notifications.tsx — marquer les notifications de type "system"/titre "Rappel de planification" avec un badge "J-1" (ou calculer via données embarquées). Ajouter un lien direct vers la miniature concernée (notification.metadata.thumbnailId ?) → enrichir createNotification (v9) pour inclure thumbnailId ? Le cron actuel ne passe pas de thumbnailId.
   - Modifier fireRemindersProcedure pour stocker thumbnailId dans la notif (colonne metadata JSON ou champ dédié). Simplest : ajouter une colonne/link dans la table notifications (ex: linkUrl text) OU stocker JSON dans un champ. Vérifier le schema notifications.
   - Page Notifications : bouton "Voir la miniature" quand linkUrl présent.
   - Badge "J-1" sur les notifications de rappel (badge cyan).

## Fichiers clés
- client/src/components/CalendarView.tsx (vue mois actuelle)
- client/src/components/FloatingMenu.tsx (hamburger)
- client/src/components/Navbar.tsx
- client/src/pages/Dashboard.tsx (PlanDialog existant à réutiliser, lignes plan dialog ~840-950 ; upcomingSchedules query)
- client/src/pages/Notifications.tsx
- server/routers.ts (schedules router, reminders.fire)
- server/db.ts (helpers: createPublishedSchedule, getRemindersToFire, markScheduleReminded)
- drizzle/schema.ts (table notifications — vérifier colonnes)
- Todo items v10 en fin de todo.md (6 items)

## Tests
- 50/50 vitest OK, tsc OK avant v10 edits.
- Ajouter tests v10 dans server/features.v10.test.ts : schedules.update ownership, notifications.linkUrl.

## MISE À JOUR (11:49) — état d'avancement v10

### FAIT
- index.css overrides .light complétés (bg-black/5-90, pills #18181B/#09090B, borders, text-zinc-100-400)
- FloatingMenu.tsx thème-aware (useTheme)
- Navbar.tsx thème-aware (navBg/navBorder/linkText/mobilePanel/mobileLinkText)
- ThemeContext.tsx : ?theme=light|dark en URL prime sur localStorage (testable pour screenshots)
- App.tsx : defaultTheme basé sur query param
- db.ts : getScheduleByIdWithCheck + updatePublishedSchedule ajoutés (ligne ~1045-1060)
- VÉRIFIÉ : mode clair appliqué correctement (screenshots ?theme=light OK : pill ABCD clair, hamburger blanc, navbar white, dashboard clair)
  - Restant mineur : cartes calendrier noires dans le mode clair ? Vérifier les hardcodés #121212/#181818 dans CalendarView (couverts par override bg-[#121212] ? Vérifier — le override .light couvre bg-[#0a0a0a]...#18181B mais PAS #121212 → ajouter html.light .bg-[\#121212])

### RESTE À FAIRE
1. Ajouter html.light .bg-\[\#121212\] aux overrides (calendrier cellules) + vérif light desktop
2. Calendrier : vue semaine (mode "mois"/"semaine" bascule, navigation semaine) — CalendarView.tsx
3. Calendrier : clic événement → dialog édition (PlanScheduleDialog réutilisable) — ajouter schedules.update dans routers.ts (import getScheduleByIdWithCheck, updatePublishedSchedule)
4. Notifications badge J-1 + lien miniature : 
   - Schema notifications N'A PAS de colonne metadata → utiliser une colonne `linkUrl` text ? ou metadata text. Plan : ajouter colonne metadata text au schema (migration), createNotification dans db.ts ajoute metadata optionnel
   - fire (reminders router) : passer metadata JSON {thumbnailId, scheduleId, type:"planning-reminder"}
   - Notifications.tsx : badge "J-1" quand metadata contient planning-reminder + bouton "Voir la miniature" (navigate vers /editor avec l'image, ou juste un clic qui ouvre la miniature)
   - Cloche (PageHeader) : compteur badge existant ; ajouter un menu dropdown avec liste des 3 dernières + badge J-1 ? Le badge existe déjà (notifications.count + "1" rouge dans sidebar). Ajouter dropdown avec liens.
5. Router schedules : ajouter procédure update (z.object({id, youtubeTitle?, scheduledAt?}))
6. Dialog édition : dans Dashboard.tsx réutiliser le plan dialog existant en mode édition (param initialSchedule) OU nouveau dialog simple dans CalendarView avec 2 champs.
7. Tests features.v10.test.ts : schedules.update ownership + updatePublishedSchedule ; vérif notification.metadata.
8. tsc + pnpm test + screenshots light + checkpoint.

### Détails techniques clés
- CalendarView.tsx (client/src/components) : reçoit onEventClick ?(scheduleId) ; listMonth {year, month} ; events = {id, youtubeTitle, scheduledAt, imageUrl}
- Dashboard.tsx plan dialog : chercher "Planifier" — input youtubeTitle + datetime-local + schedules.create
- PageHeader : cloche notifications avec badge (client/src/components/PageHeader.tsx)
- Notifications.tsx : page /notifications (client/src/pages)
- Router router : appRouter = router({ ... search:, schedules:, reminders:, org:, admin: })
- fireRemindersProcedure dans reminders.fire appelle createNotification(userId,title,message,type) — ajouter 5e param metadata
- db.ts createNotification ligne 567 : data {userId,title,message?,type?} → ajouter metadata?: string, insert notification avec metadata
- Schema notifications ligne 228-238 : ajouter metadata: text("metadata"), migration drizzle-kit generate → webdev_execute_sql

## MISE À JOUR 2 (11:52) — état v10

### FAIT DEPUIS
- Schema : notifications.metadata text ajouté + migration 0009 appliquée
- db.ts : createNotification accepte metadata; getScheduleByIdWithCheck + updatePublishedSchedule ajoutés
- routers.ts : schedules.update ajouté (ownership + date future vérifiée); reminders.fire passe metadata JSON {thumbnailId, scheduleId, kind:"planning-reminder"}
- index.css : bg-[#121212] ajouté aux overrides .light (2 blocs)
- CalendarView.tsx REÉCRIT : bascule Mois/Semaine, dialog édition ScheduleEditDialog (titre + datetime-local + boutons Retirer/Enregistrer/Annuler), thème-aware (const CARD/CELL/BTN/EVT), vue semaine avec image miniature + heure
- Notifications.tsx : badge "J-1" (pink) + lien "Voir la miniature à publier" → /editor?imageId={thumbnailId}; helpers parseMeta/isPlanningReminder/getThumbId ajoutés

### RESTE
1. AppSidebar : badge "1" hardcodé ligne 331 → remplacer par badge dynamique via trpc.notifications.count (si procédure existe) ; vérifier d'abord si une procédure count existe dans notificationsRouter (router line ~153? list seulement vérifié) — si pas de count, ajouter count à notificationsRouter ET marquer le badge avec badge J-1 distinct (rappels)
2. Dropdown cloche dans AppSidebar : au clic sur "Notifications" garder navigation simple ? L'utilisateur demande "badge de rappel dans la cloche" → ajouter un DropdownMenu avec les 3 dernières notifs + liens (rappels J-1 en priorité) — dans AppSidebar sous le profil, remplacer le Link par un DropdownMenu avec trigger cloche
3. Tests features.v10.test.ts : schedules.update (success, NOT_FOUND autre user, past date) + notification.metadata (fire reminder)
4. Screenshot light mobile/desktop (theme=light) + dark + pnpm test + tsc + checkpoint

### Détails
- AppSidebar ligne ~327-332 : Link /notifications avec badge rouge "1" hardcodé (à dynamiser)
- La cloche de la page Notifications existe déjà (Badge J-1 page). Pour la cloche "globale", ajouter menu dropdown dans AppSidebar (header ou profil) — FloatingMenu mobile n'a pas de cloche
- trpc.notifications : router avec list + markAllRead (lignes ~145-160 des routers) — vérifier exact

## MISE À JOUR 3 (11:53) — presque tout fait

TOUT FAIT côté code : schema+migration 0009, db.ts (metadata, getRecentUnreadNotifications, updatePublishedSchedule), routers (schedules.update, notifications.recent, reminders fire avec metadata), index.css light (bg-[#121212]), CalendarView réécrit (mois/semaine + dialog édition), Notifications.tsx (badge J-1 + lien), AppSidebar (cloche dynamique unreadCount + dropdown rappels J-1 + markRead).

RESTE UNIQUEMENT : (1) test features.v10.test.ts (schedules.update success/404/past-date + notifications.recent), (2) screenshots light/dark dashboard + landing mobile, (3) cocher items v10 dans todo.md, (4) checkpoint. Test pattern : réutiliser vi.mock('./db') depuis features.v8.test.ts (helpers getScheduleByIdWithCheck, updatePublishedSchedule déjà exportés, getRecentUnreadNotifications à ajouter au mock).

## MISE À JOUR 4 (11:55) — validation finale

Tests: 59/59 vitest verts (v10 = 9 tests: schedules.update x4, listMonth, notifications recent/unreadCount/markRead, reminders.fire metadata).

Screenshots: light mobile landing = hamburger désormais BLANC (plus de rond noir), pill ABCD gris clair, texte lisible. Dashboard light + dark OK. Le dev server applique apparemment un thème clair global persistant (les cards sont claires en /dashboard sans ?theme= — la session screenshot est peut-être en light maintenant). Les deux thèmes sont harmonisés via index.css overrides .light.

Il reste: cocher items v10 dans todo.md + checkpoint. Tous les items v10 du todo.md: thème clair complet (fond/textes hardcodés), polices harmonisées, calendrier interactif (dialog édition), vue semaine, badge J-1 notifications, tests.
