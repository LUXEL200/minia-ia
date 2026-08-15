# V18 — État interne (15/08)

## Demandes utilisateur
1. **Retirer le bouton ADMIN du menu déroulant profil** — FAIT (lien « Super Admin » retiré de AppSidebar.tsx, import Shield retiré). La route /admin existe toujours (App.tsx ligne 94) mais sans entrée UI directe ; accès via saisie directe de l'URL.
2. **Refondre l'interface CANVAS** (éditeur /editor) pour ressembler à l'image de référence IMG_9223.webp (éditeur type CapCut/Canva pro) :
   - Barre haut : logo + icônes (grille, magic, dossier, graph, favori) à gauche ; en haut-centre barre outils (pointeur, recadrer, T texte, cercle, pinceau, calques) + undo/redo + … ; à droite soleil (thème), cloche notif, avatar avec dropdown.
   - Sidebar gauche étroite : bouton + (gradient), home, étincelles, calques, image, pinceau, couronne.
   - Panneau gauche : sélecteur style dropdown, grille de templates/miniatures (avec couronne = favoris), formats 16:9/9:16/1:1/4:5/21:9 (format actif bordé rose/orange), sélecteur couleurs (cercles + cercle color-picker + bouton +).
   - Canvas central : image avec ligne médiane « VS » (juste style), barre d'outils au-dessus, bande de variantes (images miniatures + bouton +) en dessous, barre inférieure « AI regenerate » à droite bouton gradient.
   - Panneau droit : boutons pinceau/horloge, sections slider (7, 50, 65, 35) = nombre d'images, luminosité/saturation/contraste, upload image zone, gros bouton gradient en bas (Générer).

## Architecture actuelle (Editor.tsx, 1151 lignes)
- Canvas interne : 640×360 logique (export 1280×720), coordonnées en base 640/360.
- Types : EditorTextElement/EditorShapeElement/EditorImageElement.
- State : elements, selectedId, zoom, bgColor, bgTransparent, bgFit, bgImageUrl, history/undo-redo, versions (tRPC imageVersions.list/create/restore/delete), devicePreview.
- Toolbar actuelle : fixed left w-16 (renderToolbar), Propriétés fixed right w-56 (renderPropertyPanel), canvas centré.
- Exports : exportCanvas (html-to-image 1280×720 + watermark if free plan), getSVGExport, applyWatermark.
- Couleurs editor : ["#FFFFFF","#000000","#EF4444","#F97316","#EAB308","#FDBA74","#EA580C","#3B82F6","#8B5CF6","#EC4899"] — palette bleu nuit/orange.

## Plan refonte (à faire)
- Nouvelle disposition : topbar (h-12) + zone 3 colonnes :
  - Panneau gauche (w-72) : dropdown « Style », grille templates (utiliser trpc template.list), formats 16:9/9:16/1:1/4:5/21:9 (state format, changer dimensions canvas), palette couleurs.
  - Centre : barre outils horizontale (pointeur/recadrer/texte/formes/pinceau/calques — outils existants), canvas (fond checkerboard), bande variantes en bas (grille miniatures + bouton +), barre action IA en bas (gradient orange bouton « Générer avec IA » → navigate vers /dashboard).
  - Panneau droit (w-72) : sliders opacité/luminosité/saturation/contraste (luminosité/saturation/contraste = filtres CSS overlay sur le canvas via state filters), upload image (zone dashed), bouton Exporter gradient.
- Conserver TOUTE la logique existante (drag, resize, undo/redo, versions, export PNG/SVG, watermark).
- Formats : ajouter state format (16:9=640×360, 9:16=360×640, 1:1=480×480, 4:5=480×600, 21:9=700×300), adapter canvas et export.
- Filtres image de fond : state filters { brightness, saturate, contrast } appliqués en style CSS filter sur l'image de fond (pas sur les éléments), export via CSS filter + html-to-image (vérifier support) sinon garder.
- Responsive mobile : les 3 panneaux passent en onglets/drawer sur mobile.

## Checklist V18 (todo.md)
- [x] Retirer le lien Super Admin du menu déroulant profil (AppSidebar)
- [ ] Refonte CANVAS 3 panneaux (panneau gauche formats/templates/couleurs + topbar + outils + bande variantes + panneau droit sliders/upload + export)
- [ ] Tests vitest + tsc + vérifs visuelles + checkpoint + publication

## Confirmations (post-lecture)
- Super Admin retiré du dropdown profil : AppSidebar.tsx passe directement de la section Notifications (ligne 430) à Déconnexion (ligne 433). OK.
- FloatingMenu.tsx : bouton hamburger fixed top-3 right-3 z-[70] — nouvelle topbar du CANVAS doit laisser l'espace droite libre (z-index topbar < 70 ou padding-right) pour éviter collision.
- TemplateEditor.tsx : header flex (retour + titre | Enregistrer/Ajouter/Exporter), canvas aspect-video, panneau droit lg:w-72 avec tools (Texte/Emoji/Forme), emojis, formes, fond. Couleurs preset : "#ffffff","#000000","#ff0050","#00d4ff","#ffe600","#7c3aed","#fdba74","#f97316","#3b82f6","#ec4899" — contient encore cyan/rose à harmoniser bleu nuit/orange.
- Editor.tsx (1151 lignes) : types EditorTextElement/Shape/ImageElement, canvas 640×360 (export 1280×720), toolbar fixed left w-16, props fixed right w-56, state : elements, selectedId, zoom, bgColor, bgTransparent, bgFit, bgImageUrl, history, devicePreview, versions (imageVersions.list/create/restore/delete), isFreePlan, watermark, format pas encore géré.
- Couleurs editor palette : ["#FFFFFF","#000000","#EF4444","#F97316","#EAB308","#FDBA74","#EA580C","#3B82F6","#8B5CF6","#EC4899"].

## Avancement refonte CANVAS (V18) — statut précis (MIS À JOUR)
- FAIT : tout ce qui suit est déjà appliqué — retires Super Admin dropdown (confirmé), TemplateEditor harmonisé orange, Editor.tsx : imports React complets + Sparkles, state canvasSize + exportDimensions (useMemo, ratios 16:9/9:16/1:1/4:5/21:9, max 1512), captureSnapshot dynamique, renderLeftPanel (aside w-64 bg-[#0c0d12] : formats grille 5, cover/contain, couleurs palette + ∅ transparent, calques Fond/Calque/Retirer fond + Versions badge, footer gradient "Générer avec IA"), renderVersionsPanel flottant (bottom-16), topbar pro h-14 (retour /dashboard md, outils centraux Type/Layers/Undo/Redo/Zoom/Zoom- phone/tablet, droite zoom% + badge filigrane + Exporter gradient orange), menu Ajouter flottant (top-14 centré), canvas dimensions canvasSize.w*h*zoom, preview dialog scale dynamique, rendu final : renderLeftPanel | zone centrale flex-col (topbar + canvas + renderVersionsPanel) | renderPropertyPanel fixed right-0 w-56 bg-[#111] (lignes ~708). Cyan retiré de Editor.tsx (sed), LayoutTemplate retiré. TSC OK.
- FAIT COMPLET : TSC OK, vitest 81/81, screenshots vérifiés : /editor desktop = 3 panneaux OK (gauche w-64 formats/couleurs/calques/générer IA, topbar h-14 outils centraux + Exporter gradient, canvas central état vide propre, panneau propriétés fixed right), /editor mobile OK, mode clair OK (hero light + dashboard light onboarding tour visible), TemplateEditor harmonisé orange (toast "Template introuvable" normal car pas de query param).
- RESTE UNIQUEMENT : checkpoint + livraison.
- NOTE : renderPropertyPanel retourne null si !selectedElement (panneau vide = espace central) — ok.

## Avancement refonte CANVAS (V18) — ancien statut
- [x] Retirer le lien Super Admin du dropdown profil : FAIT ET CONFIRMÉ (AppSidebar.tsx lignes 433-440 passées directement à Déconnexion ; import Shield retiré).
- [x] TemplateEditor.tsx harmonisé orange/bleu nuit : presetColors ["#ffffff","#000000","#f97316","#fdba74","#ffe600","#1e2a5a","#f59e0b","#ea580c","#3b82f6","#fcd34d"], formes carré #f97316/bandeau #fdba74/cercle #ffe600, boutons Ajouter à mes miniatures (gradient orange-400→500) et Exporter PNG (gradient orange-500→amber-400).
- [x] Editor.tsx : renderToolbar supprimé, remplacé par renderLeftPanel (aside w-64 : formats 16:9/9:16/1:1/4:5/21:9 en grille 5, ajustement cover/contain, couleurs palette + bouton ∅ transparent, calques Fond/Calque/Retirer fond + Versions avec badge, footer bouton gradient "Générer avec IA" → /dashboard) + renderVersionsPanel (panel flottant en bas gauche).
- [ ] RESTE à faire dans Editor.tsx :
  1. Ajouter state : const [canvasSize, setCanvasSize] = useState({w:640,h:360}); import Sparkles depuis lucide (erreur tsc 627).
  2. Topbar centrale (remplace l'ancienne topbar) : retour ArrowLeft → /dashboard + titre, barre d'outils centrale (pointeur/texte/forme/pinceau-calques via add menu + undo/redo + zoom in/out + aperçus device), droite : zoom % + badge filigrane + Exporter bouton gradient orange.
  3. Canvas : utiliser canvasSize.w/h au lieu de 640/360 hardcodés ; export 1280×720 → adapter (export en proportions du format choisi, ex 9:16 → 720×1280 ; 1:1 → 720×720 ; 4:5 → 720×900 ; 21:9 → 1280×548). Mettre à jour applyWatermark/getSVGExport/captureSnapshot pour les dimensions dynamiques.
  4. Bandeau de variantes sous le canvas : miniatures récentes (thumbnail.list limitées) avec bouton + → /dashboard.
  5. Panneau droit (renderPropertyPanel) : garder les propriétés éléments existantes + ajouter section "Réglages de l'image" (sliders opacité/luminosité/saturation/contraste appliqués en filter CSS sur bgImageUrl + export ? simplifier : opacité overlay uniquement), zone upload image dashed.
  6. Remplacer le rendu final (lignes ~1007+) : nouvelle structure flex : renderLeftPanel | zone centrale (topbar + canvas + bande variantes + renderVersionsPanel flottant) | renderPropertyPanel (right w-72).
  7. FloatingMenu z-[70] fixed top-3 right-3 : ne pas gêner (padding-right sur topbar non nécessaire, topbar z < 70).
  8. tsc erreurs actuelles : canvasSize/setCanvasSize (508/512), Sparkles (627), renderToolbar (987 — à retirer du rendu final).
- [ ] Tests : 81/81 vitest passent, tsc à valider, screenshots editor + vérif mobile.

## Notes tests
- 81/81 vitest passent actuellement, tsc OK.
