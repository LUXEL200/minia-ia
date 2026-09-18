# Audit défensif de sécurité — Minia IA

## Conclusion

L’audit a identifié et corrigé plusieurs défauts qui pouvaient permettre un accès indu à des actifs, une dépense concurrente de crédits ou une modification de tâches appartenant à une autre équipe. Les protections sont maintenant appliquées côté serveur, et non seulement dans l’interface cliente.

Le point le plus important concerne le stockage. Le proxy refuse désormais les chemins non conformes, bloque les traversées de répertoire et limite les fichiers privés aux propriétaires authentifiés. Les préfixes `generated/` et `templates/` restent publics afin de préserver la galerie et les modèles publics. Les préfixes `user-images/{userId}/` et `thumbnails/{userId}/` exigent une session correspondant à l’identifiant du chemin.

## Correctifs appliqués

### Autorisation objet par objet

La création d’une tâche d’équipe vérifie maintenant que la miniature appartient à l’utilisateur courant. La mise à jour d’une tâche filtre simultanément sur son identifiant et sur le propriétaire de l’équipe. Une tâche inconnue ou étrangère produit une erreur `NOT_FOUND` et ne déclenche aucune notification.

L’acceptation d’une invitation compare désormais l’adresse e-mail de l’utilisateur authentifié à l’adresse de l’invitation. Le refus applique la même vérification et ne modifie qu’une invitation encore en attente. Ces contrôles empêchent l’utilisation d’un identifiant d’invitation obtenu par enumeration.

### Intégrité des crédits

`deductCredits` utilise maintenant une instruction SQL conditionnelle de la forme `credits = credits - amount` avec la condition `credits >= amount`. La lecture préalable du solde n’est plus utilisée pour décider de l’écriture. Deux requêtes concurrentes ne peuvent donc pas dépenser le même solde.

Les flux de génération réservent les crédits avant l’appel au fournisseur d’images. Lorsqu’une génération échoue, le crédit réservé est remboursé par une écriture atomique. Cette stratégie est appliquée aux miniatures unitaires, aux lots, aux avatars et aux cartes YouTube.

### Clés API

Les nouvelles clés API sont générées avec une source aléatoire cryptographique et stockées sous forme d’empreinte SHA-256. La valeur secrète n’est renvoyée qu’une seule fois lors de la création. Les listes ultérieures renvoient uniquement un masque. Les anciennes lignes qui contiennent éventuellement une valeur en clair doivent être régénérées ou migrées avant la mise en production.

### Proxy de stockage

Le proxy valide la clé, interdit `..`, les séparateurs inverses et les caractères hors liste blanche, puis applique une politique de préfixes. Les erreurs d’autorisation sont volontairement présentées comme `404` afin de ne pas révéler l’existence d’un objet privé. Les réponses privées utilisent `Cache-Control: private, no-store`.

## Validation

La compilation TypeScript et le build de production passent après les changements. Les tests existants couvrent 89 cas sur 90 lors de la dernière exécution. Le cas restant concerne le test temporel de rappel J-1, qui dépend d’une fenêtre de dates et échoue de manière intermittente sans rapport avec les changements de sécurité. Il doit être stabilisé en injectant une horloge contrôlée avant de considérer la suite entièrement verte.

## Risques résiduels et recommandations

Le modèle de génération d’images repose encore sur des URLs publiques pour les objets `generated/`. Cette décision conserve la galerie publique, mais elle ne doit pas être utilisée pour des contenus confidentiels. Si la confidentialité des images générées devient contractuelle, il faudra ajouter un statut de publication et générer des URLs signées à durée limitée pour chaque consultation autorisée.

Les achats de crédits sont actuellement simulés. Aucune validation de paiement réelle ne doit être branchée sur le parcours existant sans ajouter une vérification serveur du fournisseur, une idempotence par identifiant d’événement et une journalisation antifraude. La modification administrative des crédits doit rester limitée à l’identité propriétaire vérifiée.

Les clés API déjà stockées en clair constituent un risque historique. Une migration doit calculer leur empreinte côté serveur, invalider les anciennes valeurs après notification à l’utilisateur et vérifier qu’aucun journal ne contient la valeur secrète.

Enfin, il est recommandé d’ajouter une limitation de débit par utilisateur et par adresse IP sur l’authentification, la génération et le proxy. Cette mesure réduira les abus de quota et les attaques par déni de service, mais elle dépend de l’infrastructure d’exécution et n’a pas été activée dans ce correctif.

## Références

[1]: https://owasp.org/www-project-top-ten/ "OWASP Top 10 Web Application Security Risks"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html "OWASP Authorization Cheat Sheet"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html "OWASP Password Storage Cheat Sheet"
