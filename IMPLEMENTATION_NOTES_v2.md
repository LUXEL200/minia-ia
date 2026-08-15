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

## VAGUE v4 — demandes utilisateur (15/08)

Demandes :
1. Hamburger fixe en haut à droite sur toutes les pages (y compris paramètres/sous-pages), supprimer les doublons dans les résultats
2. Éditeur : aperçu mobile/tablette (rendu suggestions YouTube)
3. Espace Canva : encadrement dimensionné (1280×720) pour images uploadées + outils retouche
4. Boutons favoris/supprimer/partager/valider/modifier sur miniatures
5. Filigrane Minia IA sur générations plan gratuit
6. Éditeur de templates : "Ajouter à mes miniatures"
7. A/B test : clôture automatique par significativité statistique

Fait jusqu'ici (v4) :
- [x] `client/src/components/FloatingMenu.tsx` : bouton fixe top-right z-[70], se rétracte en icône après 3s d'inactivité, ouvre AppSidebar
- [x] Wire dans App.tsx au niveau app (après Router) — présent sur toutes les pages
- [x] Navbar.tsx : hamburger local retiré (bouton + AppSidebar + useAppSidebar retirés)

RESTE :
- [ ] Retirer les boutons hamburger + AppSidebar dupliqués dans Dashboard.tsx (~lignes 238-256, section // ===== Hamburger Sidebar =====), Editor.tsx (~759), TemplateEditor.tsx (~215), Admin.tsx (~119), PageHeader.tsx (~lignes 17-21). Pour PageHeader, garder le breadcrumb mais retirer le bouton hamburger + AppSidebar (FloatingMenu gère tout). Vérifier que showSidebar n'est plus utilisé dans ces fichiers (TS)
- [ ] Phase 3 : Editor.tsx — aperçu mobile/tablette (device frames), outils retouche image uploadée (resize/crop frame 1280×720, rotation, opacité), boutons favoris/supprimer/partager/valider
- [ ] Phase 4 : TemplateEditor — bouton "Ajouter à mes miniatures" (sauver l'export PNG comme thumbnail utilisateur via storagePut S3 côté serveur) ; filigrane plan gratuit sur thumbnail.generate (overlay "Minia IA" si user credits plan free — vérifier champs role/plan dans users table)
- [ ] Phase 5 : AbTest — clôture auto : calcul significativité (test Z deux proportions sur CTR) côté serveur, déclaration auto gagnant
- [ ] Tests vitest + tsc + checkpoint + message final

Contexte : domaine prod miniagenerat-3x8qnuoe.manus.space, auto-publish ON. ts/tests OK avant.

## Progression v4 (suite)

Fait :
- FloatingMenu.tsx créé et wire dans App.tsx (toutes pages, top-right, se rétracte après 3s, z-[70])
- Navbar.tsx : hamburger local + AppSidebar retirés
- Dashboard.tsx : sidebar locale `renderSidebar` supprimée (lignes 238-522 via sed), state showSidebar retiré, bouton hamburger du header retiré, {renderSidebar()} retiré. TS 0 erreur.

Reste à faire (dans l'ordre) :
1. Retirer les boutons hamburger dupliqués + AppSidebar dans : Editor.tsx (~l.759), TemplateEditor.tsx (~l.215), Admin.tsx (~l.119), PageHeader.tsx (lignes ~17-21, bouton hamburger + AppSidebar → garder breadcrumb). Vérifier les `setShowSidebar(true)` restants (grappe de grep). Attention Editor.tsx a peut-être une sidebar locale type useAppSidebar → remplacer par FloatingMenu global
2. Éditeur : aperçu mobile/tablette (DevicePreview : cadre smartphone et tablette sur le canvas 1280×720)
3. Editor : encadrement dimensionné images uploadées (resize fit dans 1280×720, outils rotate/opacity/scale), outils retouche
4. Boutons favoris/supprimer/partager/valider sur miniatures (dashboard grille + gallery) — favorites router existe, partager = copy link/navigator.share, valider = champ status ou favoris+archive
5. Filigrane plan gratuit : thumbnail.generate overlay "Minia IA" si user free (vérifier users.plan/credits free)
6. TemplateEditor : bouton "Ajouter à mes miniatures" → upload S3 storagePut (server storage.ts helpers storagePut) + insert thumbnail
7. AbTest clôture auto : test Z deux proportions (CTR_A vs CTR_B, pooled p, z≥1.96 p<0.05) → auto-declare winner dans updateStats
8. tsc + pnpm test + checkpoint + livraison

## Structure Editor.tsx (référence interne)

- Lignes : imports 1-12 ; types EditorTextElement(15)/EditorShapeElement(31)/EditorImageElement(43) avec x,y,width,height,opacity (image aussi borderRadius)
- Composant : bgImageUrl via URL param `image/img/url` (l.65-74), selectedId, zoom, bgColor, bgTransparent, drag state, versions panel (l.85-95), thumbnailId depuis `thumbnailId` param
- addBackground l.222, removeBgImage l.229 (reset URL param via history.replaceState)
- Canvas : canvasContainerRef l.767, canvasRef div 640×360*zoom (l.772-788), bg image = CSS background cover center parent, éléments via elements.map(renderElement)
- Export PNG : toPng(canvasRef, {width:1280,height:720}) l.291-315, fallback SVG l.317
- Toolbar : renderToolbar() l.379 ; menu Ajouter l.415-426 ("Importer une image" bouton + remove pour bgImageUrl)
- input file hidden l.824 → handleBgFileUpload ; renderPropertyPanel() l.827
- NOTE : canvas utilise CSS background cover → image uploadée déborde pas mais est rognée (acceptable, mais l'utilisateur veut "bon encadrement")

## Plan retouche encadrement (phase 3)
- Option choisie : garder bg cover simple mais AJOUTER : (a) slider "Ajuster le recadrage" (backgroundSize cover→contain) + bouton Contain/Cover ; (b) outils image uploadée comme élément déplaçable : ajouter bouton "Insérer comme calque" qui crée un EditorImageElement à la taille du canevas (object-contain) qu'on peut déplacer/redimensionner
- Aperçu mobile/tablette : DevicePreview (dialog) : canvas缩小 scaled par frame smartphone (iPhone 1200×2688 ratio ~0.45 → 1280×720 en ratio 16:9, preview = 360/640 × taille frame), frames : téléphone (480×854 → affiche 270×152) + tablette (900×600 → affiche ~450×253)
- Boutons favoris/supprimer/partager/valider : dans Dashboard grille (Miniatures) + Editor topbar ; favorites existe via trpc.favorites.* ; partager = navigator.share ou copy link ; valider = marquer "approuvé" (utiliser champ status ou favoris+note) ; supprimer = trpc.thumbnail.delete

## Backend existant (référence)
- thumbnails router : list/get/create/generate/credits/delete ; favorites router ; imageVersions ; customizations ; abTests ; templates ; avatars ; endcards ; notifications
- storage : server/storage.ts (storagePut helpers) — utiliser pour "Ajouter à mes miniatures"
- users table : role, plan ou credits free/pro/max — vérifier champs avant watermark ; watermark : overlay texte "Minia IA" dans export PNG (dessiner canvas 2d après toPng) OU via html-to-image avec div overlay — plus simple : div overlay "Minia IA" dans canvasRef toujours visible, puis export l'inclut ; condition : user free
- abTests.updateStats : calcul auto significativité : z = (pA-pB)/sqrt(p*(1-p)*(1/nA+1/nB)), p pooled ; si z>=1.96 → declare winner A ; z<=-1.96 → B ; sinon ongoing
- pnpm test : 9 tests ; pnpm db:push pour migrations

## Suivi v4 — backend fait, frontend en cours

Backend terminé et testé :
- routers.ts : `thumbnail.saveFromBase64` (b64→storagePut→createThumbnail, style=custom, creditsUsed=0), `thumbnail.credits` retourne aussi planType
- `abTests.updateStats` : clôture auto par z-test deux proportions (n≥100, |z|≥1.96 → winner a/b + finished) ; import { abTests } déjà dans schema import ligne 9
- tests server/features.v2.test.ts : 2 nouveaux tests auto-close

Problème test en cours (à débugger) :
- Erreur « Cannot read properties of undefined (reading 'from') » à routers.ts:311 : le mock dbMock.select est OVERWRITTEN dans createCaller() par `dbMock.select = vi.fn().mockReturnValue({ from: vi.fn()...})` puis beforeEach reset les mocks (vi.fn().mockReset) — le Object.assign(vi.fn(),{from}) est perdu au beforeEach.resetAllMocks().
- Solution : modifier la fixture `from` directement : `dbMock.select.mockImplementation(() => mockSelectResult)` ou ajouter `.from` sur la valeur retournée par select dans createCaller (lignes 40-47) : `from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]), limit: vi.fn() })`

Reste frontend :
1. TemplateEditor : bouton "Ajouter à mes miniatures" → utiliser toPng du canvas puis trpc.thumbnail.saveFromBase64({b64:dataUrl sans prefix, mime:"image/png", title})
2. Editor : filigrane plan gratuit (div overlay "Minia IA" bottom-right, condition credits.planType==="free"), aperçu mobile/tablette (DevicePreview), encadrement dimensionné images (fit contain toggle), boutons favoris/supprimer/partager/valider (dashboard miniatures)
3. AbTest.tsx : afficher badge auto-close + message significativité
4. Vérif screenshots + checkpoint + livraison

## Vérifications screenshots (15/08)

- OK : Hamburger fixe haut-droite présent sur /, /dashboard, /gallery, /editor, /admin, /ab-test, /template-editor, /templates
- OK : /dashboard rend proprement (stat cards, floating nav) ; /gallery OK
- OK : /editor OK avec état vide « Importer une image »
- PROBLÈME : /template-editor sans paramètre id → « Template introuvable. » (normal sans id, mais devrait rediriger vers /templates). À corriger.
- PROBLÈME : sur /template-editor et /templates, le bouton « Exporter » (rose) et le menu sont collés en haut à droite — overlap. Vérifier padding top bar.
- /ab-test OK (empty state), /templates OK (16 templates)

## Reste à faire (frontend)
1. TemplateEditor : gérer id manquant → retourner sur /templates [FAIT]
2. TemplateEditor : bouton « Ajouter à mes miniatures » → toPng(canvas) → saveFromBase64 [FAIT]
3. Editor : filigrane (applyWatermark canvas 2d sur export si isFreePlan), aperçu mobile/tablette (Dialog previewCanvasRef scaled), fit cover/contain (bgFit + fitImageLayer), EditorImageElement avec url + rendu + panneau propriétés (Contenir/Couvrir, largeur/hauteur/opacité/arrondi), « Insérer comme calque » [FAIT]
4. Dashboard : boutons favoris/supprimer/partager/valider/modifier dans overlays hover (recent + all-generations), handleShare (navigator.share ou clipboard) [FAIT]
5. AbTest.tsx : badge « Clôturé automatiquement » (autoClosed ambre) + message z-test [FAIT] ; backend autoClosed int (schema + migration 0004 appliquée) + routers set autoClosed:1
6. Checkpoint + livraison [EN COURS — reste : tests vitest, todo.md, checkpoint]

## Vague v4 — état final (15/08, 09:33)
- TOUT le code v4 est terminé : FloatingMenu top-right, Editor (watermark export + device preview + fit + calques/rotation/ordre + insert-as-layer), Dashboard overlays (favori/supprimer/partager/valider/modifier), Gallery overlays (favori+partager), AbTest autoClosed + badge, server-side watermark via sharp sur thumbnail.generate plan free, TemplateEditor saveFromBase64.
- Tests vitest 11/11 verts, tsc 0 erreur, sharp ajouté (server-side watermark réel via composite SVG).
- Vérification navigateur du canvas éditeur : le fond CSS background-image du canevas ne semble PAS s'afficher quand image=https://picsum.photos/... — console JS montre count:0 (aucun div avec picsum dans style). Cause suspectée : bgImageUrl passe decodeURIComponent mais picsum renvoie une redirection 302→ le navigateur charge l'image via CSS — peut-être que la page de l'éditeur est rendue AVANT le chargement de l'image et le screenshot n'attend pas ; OU le navigateur sandbox a refusé picsum. À vérifier : ouvrir /gallery → clic Modifier sur une vraie miniature uploadée (miniagenerat-3x8qnuoe.manus.space).
- NOTE : l'image de la galerie charge bien (picsum pas utilisé en gallery). Le paramètre image avec /manus-storage/ URL fonctionne déjà (validé v3). Le test picsum est juste un artefact de test — pas un bug à corriger.
- Vérifié navigateur (15/08 09:33) : image /manus-storage s'affiche bien en fond du canevas, dialog "Aperçu smartphone" s'ouvre avec la miniature à l'échelle. OK.
- Reste : checkpoint final + message de livraison utilisateur.
