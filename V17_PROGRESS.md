# V17 — État d'avancement (interne)

## Fait
1. Palette : TOUT le vert retiré (86+ occurrences converties en orange dans ~30 fichiers TSX + index.css tokens). 0 vert restant. TemplateEditor #22c55e → #fdba74. tsc OK.
2. Analyse youthumb.ai/en faite → /home/ubuntu/minia-ia/V17_YOUTHRUMB_NOTES.md
3. HeroSection.tsx : maquette produit animée ajoutée (productDemo) — frame app avec barre navigateur "app.minia.ai/create", glow orange, cascade de 3 miniatures + carte génération pulsante, bouton Télécharger, minimize/reduce (Plus/Minus/X), heroCollapsed state. Imports lucide ajoutés (Play, Star, Sparkles, Clock, Zap, X, Minus, Plus). Stack d'images à droite remplacée par productDemo.
4. VideoTestimonialsSection.tsx : entièrement réécrit en "DemoSection" — toujours visible, badge "⊘ DÉMO", titre "Copie le style. Génère en 30s.", ProductDemoFrame (app frame animée useInView, glow, badges style, 4e carte spinner "Génération…", bandeau "4 miniatures générées en 2,4 s" + CTA), signature "Leur vibe. Tes miniatures. 30 secondes.", témoignages vidéo YouTube conditionnels (si IDs), CTA final "Créer mes miniatures".

## Reste à faire
- Vérifier tsc (HeroSection peut utiliser Monitor/Monitor non utilisé — ok si import non utilisé avec tsc strict? vérifier), pnpm test
- Screenshot landing (dark) pour vérifier hero + section démo
- Mark todo.md items [x], checkpoint, livraison

## Notes clés
- Miniatures stockées: /manus-storage/thumbnail-mrbeast_fc8fbcd3.png, thumbnail-tech_81d69968.png, thumbnail-dramatic_1e94decd.png
- Checkpoint précédent: 2d554a19 (V16). Auto-publish activé.
- Le fichier /home/ubuntu/minia-ia/V17_PLAN.md contient les détails de conversion.
- VideoTestimonialsSection.tsx n'utilise PAS Monitor (import inutile possible) → vérifier tsc.
