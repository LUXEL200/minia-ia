# V12 — Packs de crédits rechargeables (factice, prêt pour Stripe)

## Demande utilisateur (15/08)
1. Système de crédits rechargeables factice — interface d'achat de packs (préparé pour Stripe plus tard).
2. Expliquer comment utiliser le calendrier de planification.

## État d'avancement (mis à jour)
- [x] Backend complet : table creditPackPurchases + helpers db.ts (listCreditPackPurchases, createCreditPackPurchase) + router packs (catalog/public, purchases, purchase simulé avec notification credit) dans appRouter.
- [x] Catalogue : starter 10cr/4,90€ ; creator 50cr/19,90€ (popular) ; pro 200cr/69,90€ ; max 500cr/149,90€.
- [x] Frontend Billing.tsx réécrite : section « Recharger des crédits » (4 cartes + bouton Acheter), dialog paiement simulé (Payer en simulation → toast succès + historique + solde mis à jour), historique des achats (état vide + tableau avec badge Payé, format fr-FR).
- [x] Screenshot /billing OK en light : sections lisibles, cartes, dialog OK.
- [x] Tests vitest 64/64 (server/features.v12.test.ts, 5 tests packs).
- [x] tsc 0 erreur.
- Reste : marquer todo.md v12 [x], checkpoint, message final avec guide calendrier.

## État antérieur
- [x] Table `creditPackPurchases` ajoutée au schéma (drizzle/schema.ts) + migration 0010 générée + appliquée en BDD (CREATE TABLE + index cpp_user_idx).
- [ ] Ajouter les exports dans server/db.ts : import de `creditPackPurchases, InsertCreditPackPurchase, desc` (attention : desc déjà importé en ligne 1) ; helpers listCreditPackPurchases / createCreditPackPurchase (à ajouter après updateUserPlan).
- [ ] Ajouter le router `packs` dans server/routers.ts : `packs.list` (protected, retourne les packs disponibles hardcodés + historique), `packs.purchase` (protected, input { packId }, simule paiement → creditPackPurchases.insert + updateUserCredits(existing.credits + pack.credits) + notification in-app) ; packs.catalog hardcodé :
  - starter : 10 crédits → 4,90 € (490 cents)
  - creator : 50 crédits → 19,90 €
  - pro : 200 crédits → 69,90 €
  - max : 500 crédits → 149,90 €
- [ ] Frontend Billing.tsx : section « Recharger des crédits » avec cartes de packs + dialog de paiement simulé (carte factice, bouton « Payer en simulation ») + historique d'achats (pack.purchases) + invalidate userCredits.
- [ ] Tests vitest (server/features.v12.test.ts ou existant) ; tsc ; screenshots /billing en light + dark ; checkpoint ; message final avec guide calendrier.

## Guide calendrier (à livrer dans le message final)
Le calendrier se trouve sur le Dashboard (vue « Calendrier », bascule mois/semaine) :
1. Planifier : sur une miniature (Dashboard ou /miniatures) → bouton calendrier « Planifier » → choisir date/heure + titre YouTube → badge « Planifié » sur la carte.
2. Le plan apparaît dans le calendrier : point rouge sur la date ; vue mois ou semaine (bouton bascule), flèches pour changer de mois.
3. Modifier : clic sur l'événement dans le calendrier → dialog « Planifier » pour changer l'heure/titre directement.
4. Annuler : dropdown « ⋯ » sur la carte planifiée → « Annuler le plan ».
5. Rappels : notification J-1 avec badge dans la cloche Notifications + compte à rebours dans le panneau « Planifiées » du Dashboard.

## Points techniques
- userCredits : ensureUserCredits / getUserCredits / updateUserCredits (userId, credits) dans server/db.ts.
- ensureUserCredits retourne { credits, planType } ; credits par défaut 10.
- notifications.insertNotification existe (à vérifier nom exact) — chercher insertNotification dans db.ts.
- Page Billing actuelle : /billing (Billing.tsx), PageHeader + onglet Plan actuel (Gratuit/Pro 19€/Max 49€ simulés) + cartes des 3 plans.
- tsc 0 erreur ; tests vitest 59/59 (avant v12).
