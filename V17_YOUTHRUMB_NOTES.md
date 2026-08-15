# Notes youthumb.ai/en (analyse V17)

## Hero
- Badge rouge "9,927+ AI THUMBNAILS GENERATED" (compteur animé probablement)
- H1 "Your Designer takes Days." + "Thumbnails take Seconds." (2e partie en rouge, police script/serif italique)
- Sous-titre : "Generate up to 4 viral thumbnails in seconds..."
- 2 CTA : Try for free (rouge plein) / See examples (outline)
- "No credit card required · 5 free thumbnails"

## Vidéo démo (élément clé)
- Une fenêtre type app (frame blanc avec header "APP.YOUTHRUMB.AI") juste sous le hero
- Vidéo embed YouTube avec contrôles : close, minimize (2), unmute — c'est un player vidéo flottant
- La vidéo semble couvrir l'interface du dashboard (démo produit)
- Effet : glow rouge autour du cadre vidéo, fond clair
- Éléments index 10/11/12 : hint "Close video"/"Minimize video"/"Unmute" + "Download"
- La vidéo apparaît automatiquement au chargement de la page (autoplay avec son coupé?)

## À vérifier
- Animations scroll-triggered sur le reste de la page
- Style des sections (marquee logos, bento grids, etc.)

## Adaptation Minia IA (palette bleu nuit + orange)
- Badge compteurs → orange
- Frame vidéo démo → fond bleu nuit, glow orange
- Garder autoplay/sound-off/minimize dans le coin
- Ajouter animations scroll (reveal progressif, parallax léger)

## Scroll 1 (après hero)
- La vidéo démo est un iframe YouTube dans un cadre « app » blanc (header "app.youthumb.ai") avec ombre + glow rouge autour
- Boutons flottants sur le cadre : minimiser (coin) + unmute (coin bas gauche)
- Section suivante : badge "⚡ INSTANT", titre "Get more clicks and views with high-performing thumbnails"
- 3 cartes de styles (MrBeast Style, Tech Review, Dramatic) avec images tiltées (rotation légère, ombre portée, effet pile)
- "Their vibe. Your face. 30 seconds."
- Badge "PROBLEM" rouge rond

## Constats clés pour la refonte Minia IA
- La vidéo démo est une iframe YouTube (pas une galerie d'images) — app.youthumb.ai affiche une vidéo produit
- Animations : cartes tiltées/empilées, badges rouges, glow autour du player vidéo
- Structure hero + player vidéo + grilles de cartes tiltées + marquee possible

## Scroll 2 (section PROBLEM)
- Badge rouge ovale "⊘ PROBLEM" en haut centré
- Titre "Your thumbnail shouldn't be what holds you back" + sous-titre gris
- 3 cartes claires avec icône dans carré coloré (rouge, noir, rouge) : "2 hours on Canva for a mediocre result" / "24-48h waiting on a freelancer" / "$25-30 per thumbnail adds up fast"
- Section suivante : badge "⊘ WHAT IS IT ?" rouge + titre "Your personal AI Thumbnails Designer"
- 4 cartes fonctionnalités : icône rose rond + titre gras "Your face. Locked in." / "Paste a vibe. Get a..." / "Built for A/B testing." / "Days → Seconds."

## Style général observé (youthumb.ai/en)
- Fond clair (blanc/gris pâle), accents rouges vifs (#E11D48-ish)
- Badges ovales rouges avec petite icône et label en majuscules espacées
- Titres H2 courts percutants en noir gras, sous-titres gris
- Cartes blanches arrondies (rounded-2xl) avec ombres douces
- Vidéo démo : iframe YouTube dans frame d'app avec header "app.youthumb.ai", glow rouge, boutons minimize/unmute flottants
- Cartes produits tiltées (rotation -2/+2deg) avec ombres empilées (effet pile)
- Marquee de miniatures en défilement

## Scroll 3 (mock UI produit)
- Une grande fenêtre « mock » du produit (frame claire avec dots macOS + barre adresse "app.youthumb.ai/create") : panneaux latéraux Person (avatar "Mike" sélectionné) / Inspiration (image style "Tech Style") / Title, zone principale avec grande miniature générée + badge vert "Ready", rangée de 4 miniatures en dessous, mention "4 variations generated in 2.4 seconds", bouton rouge "Download"
- Cette fenêtre est une maquette CSS (pas une vidéo réelle) — glow rouge autour, très grande
- Le bouton "minimize/close video" flottant reste visible en haut du hero

## Décision d'implémentation Minia IA (landing refonte V17)
Le hero youthumb présente une démo produit animée (image mock de l'interface + badges animés). Pour Minia IA :
1. Créer une maquette CSS animée du dashboard Minia IA dans le hero (fenêtre browser, panels créateur + styles + rangée de miniatures, badge "Générées en 2,4 s") — palette bleu nuit/orange, glow orange
2. Animations : fade-in au chargement, badges pulsants, rangée de miniatures qui apparaissent en cascade (stagger), bouton minimize pour replier
3. Remplacer VideoTestimonialsSection (YouTube ids vides) par une section "Démonstration" avec la maquette animée complète
4. Garder VideoTestimonialsSection pour les vrais IDs YouTube si l'utilisateur en fournit plus tard
