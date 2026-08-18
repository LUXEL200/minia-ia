# V21 — État du chantier (16/08)

## Demandes utilisateur
1. Thème clair uniformisé (sidebar éditeur + blocs sombres landing)
2. Créer la page Notifications (/notifications) + entrée dans le menu
3. Animations d'effets spéciaux sur les actions (activer/supprimer/modifier/enregistrer/sauvegarder/télécharger)

## Phase 1 — Thème clair : avancée
✅ Fait :
- Editor.tsx : sidebar `bg-[#0c0d12]` → `bg-background`, topbar + versions panel `bg-[#0c0d12]` → `bg-background`, accents orange-300 → foreground
- TemplateEditor.tsx : `bg-black text-white` → `bg-background text-foreground`, zinc-950/900 → background/card, zinc-700/800 → border, hover:bg-zinc-800 → hover:bg-muted
- GalleryPreviewSection.tsx : fond gradient #09090B → from-background via-muted/40, #A1A1AA → muted-foreground, placeholders muted, CTA text-foreground + hover:bg-muted

## Phase 1 TERMINÉE — tsc OK, tests 81/81. FloatingMenu déjà isLight-aware, VT ligne 274 = avatar coloré (OK, pas sombre). Footer : wrapper subpage déjà traité.

## Phase 2 — Page Notifications (/notifications) : FAIT
- Backend : notificationsRouter (ligne 783 server/routers.ts) : list/markRead/markAllRead/unreadCount/recent — déjà présent.
- Route /notifications déjà dans App.tsx (ligne 82).
- Notifications.tsx RÉÉCRIT : theme-aware (bg-background/text-foreground), icônes par kind (planning-reminder=CalendarClock, generation-ready=ImageIcon, low-credit=Zap, team=Users), badge J-1 orange, card unread=orange-400/15, header avec lien retour Dashboard.
- RESTE : vérifier l'entrée dans AppSidebar (bell + 'Voir toutes les notifications' ligne 373/394/427 — probablement déjà OK) puis passer à la phase 3 animations.

## Phase 3 — Animations actions
- Créer client/src/components/ActionEffects.tsx : composant Confetti (canvas léger, ~40 particules, 900ms), FlashOverlay (flash orange → transparent), PopButton (scale bounce sur click).
- Hook useActionEffect : showConfetti() / showFlash().
- Intégrer : toastRich existant dans lib/toasts ? vérifier ; boutons Télécharger (Editor export), Enregistrer (image.save?), Favoris (toggle), Supprimer (toasts undo), Sauvegarder (versions.saveVersion) — ajouter les effets sur ces actions côté client.

## Vérifications finales
- npx tsc --noEmit ; pnpm test (81/81) ; screenshots / , /dashboard, /editor?thumb=x (desktop light + mobile light).
- ThemeProvider defaultTheme : vérifier value (App.tsx).
- Checkpoint + todo.md items cochés.

## Diagnostic confirmé (après lecture fichiers)
- Home.tsx:23 `<div className="min-h-screen bg-[#09090B] text-white">` ET SubPageLayout.tsx:12 idem → c'est le wrapper global qui force le fond noir en light. Override index.css `html.light .bg-\[\#09090B\]` existe mais ne cible peut-être pas quand la classe est appliquée sur un div imbriqué (spécificité : l'override `html.light .bg-\[\#09090B\]` devrait matcher). En fait le problème = l'override est présent mais la capture montre encore des blocs noirs : vérifier si ThemeProvider ajoute bien `.light` à html. Navbar a isLight-aware. Le plus sûr : remplacer les wrappers par bg-background text-foreground.
- VideoTestimonialsSection ProductDemoFrame = déjà bg-card/95 (OK), la section bg-background (OK). Sur la capture IMG_9409 le bloc noir est le wrapper min-h-screen noir visible sous les sections (le fond de page blanc clair de l'iframe). Le problème principal = Home.tsx + SubPageLayout hardcodent #09090B.
- Sections restantes à rendre theme-aware : ParallelSection, PodcastSection, PricingSection, ProcessSection, FounderSection, TestContributionsPanel, GlobalSearchDialog items, HeroSection avatars border, Navbar mobile menu + DropdownMenuContent.

## Astuce thème
Le site utilise index.css tokens oklch ; les classes utilitaires Tailwind `bg-card`, `bg-background`, `text-foreground`, `border`, `text-muted-foreground` se résolvent automatiquement en light/dark. Remplacer les couleurs hardcodées par ces tokens. Pour les sections landing gardées sombres, préférer des variantes via `.dark` + `.light` overrides plutôt que des couleurs dures.
