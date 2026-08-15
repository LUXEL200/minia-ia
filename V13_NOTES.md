# V13 — Corrections comportements : notifications, validation, suppression, chargement

## Sources UI consultées (compétence saas-replica)
- 21st.dev notification components : patterns notables — toasts avec icônes colorées par type (erreur/ok), toasts multi-lignes avec titre + message, toast avec actions JSX, badges compacts, transitions slide/fade, hiérarchie visuelle claire (icône → titre gras → description), durée auto-dismiss visible (barre de progression).
- À appliquer dans Minia IA :
  1. Toasts enrichis : icône CheckCircle/Emergency/x, titre + description, actions éventuelles (Annuler/Restaurer), durée 3-4s avec barre de progression.
  2. Cloche : badge animé (scale pop à l'apparition), pulsation discrète.
  3. Dropdown cloche : séparation visuels types, date relative (il y a 2 min), bouton « Tout marquer lu » dans le dropdown, lien direct vers la miniature pour les rappels J-1 (pas seulement /notifications).
  4. Liste notifications : marquage lu au survol/clic instantané (optimistic), date relative, états vides illustrés.
  5. Validation/suppression : dialog de confirmation pour la suppression définitive, toast « Restaurer » avec action inverse (trash→restore), badge statut qui pulse à la transition.
  6. Chargement : skeletons (Skeleton de shadcn) au lieu de simple texte « Chargement... », transition fade sur les résultats.

## Audit en cours (état du code)
- AppSidebar.tsx : cloche dans le dropdown profil (bouton « Notifications ») → menu latéral avec rappels J-1 ; badge rouge unreadCount. Bugs détectés :
  - « Ouvrir tout » appelle onClose() au lieu de naviguer vers /notifications (bouton inutile).
  - Clic sur un rappel → navigue /notifications après markRead, mais ne va pas vers la miniature concernée (metadata.thumbnailId non utilisé).
  - Le badge badge J-1 existe déjà ; manque : dates relatives, « tout marquer lu » dans le dropdown.
- Notifications.tsx : page liste, markAllRead. À vérifier : chargement, état vide, marquage lu individuel.
- Dashboard.tsx : panneau « Planifiées » avec countdown.
- Validations : boutons « Valider » (approve) dans Dashboard/Miniatures cards — vérifier toggle + feedback.
- Suppressions : moveToTrash (Dashboard/Miniatures) avec toast ; Trash.tsx (restore/empty/delete définitif).
- Chargement : plupart des pages affichent « Chargement... » en pulse — remplacer par skeletons sur les pages critiques (Dashboard, Miniatures, Notifications, Trash, Favorites).

## Correctifs prévus
- [ ] Sidebar : « Ouvrir tout » → navigue /notifications ; item rappel → lien direct vers la miniature (hash #miniatures + scroll) ou dialog planifier ; bouton « Tout marquer lu » dans dropdown cloche.
- [ ] Notifications.tsx : skeleton au chargement, marquage lu instantané (optimistic + invalidate), dates relatives, « Tout marquer lu » toast, état vide plus clair.
- [ ] Suppression : toast « Restaurer » avec action undo (trash) ; confirmation dialog pour suppression définitive dans Trash ; invalidation cache après mutations.
- [ ] Validation : feedback toast + badge pulse sur les actions favoris/valider/supprimer ; confirmation avant suppression définitive.
- [ ] Skeletons : Dashboard/Miniatures/Notifications/Trash/Favorites au chargement (Skeleton shadcn).
- [ ] Toasts enrichis : icônes + titre/description (sonner supporte JSX description).
- [ ] Tests vitest v13 + tsc + screenshots + checkpoint.

## État du code existant (audit v13)

### Notifications.tsx (déjà correct en grande partie)
- Skeleton 5 barres pulse OK, état vide avec icône, badge J-1, lien « Voir la miniature à publier » → `/editor?imageId=X`, bouton « Tout marquer lu » toast + refetch.
- Améliorations possibles : marquage lu individuel au clic (aucun !), dates relatives (relativetime), refetch après marquage individuel, toast enrichi.

### AppSidebar.tsx (lignes clés à corriger)
- L341-346 : badge rouge unreadCount OK.
- L347-397 : dropdown cloche « Rappels de planification » :
  - L351-355 : bouton « Ouvrir tout » appelle `onClose()` → NE NAVIGUE PAS (bug à corriger : navigate("/notifications") + onClose).
  - L363-369 : clic rappel → navigate(`/notifications`) après markRead — pourrait naviguer vers la miniature (thumbnailId) mais /notifications est acceptable ; lien direct vers miniature via #miniatures + scroll serait mieux : utiliser `navigate("/dashboard#miniatures")` avec focus.
  - L358-388 : pas de dates relatives, pas de « Tout marquer lu ».
  - recentNotifs limité à 3.

### Backend notificationsRouter (server/routers.ts L775-803)
- list, unreadCount, markRead, markAllRead, recent(3 dernières non lues). markAllRead retourne {success} OK.

### Skeletons existants
- DashboardLayoutSkeleton.tsx existe pour Dashboard. Notifications a des barres pulse inline.
- Pages restantes sans skeleton : Trash, Favorites, Miniatures(?), Billing(?), Avatars, EndCards.

### Toasts actuels
- Sonner toast.success/error utilisés partout avec simple string — à enrichir : title + description + icône + actions (undo restore).

## Plan de correctifs final
1. Sidebar : « Ouvrir tout » → navigate("/notifications") ; chaque rappel → lien direct Dashboard#miniatures avec highlight ; bouton « Tout marquer lu » dans dropdown ; dates relatives (formatDistanceToNow).
2. Notifications.tsx : marquage lu individuel au clic sur la ligne (optimistic) ; date relative ; invalider unreadCount après marquage.
3. Suppression : toast « Restaurer » avec action undo dans moveToTrash ; confirm dialog delete définitif ; badge pulse.
4. Skeletons : wrapper Skeleton standard pour Trash/Favorites (composant utils SkeletonList).
5. Toasts enrichis partout (helper lib/toast.tsx enrichToast ?) — au minimum sur actions critiques.
6. Tests vitest v13 + tsc + screenshots + checkpoint.

## Avancement correctifs v13 (à jour)
FAIT :
- AppSidebar.tsx : imports utils/toast/formatDistanceToNow/fr OK ; markReadMut + markAllReadMut avec invalidation (utils.notifications.unreadCount/recent/list) ; « Ouvrir tout » → navigate("/notifications") ; bouton « Tout marquer lu » dans dropdown cloche ; dates relatives dans dropdown ; animation fade-in slide-in sur items.
- lib/toasts.tsx créé : toastRich(variant,title,{description,undo}), toastSuccess/toastError ; sonner toast(message) avec description JSX.
- Notifications.tsx : marquage lu individuel optimiste (optimisticRead Set), clic sur ligne, utils invalidation, dates relatives, animate-in, pulsation cloche non lue.
- Dashboard.tsx : import toastRich + utils ; deleteMutation avec toast undo (trashRestoreMutation hook dédié + fetch trash list) ; likeMutation toast ; invite/remove/createTask/updateTask toasts enrichis avec libellés de statut FR.
- Trash.tsx : invalidateAfter + toasts enrichis (restore, empty).

RESTE :
- Miniatures.tsx : vérifier mutations (favoris/supprimer/partager/valider) → toasts enrichis.
- Favorites.tsx : déjà OK (skeleton + état vide), rien de critique.
- Vérifier que utils.thumbnail.list existe (oui router thumbnail list ligne 900).
- Toasts de la planification Dashboard (lignes 99-122) : améliorer aussi.
- Tests vitest v13 (au moins pour toasts non critique ; tester invalidate n'est pas nécessaire) + pnpm test + tsc + screenshots + checkpoint.
- todo.md items v13 à cocher avant checkpoint.

## État v13 (juste avant tests finaux)
Fait :
- AppSidebar : cloche dropdown avec Tout marquer lu (markAllRead, invalidation unreadCount/recent/list), Ouvrir tout → /notifications, dates relatives date-fns/fr, animations fade-in.
- lib/toasts.tsx : toastRich(success|error|info|warning, title, {description, undo?}), toastSuccess/toastError. Sonner description JSX icône + libellés FR.
- Notifications.tsx : clic ligne = markRead optimiste (Set), pulsation cloche non lue, dates relatives, invalidation.
- Dashboard.tsx : toasts enrichis delete (undo restauration via trash.list.fetch + trashRestoreMutation hook dédié), like, invite, remove, createTask/updateTask (libellés FR), planYoutube/unplanYoutube, createSchedule (invalidation schedules.list + listMonth), deleteSchedule.
- Miniatures.tsx : toasts enrichis delete/like/createTask (utils.team.tasks.invalidate) + share.
- Trash.tsx : invalidateAfter (trash.list, thumbnail.list, thumbnail.credits) + toasts enrichis.
- Tests v13 : server/features.v13.test.ts — 8 tests (list, unreadCount, recent max3 unread, markRead, markAllRead, getRemindersToFire fenêtre, fireReminders, listMonth). Corrections : isRead = "read"/"unread" string, metadata search "Ma vidéo". Appeler via appRouter.createCaller(... as never).

Reste :
1. Lancer pnpm test complet (64+8 = 72 attendus).
2. tsc --noEmit (0 erreur actuellement).
3. Screenshots vérifs (dashboard light).
4. Cocher items v13 dans todo.md (section déjà ajoutée en append).
5. Checkpoint (auto-publish ON).
6. Message résultat avec : guide comportement notifications corrigés (cloche badge réel, marquage clic, rappel J-1 cron), undo suppression, toasts enrichis, chargement (skeletons existants OK).
