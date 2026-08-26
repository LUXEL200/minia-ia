# Observations — Easy Visuel

**Source analysée le 26 août 2026 :** https://easy-visuel.vercel.app/

## Direction visuelle

Le site utilise une esthétique éditoriale sombre et premium, construite autour d'un fond presque noir, d'une grille fine visible en arrière-plan, d'un accent vert acide et de textes blancs. Le logo est compact dans une capsule arrondie. Les textes de navigation sont courts, espacés et placés dans un header sticky très léger, avec un CTA principal en capsule lumineuse.

La typographie oppose un grotesk net pour l'interface et les textes courants à une typographie serif/italique expressive utilisée ponctuellement dans les grands titres. Les titres sont larges, centrés et respirent beaucoup. Les sections emploient des libellés en capitales avec tracking augmenté, de grands espaces verticaux et des cartes à bordure fine.

## Structure observée

La landing page suit une progression éditoriale claire : navigation, hero avec promesse et CTA, bandeau de preuves chiffrées, galerie d'aperçus en mosaïque/marquee, catégories d'utilisation, comparaison avant/après, offre principale, liste de profils cibles, récit du créateur, témoignages en carousel, FAQ accordéon, dernier CTA, moyens de paiement et footer.

## Animations et interactions

Les images d'aperçu défilent en lignes horizontales continues et créent un mur visuel très dense. Les sections apparaissent progressivement au scroll. Les boutons ont une forme capsule, un contraste fort et un état hover lumineux. Le carousel de témoignages possède des contrôles précédent/suivant. La FAQ s'ouvre nativement en accordéon. Un bouton WhatsApp flottant reste ancré en bas à droite.

## Adaptation prévue pour Minia IA

Le langage visuel sera adapté à la génération de miniatures YouTube : conserver le fond sombre, la grille, la structure éditoriale, les titres expressifs, les capsules et les galeries en défilement, mais remplacer le vert par la palette existante bleu nuit + orange léger. Le hero mettra en scène le prompt, les variantes générées et le Canvas. Les preuves seront reformulées autour des générations, du temps gagné et des exports, sans inventer d'avis clients, de notes ou de témoignages.

Les sections recommandées pour Minia IA sont : hero « une idée, quatre miniatures », galerie animée de miniatures, workflow en trois étapes (décrire, générer, éditer), comparaison avant/après, aperçu de l'éditeur Canvas, fonctionnalités, tarifs existants, FAQ, CTA final et footer. Les interactions doivent rester compatibles avec l'authentification et les routes actuelles du projet.

## Vérification de la refonte

La landing Minia IA adopte maintenant un hero centré avec grille éditoriale, badge capsule, titre grotesk + italique orange, CTA arrondi, mockup de génération et galerie horizontale animée. Les sections workflow, gain de temps, fonctionnalités, CTA et FAQ suivent le rythme éditorial de la référence tout en restant orientées miniatures YouTube. Le header mobile affiche désormais un bouton menu accessible, et la capture à 390 px ne présente pas de débordement visible. La capture desktop conserve une composition dense mais lisible, avec la galerie et le mockup qui prolongent naturellement le hero.

## Vérification vidéo hero — 26/08/2026

La vidéo de démonstration est intégrée dans le cadre produit du hero avec poster, lecture automatique silencieuse, boucle, lecture inline et contrôles natifs accessibles. Sur desktop, elle reste contenue dans la carte éditoriale sans modifier la hiérarchie du titre ni des CTA. Sur mobile étroit, le ratio 16:9 est conservé, le bouton d’action passe sous la vidéo et aucun débordement horizontal n’a été observé. Le fallback textuel est inclus dans l’élément vidéo. Asset hébergé via `/manus-storage/minia-ia-hero-demo_8c30cba8.mp4` et poster `/manus-storage/minia-ia-hero-demo-poster_00549801.jpg`.
