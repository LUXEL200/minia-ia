# Audit initial — Minia IA

**Date :** 7 octobre 2026  
**Périmètre :** frontend React, routes tRPC/Express, helpers Drizzle/MySQL, schéma, génération Forge, stockage, administration, vidéo et responsive.  
**Statut :** audit effectué avant correction. Ce document décrit l’état initial constaté ; les corrections fonctionnelles viennent après validation de cette étape.

## 1. Synthèse exécutive

Minia IA dispose d’une base full-stack déjà avancée : authentification Manus OAuth, génération Forge, déduction atomique des crédits, filigrane gratuit, éditeur Canvas, versions, A/B testing, équipe, galerie, notifications, audit Super Admin, permissions secondaires, exports planifiés et démo invitée limitée.

Cependant, l’application n’est **pas encore conforme** au cahier des charges fourni. Les deux sujets les plus urgents sont :

1. **Confidentialité galerie/recherche :** la galerie publique et la recherche globale interrogent actuellement toutes les miniatures terminées, sans champ de publication administré. Cela peut exposer les images privées d’un client.
2. **Plans et quotas :** le serveur vérifie surtout le nombre de crédits disponibles et la quantité demandée, mais n’applique pas encore proprement les limites mensuelles, les styles autorisés, le nombre de générations parallèles, le HD/4K ou les droits Max.

Le calendrier de publication, le mode lot et les écrans associés sont toujours présents alors que le cahier des charges demande leur retrait complet.

## 2. Fonctionnalités confirmées dans le code

### Génération et crédits

- Génération authentifiée via `thumbnail.generate` avec six styles : `viral`, `mrbeast`, `minimalist`, `dramatic`, `tech`, `retro`.
- Quantité limitée techniquement de 1 à 4 par requête.
- Image d’inspiration acceptée par URL ou base64.
- Déduction de crédits avant appel IA et remboursement si la génération échoue.
- Journal immutable `creditLedger` pour débits, remboursements et recharges.
- Filigrane gratuit prévu côté serveur via `client.freeWatermark`.
- Animation de génération/téléchargement avec mascotte et états d’échec côté client.
- Démo invitée reliée à une vraie procédure `demo.generate`, avec quota anti-abus par adresse client et son désactivable.

### Espace client

- Liste privée `thumbnail.list` filtrée par `ctx.user.id`.
- Lecture d’une miniature par ID avec vérification d’ownership dans `thumbnail.get`.
- Suppression contrôlée par propriétaire.
- Recherche et filtres dans `thumbnail.listFiltered`.
- Favoris, partage, téléchargement, corbeille/restauration.
- Équipe, invitations et tâches de validation.
- Tests A/B avec partage par token et clôture statistique automatique prévue.
- Notifications et historique de crédits.

### Canvas

- Formats 16:9, vertical, carré et autres ratios.
- Texte, formes, images, déplacement, zoom, undo/redo, redimensionnement par poignées.
- Upload d’image, drag/drop, aperçu appareil et mode paysage mobile.
- Versions sauvegardées côté serveur pour les miniatures existantes.
- Brouillon local/autosave présent dans le code.
- Export image via `html-to-image`.

### Super Admin

- Accès propriétaire `isAdminOwner` pour les opérations sensibles.
- Gestion utilisateurs, rôles, plans, crédits, templates, modèles, témoignages et notifications.
- Centre Opérations, incidents, métriques historiques, timeline utilisateur et audit.
- Permissions secondaires `adminAccess` avec rôles support/analyste/opérateur.
- Exports planifiés `scheduledExports` et callback Heartbeat côté serveur.
- Paramètres client persistants `appSettings` : génération, batch, filigrane, quota démo, etc.

## 3. Problèmes critiques de confidentialité et sécurité

### P0 — Galerie publique non administrée et fuite potentielle de miniatures privées

**Constat :** `server/db.ts:getGalleryThumbnails` filtre uniquement `thumbnails.status = completed` et le style. Il n’existe pas de champ `isPublished`/`visibility`/`publishedByAdmin` dans `thumbnails` ou une table de publication dédiée.

**Conséquence :** toute miniature terminée peut être renvoyée par `gallery.thumbnails`, même si elle appartient à un client et n’a jamais été publiée par le Super Admin.

**Référence :** `server/db.ts:196-252`, `server/routers.ts:1367-1385`.

**Correction obligatoire :** créer une publication galerie explicitement administrée, par exemple `galleryItems` ou `thumbnails.galleryPublishedAt/galleryPublishedBy`, puis filtrer exclusivement ces entrées. Ajouter des mutations admin pour ajouter, modifier la catégorie, masquer et supprimer.

### P0 — Recherche globale exposant également des miniatures d’autres utilisateurs

**Constat :** `globalSearch` filtre bien l’historique, les favoris et la corbeille par utilisateur, mais sa sous-requête `gallery` sélectionne toutes les miniatures terminées sans publication admin ni propriétaire.

**Référence :** `server/db.ts:1276-1310`.

**Correction obligatoire :** la recherche client doit retourner uniquement les données du compte courant ; la recherche publique doit être une source séparée limitée aux éléments officiellement publiés.

### P1 — URLs d’images non signées / proxy d’accès à durcir

Les routes d’ownership protègent les opérations tRPC, mais les réponses renvoient des `imageUrl` S3/stockage directement. Si ces URLs sont accessibles sans signature ou sans proxy avec ACL, un lien copié peut rester utilisable hors session.

**Correction :** vérifier systématiquement le proxy de stockage en production et retourner des URLs courtes/signées, ou faire respecter l’ownership lors de chaque accès au fichier. Tester un lien d’un client A depuis une session B puis hors session.

### P1 — Callback de rappels publics

La procédure `reminders.fire` est publique et déclenche des notifications de planification. Même si elle est idempotente, un endpoint de tâche interne doit être authentifié par secret Heartbeat ou déplacé derrière le mécanisme de job serveur.

**Référence :** `server/routers.ts` dans le routeur `reminders`.

## 4. Plans, quotas et tarifs : matrice de conformité

| Règle demandée | État constaté | Niveau |
|---|---|---:|
| Gratuit : 5 miniatures | Initialisation `userCredits` à 10 visible dans `schema.ts`; pas de quota mensuel explicite constaté | P0 |
| Gratuit : 3 styles | Les six styles sont acceptés par `thumbnail.generate` pour tous les plans | P1 |
| Gratuit : 1 génération parallèle | Quantité 1 à 4, mais aucune limite de concurrence serveur par plan | P1 |
| Pro : 50 miniatures/mois | Le catalogue l’annonce, mais aucun compteur mensuel robuste n’est appliqué dans `generate` | P0 |
| Max : illimité | Le nombre de crédits reste le mécanisme principal ; aucune règle explicite d’illimité constatée | P1 |
| Batch réservé Max | Le serveur contrôle seulement `client.batchEnabled`, pas le plan Max | P0 |
| API réservé Max | L’accès API et les quotas API ne sont pas alignés explicitement sur le plan Max | P1 |
| Export HD/4K Pro/Max | L’éditeur exporte via `html-to-image`, mais aucune restriction de résolution par plan n’est imposée côté serveur | P1 |
| Remise à zéro mensuelle Pro | Aucun job ou timestamp de période mensuelle identifié | P0 |
| Quota affiché dans la sidebar | `AppSidebar` utilise `thumbnail.credits` avec `enabled: false`; le quota ne se charge donc pas par ce composant partagé | P1 |
| Upgrade quand quota atteint | Quelques erreurs de crédits existent, mais pas de garde-fou uniforme par plan avec CTA upgrade | P1 |

**Point important :** un crédit rechargeable ne doit pas être confondu avec le quota mensuel inclus dans le forfait. Il faut séparer `monthlyUsed/monthlyLimit` des crédits achetés, ou définir une politique explicite et l’appliquer partout.

## 5. Page Générer

### Conforme ou partiellement conforme

- Le dashboard conserve une seule zone principale de brief dans l’onglet texte.
- Texte, inspiration URL/upload, style et quantité existent.
- Le prompt est enrichi côté serveur par le style choisi.
- L’avatar est présent dans l’écosystème de l’application, mais son branchement au prompt de génération doit être vérifié dans le parcours complet.

### Non conforme

- `/generator` n’est pas un vrai générateur : pour un utilisateur connecté, il redirige seulement vers le dashboard ; pour un visiteur, il affiche une connexion requise.
- Le mode lot existe toujours dans le dashboard et dans `batch.generate`, alors que la demande exige son retrait de l’option « Texte et image inspirée » et son maintien uniquement comme module Max séparé.
- Le calendrier de publication est toujours présent : champs `youtubeStatus/youtubeTitle`, routes `planYoutube`, `unplanYoutube`, routeur `schedules`, `CalendarView`, rappels Heartbeat et étapes d’onboarding. Il doit être retiré partout selon le cahier des charges actuel.
- La quantité maximale est techniquement 4 pour tous les utilisateurs ; elle n’est pas encore calculée selon le plan.
- La validation serveur accepte les URLs d’inspiration mais ne garantit pas que la ressource référencée est autorisée ou non sensible.

## 6. Galerie et miniatures privées

### État actuel

- `Mes miniatures` est correctement filtré par l’utilisateur courant dans les routes listées.
- Les opérations `get`, `delete`, planification et listes filtrées vérifient l’ownership.
- En revanche, la galerie publique n’est pas alimentée par une publication admin : elle est alimentée implicitement par toutes les miniatures terminées.
- Les templates disposent d’un `userId` nullable, et certaines fonctions admin existent, mais cela ne remplace pas une modération/publication explicite de la galerie.

### Cible de correction

- Ajouter une table de contenu public gérée exclusivement par le propriétaire.
- Ne jamais publier automatiquement une génération client.
- Ne pas exposer le `userId`, le prompt sensible ou une URL privée dans une réponse publique.
- Tester les accès A/B avec deux comptes et avec une URL directe.

## 7. Avatars / Persons

### Présent

- Table `avatars` avec `userId`, statut, prompt, style et URL.
- Lecture DB filtrée par `userId` dans `getAvatarsByUserId`.

### Manquant ou incomplet par rapport au cahier des charges

- Le modèle actuel représente surtout une image/avatar généré ; il ne contient pas clairement un nom, une description, plusieurs photos ni une relation de réutilisation par génération.
- Aucun quota explicite Gratuit 1 / Pro 5 / Max illimité n’a été confirmé dans les routes auditées.
- L’upload, le type MIME, la taille maximale, le recadrage et la suppression doivent être vérifiés et uniformisés côté serveur.
- Le pipeline de génération doit prouver que le Person sélectionné est bien limité au propriétaire ou à son organisation Max.

## 8. Sidebar et navigation

### Présent

- `AppSidebar` est réutilisable, responsive, avec profil, comptes, thème, recherche globale, facturation, Canvas, modèles, équipe et outils.
- Le panneau s’ouvre depuis la gauche et le contenu glisse depuis la gauche ; cela ne correspond pas exactement à la demande « bouton à gauche, panneau à droite ».
- Plusieurs entrées sont des routes réelles, mais l’audit doit encore vérifier chaque page cible et les routes fallback.

### Problèmes UX constatés dans le code

- Le quota n’est pas réellement chargé par la sidebar partagée (`enabled: false`).
- Le composant mélange encore beaucoup de navigation et de logique de comptes dans un seul fichier d’environ 500 lignes.
- Le menu contient calendrier/planification alors que cette fonctionnalité doit disparaître.
- La cohérence visuelle entre les pages reste inégale : plusieurs écrans utilisent encore `bg-black`, `zinc`, cyan ou rose alors que la direction récente est bleu nuit + orange.
- Les pages client ne semblent pas toutes enveloppées par un layout unique garantissant le hamburger à gauche et le quota partout.

## 9. Canvas : état réel et limites honnêtes

### Fonctionnel ou partiellement fonctionnel

- Édition de texte, formes, images, sélection, déplacement, redimensionnement, zoom, undo/redo.
- Aperçu mobile/tablette/YouTube et mode paysage mobile.
- Versions côté serveur et brouillon local.
- Export image et import d’images.

### Non conforme au niveau « Canva/Photoshop complet »

Les éléments suivants ne sont pas confirmés dans l’implémentation inspectée :

- calques avec glisser-déposer d’ordre ;
- afficher/masquer, verrouiller, renommer, dupliquer et grouper des calques ;
- rotation complète et recadrage avancé ;
- grille/guides d’alignement et raccourcis clavier complets ;
- bibliothèque riche d’icônes, autocollants, emojis et assets ;
- 100+ polices Google Fonts et réglages avancés (interligne, tracking, contour, glow, courbure) ;
- suppression d’arrière-plan IA sur un calque ;
- luminosité, contraste, saturation, flou, netteté, teinte, filtres, modes de fusion et masques ;
- remplacement d’un sujet par un Person ;
- génération native en calques séparés ;
- OCR + inpainting + détourage automatique pour anciennes images aplaties ;
- retouche IA d’une sélection sans régénérer toute la miniature ;
- export JSON de calques et PSD ;
- limite de fonctionnalités Canvas par plan côté serveur ;
- compression garantie sous 2 Mo et export HD/4K contrôlé côté backend.

**Limite technique à annoncer honnêtement :** une miniature déjà aplatie ne peut pas être rendue parfaitement éditable sans pipeline OCR, segmentation et inpainting. Le résultat doit être présenté comme une reconstruction approximative et corrigible manuellement.

## 10. Vidéo et démo interactive

### Présent

- La landing référence une vidéo stockée dans le projet et une démo interactive.
- La démo interactive accepte un brief, trois styles, exécute une génération invitée réelle, affiche le quota restant et permet d’ouvrir le générateur.
- Le son est désactivable et mémorisé localement.

### Écart avec le scénario demandé

Le scénario demandé doit montrer : inscription, choix d’un avatar/Person, texte + image inspirée, génération de quatre variations, ouverture dans Canvas, modification texte/calques puis export. La démo interactive inspectée montre surtout un brief, un style et une variante invitée. Il faut donc produire une nouvelle séquence fidèle au parcours réel après correction, sans calendrier ni mode lot.

## 11. Administration

### Fonctionnel

- Un environnement Super Admin existe et les opérations sensibles sont protégées par `isAdminOwner`.
- Les permissions secondaires et les exports planifiés sont présents.
- Les contrôles runtime peuvent désactiver génération, batch, filigrane et démo.
- Les métriques, incidents, timeline et audit existent.

### À renforcer

- Ajouter la gestion admin explicite de la galerie publique ; ce n’est pas équivalent à la gestion des templates.
- Appliquer les permissions secondaires à chaque opération sensible, pas seulement à l’ouverture de certains onglets.
- Ajouter une matrice de permissions testée pour : utilisateurs, galerie, plans, paiements, styles, modèles IA, coûts, modération, logs et paramètres.
- Ne pas considérer le paiement simulé comme un système d’abonnement réel : upgrade/downgrade/annulation, webhooks, factures, prorata et statut Stripe restent à brancher.

## 12. Dette technique et sécurité

### Points positifs

- SHA-256 pour les nouvelles clés API et invalidation des anciennes clés prévue.
- Révocation de session serveur via `sessionRevokedAt`.
- Rate limiting déjà présent sur OAuth, tRPC et proxy de stockage.
- Déduction de crédits atomique et tests de régression.
- Validation Zod sur de nombreuses entrées.

### Points à traiter

- Ajouter une publication explicite pour toute donnée publique.
- Ajouter des tests d’isolation inter-utilisateurs pour chaque route image et chaque recherche.
- Éviter les `any` dans les composants admin et les réponses sensibles.
- Vérifier tous les uploads base64 : taille décodée réelle, MIME sniffing, dimensions, extension et nettoyage EXIF.
- Encadrer l’endpoint Heartbeat par authentification interne.
- Ajouter idempotency keys pour les appels de génération et les jobs d’export.
- Ajouter une vraie file de génération pour limiter la concurrence et éviter de lancer quatre appels séquentiels sans politique de plan.
- Ajouter suppression de compte/données et vérifier la conformité RGPD, CGU, confidentialité et consentement des emails.
- Ajouter modération de contenu avant génération et publication galerie.
- Corriger les métriques admin qui utilisent encore des agrégations ou placeholders à valider en production.

## 13. Plan de correction priorisé

### Phase A — sécurité et conformité minimale

1. Ajouter `galleryItems` ou des champs de publication admin.
2. Refaire `gallery.thumbnails`, `gallery.stats` et `globalSearch` sur la source publique publiée uniquement.
3. Ajouter tests client A/client B/hors session/URL directe.
4. Fermer et authentifier `reminders.fire` côté Heartbeat.
5. Vérifier le proxy de stockage et les URLs signées.

### Phase B — plans et génération

1. Définir une politique unique : quota mensuel inclus + crédits rechargeables.
2. Stocker période, usage, limite et remise à zéro atomique.
3. Appliquer styles, quantité parallèle, batch, API et export selon plan côté serveur.
4. Afficher quota et plan dans le layout partagé.
5. Ajouter messages d’upgrade homogènes.

### Phase C — nettoyage du parcours demandé

1. Retirer calendrier, schedules, rappels, champs YouTube, onboarding et code mort.
2. Retirer le mode lot du formulaire principal ; conserver un module Batch séparé et Max-only.
3. Faire de `/generator` un vrai point d’entrée ou rediriger explicitement vers le seul générateur sans écran contradictoire.
4. Uniformiser le layout hamburger gauche / panneau droit.

### Phase D — Persons et Canvas

1. Modèle Person multi-photos avec nom, description, quota et ownership.
2. Validation upload et recadrage serveur.
3. Calques avancés et limites plan.
4. Pipeline de génération en calques pour les nouvelles images.
5. Pipeline OCR/segmentation/inpainting séparé pour les anciennes images, avec avertissement de reconstruction.

### Phase E — démo et validation

1. Capturer le vrai flux corrigé.
2. Montrer 4 variations si le plan le permet.
3. Montrer Canvas, modification texte/calques et export.
4. Vérifier desktop, 320 px, 375 px, 390 px et paysage.
5. Sauvegarder un checkpoint après chaque phase.

## 14. Checklist de tests de sortie

- [ ] Client A ne voit aucune miniature de Client B dans `thumbnail.list`, `get`, `listFiltered`, favoris, recherche, corbeille et Canvas.
- [ ] Une URL directe d’image de Client B est refusée ou expirée pour Client A et hors session.
- [ ] Une génération client n’apparaît jamais dans la galerie publique sans publication admin.
- [ ] Un client ne peut ni créer, ni modifier, ni masquer, ni supprimer une entrée galerie publique.
- [ ] Gratuit est limité à 5 miniatures/période, 3 styles, 1 parallèle et Canvas de base.
- [ ] Pro est limité à 50/mois, 6 styles, 4 parallèles, HD et Canvas complet.
- [ ] Max autorise batch, équipe, API et styles futurs selon la politique définie.
- [ ] Le quota mensuel se remet à zéro une seule fois et de manière atomique.
- [ ] Un échec IA rembourse exactement le crédit réservé et laisse une trace.
- [ ] Les boutons d’upgrade apparaissent au franchissement de chaque limite.
- [ ] Le calendrier et le mode lot ne sont plus visibles ni appelables après leur retrait.
- [ ] Le bouton hamburger est à gauche et le panneau s’ouvre à droite sur mobile/desktop.
- [ ] Les uploads Person sont privés, validés, recadrables et supprimables.
- [ ] Le Super Admin reste le seul acteur de publication galerie.
- [ ] Les rôles secondaires ne peuvent exécuter que leurs permissions.
- [ ] Les tests Vitest, TypeScript, build et captures responsive passent.

## Conclusion

La fondation technique est exploitable, mais il serait prématuré de déclarer le SaaS conforme ou sûr pour des clients avant de corriger la publication galerie/recherche et les règles de plans. La suite recommandée est de commencer par la **Phase A**, puis de valider la matrice des quotas avant de refaire l’interface Générer et de retirer définitivement le calendrier.
