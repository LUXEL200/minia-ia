# Analyse des tutoriels Canvas — Minia IA

Sources analysées le 9 novembre 2026 :
- https://www.youtube.com/watch?v=qUkBnowX-C8
- https://www.youtube.com/watch?v=IgnPIAfzxqY
- https://www.youtube.com/watch?v=kKKHqD-CJf8
- https://www.youtube.com/watch?v=zM1oM03m_PU

## Convergences utiles

Les quatre tutoriels montrent un éditeur de type Canva/Photopea avec une barre contextuelle qui change selon l’objet sélectionné. Pour un texte, elle expose police, taille, couleur, graisse, italique, alignement, interlettrage et interligne. Pour une image, elle expose recadrage, retournement, filtres et réglages de luminosité, contraste et saturation. Pour une forme, elle expose remplissage, contour et opacité.

Les interactions prioritaires sont le double-clic pour modifier le texte directement, les poignées d’angle pour redimensionner en gardant les proportions, une poignée de rotation, le glisser-déposer d’images, l’alignement magnétique au centre, et le panneau de calques permettant d’afficher/masquer, verrouiller, réordonner, dupliquer et supprimer.

Le workflow final attendu est : choisir un format, importer ou ajouter des éléments, les positionner sur la toile, ajuster le texte ou l’image dans la barre contextuelle, vérifier la lisibilité à faible zoom, puis exporter en PNG ou JPG. Les tutoriels insistent sur le détourage, les effets de texte, la saturation et l’export adapté à YouTube.

## Décisions d’implémentation

Le lot Canvas reste sans SDK payant. Les calques restent des objets JSON modifiables et sont sauvegardés localement et côté serveur. Le moteur DOM actuel est conservé pour éviter une régression de compatibilité avec les brouillons et les versions. Cette étape ajoute les interactions manquantes de priorité P1 : barre contextuelle, calques repliables avec verrouillage/visibilité, rotation, alignement magnétique, double-clic texte, réglages d’image et export JPG.
