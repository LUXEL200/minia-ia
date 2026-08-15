# Notes d'implémentation v2 (Minia IA)

## Tâche en cours : 3 nouvelles fonctionnalités
1. Éditeur de templates utilisateur (personnalisation texte/couleurs/emojis)
2. Système de versions d'images dans l'éditeur Canva
3. Mode A/B Test avec suivi CTR déclaré

## État backend (COMPLET sauf 8 erreurs TS mineures)
- 3 nouvelles tables créées en BDD : `templateCustomizations`, `imageVersions`, `abTests`
  (migration drizzle/0003_faulty_ben_urich.sql appliquée via webdev_execute_sql)
- Schéma : drizzle/schema.ts (fin du fichier)
- db.ts : helpers ajoutés (createTemplateCustomization, updateTemplateCustomization, deleteTemplateCustomization, createImageVersion, deleteImageVersion, createAbTest, updateAbTest, deleteAbTest)
- routers.ts : 3 sous-routeurs ajoutés `customizations`, `imageVersions`, `abTests` + composés dans appRouter
- Erreurs TS restantes (8x) : 'db' is possibly null dans routers.ts lignes 120, 129, 179, 207, 212, 213, 229, 248
  → FIX : après `const db = await getDb();` ajouter `if (!db) throw new TRPCError({code:"INTERNAL_SERVER_ERROR", message:"BDD indisponible"});`

## Progress frontend (au moment de la compaction)
- TemplateEditor.tsx créé (route /template-editor, complète)
- Templates.tsx : bouton Pencil "Personnaliser" ajouté (navigate /template-editor?templateId=X)
- App.tsx : routes /template-editor et /ab-test enregistrées
- Editor.tsx : versions logic ajoutée (thumbnailId param, captureSnapshot, handleSaveVersion, handleRestoreVersion, imports trpc + History/ChevronLeft)
- RESTE pour Editor.tsx : bouton History dans renderToolbar (~ligne 383) + panneau versions (dropdown sous le bouton) + bouton restore dans le panneau
- AbTest.tsx : À CRÉER (route /ab-test)
- DashboardLayout.tsx : ajouter lien "A/B Test" dans le menu hamburger (recherche "templates" pour localiser)
- Vérifier tsc OK, tests vitest, screenshots, checkpoint final

## Plan frontend original
- Templates.tsx : ajouter bouton "Personnaliser" sur chaque template → /template-editor?templateId=X
- Nouvelle page TemplateEditor.tsx : canevas 1280×720 avec image template en fond + éléments texte/emoji déplaçables, couleurs, panel propriétés. Utiliser toPng de html-to-image pour générer l'image → uploader via trpc ? (pas de upload S3 côté user côté client simple : utiliser tRPC `templates.create` pour sauvegarder l'image base64 ou utiliser l'API storage. Décision : générer image dataURL → POST via une route serveur pour upload S3, ou simplement sauvegarder la dataURL comme imageUrl (base64 data URL acceptée comme image).
- Editor.tsx : ajouter panneau "Versions" (icône Layers/historique) — bouton "Sauvegarder la version" + liste versions + restaurer/supprimer. Les versions stockent imageUrl (toPng du canvas actuel) + elements JSON.
- Nouvelle page AbTest.tsx (route /ab-test) : liste tests, créer test (choisir 2 miniatures), mise à jour vues/clics (stats YouTube Analytics déclarées), CTR auto-calculé côté serveur, déclarer gagnant.
- Ajouter lien "A/B Test" dans le menu hamburger sidebar (DashboardLayout.tsx) + icône dans navigation flottante dashboard optionnel.

## Routes frontend existantes (client/src/App.tsx)
- /dashboard, /editor, /gallery, /admin, /templates, /avatars, /end-cards, /favorites, /trash, /account, /api-keys, /settings, /billing, /notifications, /preview

## Style projet
- Dark theme #000/#0a0a0a fond, accents cyan-500/pink-500, cards bg-white/5 border-white/10, glassmorphism léger
- Composants shadcn/ui, lucide-react, sonner toast, wouter (useLocation/useSearch), trpc client hooks
- export PNG existant dans Editor.tsx : `toPng(canvasRef.current, { width:1280, height:720 })` depuis html-to-image

## Livrable final attendu
- Checkpoint après tests vitest + screenshots responsive, puis message final avec suggestions

## Vérification par screenshots (effectuée)
Les pages Templates (16 templates visibles avec filtres), Tests A/B (état vide correct avec CTA), Éditeur de template (canevas 1280×720 avec image de fond, panneau Ajouter/Emoji/Formes/Fond, boutons Enregistrer et Exporter PNG) et Dashboard fonctionnent correctement. Tests vitest : 9/9 passés. TypeScript : 0 erreur.

## Reste à faire avant livraison
1. Marquer les 3 fonctionnalités comme [x] dans todo.md
2. webdev_save_checkpoint avec message décrivant les 3 fonctionnalités
3. Message final utilisateur + suggestions prochaines étapes

## Corrections v3 (demande utilisateur)
1. Espace Canva : ajout d'un lien "Espace Canva" (/editor) dans la section Outils supplémentaires du menu hamburger du Dashboard.tsx (fait).
2. Editor.tsx : ajout d'un bouton "Importer une image" (upload de fichier image comme fond du canevas) dans le menu Ajouter de la barre latérale + bouton "Retirer l'image de fond" + message d'accueil "Espace Canva — ajoute des éléments ou une image de fond" avec bouton importer. File input hidden avec ref bgUploadInputRef. Fait.
3. Reste : onglet inspiration Dashboard.tsx — autoriser l'upload d'image en plus du lien (inspirationUrl/inspirationImage existent lignes ~47 et handleInspirationSubmit ligne ~733).
4. Reste : généraliser le menu hamburger avec tous les sous-menus de gauche sur TOUTES les pages dashboard (Templates, Avatars, EndCards, Favorites, Trash, Preview, Notifications, Account, ApiKeys, Billing, Settings, Admin, AbTest, Editor, TemplateEditor). La sidebar complète (avec tous les sous-menus) n'existe que dans Dashboard.tsx. Plan : créer un composant partagé AppSidebar.tsx réutilisable (extract ou copier la sidebar de Dashboard.tsx avec showSidebar/showProfileMenu/admin link), puis l'intégrer dans chaque page. PageHeader.tsx existe (client/src/components/PageHeader.tsx) — peut contenir le bouton hamburger.
5. Routes existantes : /editor, /template-editor, /ab-test, /avatars, /preview, /endcards, /favorites, /trash, /templates, /notifications, /account, /api-keys, /billing, /settings, /admin, /models.
6. Dashboard.tsx hamburger : section "MiniIA" (Tableau de bord / Miniatures / Personnes / Modèles), Outils (Avatars, Aperçu, Endcards, Favoris, Poubelle, Editor, AbTest), CTA Pro, profil dropdown.
7. Note : console log ancien SyntaxError createAbTest est un log daté (08:15) datant d'avant la correction, ignore.

## Vérification v3 (screenshots)
- Home : hamburger visible dans la navbar (icône menu à droite) — OK
- /templates : PageHeader avec bouton hamburger + breadcrumb + bouton Retour — OK, 16 templates visibles
- /ab-test : PageHeader avec hamburger — OK
- /dashboard : ERREUR "Rendered more hooks than during the previous render" — probablement un hook après un return conditionnel ou un hook conditionnel introduit dans mes edits de Dashboard.tsx. À diagnostiquer : j'ai ajouté `inspirationFileInputRef = useRef<HTMLInputElement>(null)` AVANT `renderGenerateView` mais dans le corps du composant (OK). Problème probable : `renderSidebar`/render* définis dans le corps + early returns (navigate effect). Vérifier l'emplacement du useRef par rapport aux returns conditionnels dans Dashboard.tsx.

## État généralisation hamburger (fait)
- AppSidebar.tsx créé (client/src/components/AppSidebar.tsx) : slide-in sidebar + AppHeader exportés. Sidebar complète : org info, Créer une miniature, Plate-forme, Minia IA (Tableau de bord/Miniatures/Personnes/Modèles), Outils (Espace Canva /editor, Tests A/B /ab-test, Avatars, Aperçu, Endcards, Favoris, Poubelle), CTA Pro, profil dropdown (Pro/Mode clair/Compte/Clés API/Paramètres/Facturation/Notifications/ADMIN/Déconnexion).
- PageHeader.tsx réécrit : ajoute bouton hamburger + AppSidebar. Pages Templates/Avatars/EndCards/Favorites/Trash/Notifications/Account/ApiKeys/Billing/Settings/AbTest héritent du hamburger automatiquement.
- Navbar.tsx : hamburger ajouté (tous écrans) + AppSidebar.
- Dashboard.tsx : lien Espace Canva ajouté dans la sidebar interne + upload inspiration fait.

## Vérification finale v3 (après fix hooks)
Dashboard rend sans erreur (hooks déplacés en tête de composant). L'écran d'accueil du dashboard est visible avec les cartes, personnes, générations récentes et barre flottante. Le mobile (375x812) montre le hamburger dans la navbar en haut à gauche sur / et sur /dashboard. L'éditeur montre le vide state "Importer une image" (bouton d'import de fond déjà en place). L'upload dans l'onglet inspiration est branché sur `inspirationFileInputRef` (ligne ~824) et `handleInspirationFileUpload`. Reste : vérifier l'upload inspiration dans le dashboard screenshot live, puis checkpoint.

## État v3 — corrections demandées par l'utilisateur (15/08)
La vérification du dashboard connecté via navigateur bloquait sur la page de connexion Manus (captcha "Verify you are human" + notice suppression de compte région utilisateur, impossible de cocher par coordonnées). J'ai abandonné la vérification E2E loggée et me suis basé sur le code + screenshots non-loggés : hooks fixés, TS clean, 9 tests verts.

### Travaux v3 terminés
1. **Espace Canva visible** : lien "Espace Canva" ajouté dans la sidebar hamburger du dashboard + vide-state clair "Importer une image" dans /editor.
2. **Upload image inspiration** : Dashboard.tsx onglet "Image inspirée" = bouton "Importer une image depuis mon appareil" (dataURL ≤8Mo) + champ URL Pinterest. Le backend thumbnail.generate accepte maintenant `inspirationImageUrl` (URL) ou `inspirationB64`/`inspirationMime` (upload) → passé à generateImage via `originalImages` (b64Json ou url).
3. **Hamburger partout** : AppSidebar.tsx (composant partagé, menu complet : Créer miniature, Plate-forme, Tableau de bord/Miniatures/Personnes/Modèles, Espace Canva, Tests A/B, Avatars, Aperçu, Endcards, Favoris, Poubelle, Pro, profil dropdown) intégré dans PageHeader.tsx (pages Templates/Avatars/EndCards/Favorites/Trash/Notifications/Account/ApiKeys/Billing/Settings/AbTest) et Navbar.tsx (pages publiques). Dashboard.tsx : lien Canva ajouté dans sa propre sidebar.

### Vérifications restantes avant checkpoint
- Screenshot non-loggé : dashboard montre le hamburger dans la navbar (OK), /templates et /ab-test avec hamburger (OK), mobile 375x812 OK.
- Reste à faire : vérification du payload inspiration dans l'UI (l'onglet "Image inspirée" n'est visible qu'après clic sur l'onglet, screenshot initial montrait la vue home) — code revu, semble correct (lignes 796-860 de Dashboard.tsx).
- Puis : pnpm test + checkpoint + message de livraison.
