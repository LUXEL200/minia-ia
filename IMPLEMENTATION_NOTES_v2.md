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
