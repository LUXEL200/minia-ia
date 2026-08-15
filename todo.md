# Project TODO

- [x] Analyse du site source YouThumb.ai
- [x] Recherche CRO/UX
- [x] Design system Neon Noir défini
- [x] Composants landing page (16 sections)
- [x] Animations scroll + hover effects
- [x] Authentification + Dashboard utilisateur
- [x] Intégration API Forge pour génération réelle de miniatures
- [x] Page témoignages vidéo avec embeds YouTube/TikTok
- [x] Correction crédit deduction only on success + ownership verification
- [x] Remplacement vidéos placeholder par section conditionnelle (auto-hide si pas de vrais embeds)
- [x] Préparation pour téléchargement + test local (README_LOCAL_SETUP.md)
- [x] Skill réutilisable saas-replica créé et validé
- [x] Page galerie publique /gallery avec filtrage par style
- [x] Backend gallery endpoints (public, anonymisé)
- [x] Preview galerie sur homepage avec CTA vers galerie complète
- [x] Lien Galerie ajouté dans Navbar et Footer
- [x] Pages Produit (/features, /pricing, /templates, /generator, /faq, /docs)
- [x] Pages Ressources (/blog, /models, /best-practices, /examples, /comparisons, /for-creators)
- [x] Pages Légal (/terms, /privacy, /contact, /cgv)
- [x] Liens footer/nav mis à jour pour pointer vers les vraies pages
- [x] Système de likes sur la galerie avec tri par popularité
- [x] Batch Upload — génération en lot (jusqu'à 100 descriptions)
- [x] Interface équipe (membres, tâches, validation/refus/cancellation)
- [x] Notifications email via notifyOwner pour événements clés
- [x] Navbar refactorisée (suppression liens dupliqués, layout propre)

- [x] OAuth callback tolérant aux cookies bloqués (preview/iframe/Safari ITP)
- [x] Redirection vers /dashboard après connexion réussie
- [x] Stockage du chemin de retour dans sessionStorage pour auto-login
- [x] Test unitaire mis à jour pour sameSite=lax

- [x] Bouton CTA HeroSection fonctionnel (login/dashboard selon auth state)
- [x] Bouton "Voir des exemples" → /gallery
- [x] Tables base de données créées (users, thumbnails, userCredits, thumbnailLikes, teamMembers, teamTasks)

- [x] Bouton CTA HeroSection fonctionnel (login/dashboard selon auth state)
- [x] Bouton "Voir des exemples" → /gallery
- [x] Tables base de données créées (users, thumbnails, userCredits, thumbnailLikes, teamMembers, teamTasks)
- [x] Dashboard redesign — style Youthumb.ai : fond noir épuré, header breadcrumb + crédits, 4 cartes stats (Miniatures, Générations, Avatars, Crédits)
- [x] Dashboard redesign — section "Générations récentes" avec miniatures en grille + "Afficher tout"
- [x] Dashboard redesign — section "Modèles" avec templates en grille
- [x] Dashboard redesign — navigation flottante (Accueil/Générer/Équipe) en bas d'écran
- [x] Dashboard redesign — navigation flottante (Accueil/Générer/Équipe) en bas d'écran
- [x] Menu hamburger latéral avec tous les sous-menus (org info, créer miniature, plateforme/compte, YouThumb: Tableau de bord/Miniatures/Personnes/Modèles, Outils: Avatars/Aperçu/Générateur cartes YouTube/Favoris/Poubelle, upgrade Pro, profil utilisateur)
- [x] Sidebar hamburger avec org info + CTA créer miniature + sections Minia IA et Outils + upgrade Pro + profil
- [x] Menu déroulant sous profil connecté (Pro, Mode clair, Compte, Clés API, Paramètres, Facturation, Notifications, Déconnexion)
- [x] Page Avatars (génération d'avatars/mini profil)
- [x] Page Aperçu miniature (prévisualisation dans contexte YouTube)
- [x] Page Générateur de cartes YouTube (end cards)
- [x] Page Favoris (filtrage des miniatures favorisées)
- [x] Page Poubelle (soft delete + restauration 30 jours)
- [x] Page Compte (édition profil)
- [x] Page Clés API
- [x] Page Paramètres
- [x] Page Facturation
- [x] Page Notifications (avec badge et marquage lu)
- [x] Système Templates (admin + utilisateurs peuvent ajouter des miniatures d'inspiration)
- [x] Éditeur Canva après génération (édition manuelle de l'image)
- [x] Onglet "Image inspirée" dans Génération (upload image ou lien Pinterest comme référence)
- [x] Mode clair (toggle dark/light)
- [x] Bouton Pro reste un lien /pricing

 - [x] Backend admin router — stats, users management, credits management, global notifications
 - [x] Page Super Admin — dashboard avec stats globales
 - [x] Page Super Admin — gestion utilisateurs (rôles, crédits, blocage)
 - [x] Page Super Admin — gestion templates (ajout/suppression admin)
 - [x] Page Super Admin — configuration API (modèles, clés)
 - [x] Page Super Admin — gestion plans/tarifs
 - [x] Page Super Admin — notifications globales
 - [x] Lien admin dans le sidebar (visible uniquement pour les admins)

- [x] Composant PageHeader partagé (titre + breadcrumb + retour)
- [x] Rendre Templates responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Avatars responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre EndCards responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Favorites responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Trash responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Notifications responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Account responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre ApiKeys responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Settings responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Billing responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre ThumbnailPreview responsive (desktop/tablet/mobile) — PageHeader partagé appliqué
- [x] Rendre Admin responsive (desktop/tablet/mobile) — PageHeader partagé appliqué

- [x] Seed templates — 16 templates pré-remplis vérifiés dans la BDD (viral, minimaliste, dramatic, tech, retro, MrBeast)
- [x] Galerie — bouton "Modifier" sur chaque miniature qui ouvre l'éditeur Canva (image en fond du canevas via paramètre URL)
- [x] Éditeur — export SVG incluant l'image de fond avec calque textuel par-dessus

- [x] Rendre Admin réellement responsive : sidebar latérale sur desktop/tablette, barre d'onglets fixe en bas sur mobile (6 onglets admin)
- [x] Éditeur — export PNG production-grade 1280×720 via html-to-image avec repli SVG

## Nouvelles fonctionnalités (v2)

- [x] Table `templateCustomizations` — personnalisation utilisateur d'un template (texte, couleurs, emojis, éléments)
- [x] Table `imageVersions` — historique des versions d'une miniature éditée (snapshot des éléments + image de fond)
- [x] Table `abTests` — tests A/B (2 variantes d'une miniature) avec vues/clics et CTR calculé côté serveur
- [x] Backend tRPC : customizations CRUD (routers customizations/imageVersions/abTests), versions save/restore/delete, AB test CRUD + updateStats + ownership checks
- [x] Page "Éditeur de template" (/template-editor) — personnaliser un template de la bibliothèque (texte, emojis, formes, fond), enregistrer et exporter PNG
- [x] Éditeur : bouton "Historique" — sauvegarder/restaurer/supprimer les versions d'une miniature
- [x] Page A/B Test (/ab-test) — créer un test (2 variantes sélectionnées dans la grille), saisir les vues/clics, CTR calculé, déclarer gagnante/match nul, lien dans le menu hamburger
- [x] Tests vitest pour les nouvelles procédures (server/features.v2.test.ts, 8 tests)
- [x] Vérification desktop des nouvelles pages (Templates, Éditeur de template, A/B Test)

## Corrections utilisateur (v3)

- [x] Espace Canva visible : lien "Espace Canva" dans la sidebar hamburger du dashboard + état vide clair "Importer une image" dans /editor
- [x] Onglet inspiration : upload d'image depuis l'appareil (b64) en plus du lien — backend thumbnail.generate accepte inspirationImageUrl et inspirationB64/inspirationMime via originalImages
- [x] Menu hamburger présent partout : composant AppSidebar partagé (sidebar complète + dropdown profil) intégré dans PageHeader et Navbar, lien Canva + A/B ajoutés à la sidebar

- [x] Ajouter le hamburger/AppSidebar aux pages qui n'utilisent pas PageHeader : Editor, TemplateEditor, Admin (Models/Gallery/Home utilisent Navbar déjà pourvu du hamburger)
- [x] Vérifier en session connectée que le menu hamburger (tous les sous-menus) est accessible depuis chaque page — captures desktop validées (Editor, TemplateEditor, Admin, Gallery, Home)

## Vague v4 (nouvelles demandes utilisateur)

- [x] Hamburger fixe en haut à droite sur toutes les pages (y compris sous-pages/paramètres), retirer les doublons dans les résultats — FloatingMenu.tsx (top-right, se rétracte après 3s), retiré de Navbar/Dashboard/PageHeader/pages
- [x] Éditeur : aperçu mobile/tablette (visualisation comme dans les suggestions YouTube) — boutons Smartphone/Tablet + Dialog de prévisualisation à l'échelle (360×202 / 900×506)
- [x] Espace Canva : encadrement dimensionné correct (canvas 1280×720) pour les images uploadées — outils de retouche (taille, position, rotation, opacité, calques) — « Insérer comme calque » (mesure et centre l'image), bouton Contienir/Couvrir, sliders largeur/hauteur/opacité/arrondi, fond cover/contain
- [x] Miniatures : boutons favoris, supprimer, partager, valider (approuver), modifier — overlays hover dans Dashboard (récentes + toutes générations), handleShare (navigator.share ou presse-papiers)
- [x] Filigrane Minia IA sur les générations du plan gratuit — applyWatermark gravé à l'export PNG (badge « Filigrane » affiché pour le plan gratuit)
- [x] Éditeur de templates : bouton "Ajouter à mes miniatures" (export direct vers le dashboard) — saveFromBase64 via storagePut
- [x] A/B Test : clôture automatique — déclarer gagnant quand l'écart de CTR est statistiquement significatif — test z deux proportions (|z| ≥ 1,96), flag autoClosed en BDD + badge « Clôturé automatiquement » + message de significativité

## Vague v5 (demande utilisateur — 15/08)

- [x] Backend : recherche + filtres (date, style, mots-clés) sur l'historique des miniatures (thumbnail.listFiltered, tRPC + SQL)
- [x] Backend : mutations de publication YouTube (thumbnail.planYoutube / unplanYoutube) — statut planned + youtubeTitle (colonne youtubeStatus ENUM)
- [x] Backend : partage public de test A/B — abTests.share (token 32 chars) + abTests.getByShareToken (publicProcedure, lecture seule, anonymisé)
- [x] Frontend : barre de recherche + filtres dans la vue « Afficher tout » du Dashboard (texte, style, période, état YouTube)
- [x] Frontend : bouton « Planifier » sur les cartes (icône calendrier) — Dialog « Planifier pour YouTube Studio » avec titre, copier l'image, annuler le plan
- [x] Frontend : badge « Planifié » (CalendarClock cyan) top-left des cartes planifiées
- [x] Frontend : page /share-ab/:token lecture seule (variantes côte à côte, CTR, vues, clics, badges gagnant/clôture auto, copier les miniatures) + dropdown « Partager » dans la page AbTest (générer/copier/désactiver le lien)
- [x] Tests vitest pour les nouvelles procédures (20/20 passent)
- [x] Vérification screenshots (dashboard, /share-ab valide/invalide) + checkpoint final

## Vague v6 (demande utilisateur — 15/08)

- [x] Corriger le doublon « Créer une miniature / Miniatures / Personnes » dans le menu flottant (AppSidebar : 3 liens distincts vers /dashboard, /dashboard#miniatures, /dashboard#equipe + deep-linking hash dans Dashboard.tsx)
- [x] Bouton « Compte » : popup multi-comptes (AccountsDialog, store localStorage minia-accounts, basculer via « Utiliser », créer via OAuth, bouton Plate-forme + item profil)
- [x] Corriger le basculeur mode sombre/clair (thème clair complet dans index.css + override global .light sur éléments hardcodés + classe sur <html>, libellé/icône dynamiques, état persisté localStorage)
- [x] Mettre à jour la skill saas-replica (nouvelle phase 6 « Fonctionnalités avancées » + référence advanced-features.md : menu global unique, thèmes, multi-comptes, éditeur, A/B, filigrane, export YouTube ; validation passée)
- [x] Tests + vérifications (tsc OK, 20/20 vitest, mode clair testé au navigateur, dialog comptes vérifié)

## Vague v7 (captures d'écran utilisateur — organisations & équipes)

- [x] Cartes miniature : boutons rapides style Youthumb (éditer, aperçu avec dialog, télécharger, favori en étoile orange, partager, valider, supprimer)
- [x] Backend : tables organizations et teamInvitations (migration 0006 appliquée)
- [x] Backend : apiKeys enrichi (expiresAt ajouté en BDD)
- [x] Backend : procédures tRPC — org.me/usage/update/members/invite/sentInvitations/receivedInvitations/acceptInvitation/declineInvitation/cancelInvitation/removeMember (orgRouter enregistré dans appRouter)
- [x] Frontend : page /organisation « Modifier l'organisation » (logo upload via saveFromBase64, nom, limace, description, Économiser)
- [x] Frontend : panneau Usage (crédits/personnes/modèles, barres, badge plan)
- [x] Frontend : membres de l'équipe avec rôles + actions (retirer)
- [x] Frontend : informations détaillées (identifiant unique, identifiant organisation, dernière mise à jour) + bouton « Quitter l'organisation »
- [x] Frontend : page /invitations (invitations reçues / envoyées + formulaire Inviter par e-mail)
- [x] Frontend : page Clés API (bouton créer plein rouge, tableau Nom/Créé/Expire/Actes, état vide fidèle Youthumb)
- [x] Tests vitest (20/20) + vérifications responsive (collision header mobile corrigée via hidden sm:flex)

## Vague v8 (demande utilisateur — 15/08)

- [x] Backend : stats collaboratives A/B — table abTestContributions (membre/organisation, vues, clics, note) sans modifier les variantes ; agrégation côté serveur
- [x] Backend : recherche globale multi-pages (historique, favoris, galerie publique, poubelle) — procédure tRPC search.global
- [x] Frontend : interface « Miniatures » distincte du Dashboard (page /miniatures dédiée : grille complète, filtres, stats de sa bibliothèque)
- [x] Frontend : interface « Personnes » distincte (page /personnes dédiée : membres, invitations reçues/envoyées, rôle, statuts)
- [x] Frontend : Dashboard reste le hub central (stats, récentes, modèles, planifiées) — liens distincts Tableau de bord / Miniatures / Personnes dans la sidebar
- [x] Frontend : notifications de planification sur le Dashboard — panneau rappels avec compte à rebours jusqu'à la publication (badge countdown)
- [x] Frontend : panel « Stats collaboratives » dans la page A/B Test (membres ajoutent vues/clics, agrégat affiché)
- [x] Frontend : champ de recherche globale accessible depuis le menu hamburger (dialog recherche multi-pages)
- [x] Tests vitest (36/36) + tsc + vérifications responsive + checkpoint

## Vague v9 (demande utilisateur — 15/08)

- [x] Audit : repérer les éléments hardcodés en mode sombre (bg-black, bg-[#0C0C0E], text-zinc-*, bg-white/5…) dans toutes les pages/composants
- [x] Mode clair complet : remplacer les hardcodés par des tokens CSS (bg-background, bg-card, text-foreground, border) + overrides .light cohérents
- [x] Polices harmonisées : une seule famille pour titres/corps/chiens/boutons dans les deux thèmes (index.css global)
- [x] Rappels de planification : notification in-app (J-1) pour les miniatures planifiées qui approchent (cron quotidien ou à la connexion)
- [x] Vue « Calendrier » : grille mensuelle des publications planifiées dans le Dashboard
- [x] Tests vitest + tsc + vérifications mode clair/sombre + responsive + checkpoint

## Vague v10 (demande utilisateur — 15/08)

- [x] Audit : repérer les éléments sombres restants en mode clair (bouton hamburger rond noir, badges, dropdowns, hero landing mobile)
- [x] Corriger les hardcodés dark restants via overrides .light / tokens
- [x] Calendrier interactif : clic sur un événement → dialog « Planifier » pour modifier heure/titre
- [x] Vue semaine dans le calendrier : bascule mois/semaine
- [x] Badge J-1 dans la cloche Notifications + lien direct vers la miniature
- [x] Tests vitest + tsc + vérifications mode clair + responsive + checkpoint

## Vague v11 (demande utilisateur — 15/08)
- [x] Audit : repérer les titres/headers textes sombres (text-gray-*, text-zinc-*, text-black, text-[#0…]) sur conteneurs hardcodés sombres
- [x] Corriger : overrides .light — header sticky bg-[#000]/80-90 → var(--secondary) ; text-black (#111 fixe) ; bg-white → var(--card) ; fractions bg-zinc-900/60, bg-black/35 ; hover:text-white/zinc-300/400 ; bloc membre /organisation lisible
- [x] Vérifications visuelles mode clair sur 16 pages (dashboard, miniatures, personnes, organisation, gallery, ab-test, notifications, settings, account, templates, avatars, endcards, billing, api-keys, admin, editor) + 59/59 vitest + tsc 0 erreur + checkpoint

## Vague v12 (demande utilisateur — 15/08)

- [x] Backend : table `creditPackPurchases` (packs achetés, montant, statut) + procédures tRPC packs.list / packs.purchase (paiement factice → crédits ajoutés) avec ownership
- [x] Backend : historique d'achats (packs.purchases) + débit fictif (optionnel : simuler paiement Stripe, structuré pour basculer)
- [x] Frontend : section « Recharger » dans /billing — packs (10/50/200/500 crédits) avec prix, dialog de paiement simulé, historique d'achats
- [x] Frontend : solde crédité immédiatement après achat (utils.thumbnail.credits.invalidate)
- [x] Guide d'utilisation du calendrier de planification (message utilisateur clair)
- [x] Tests vitest (64/64 dont 5 tests packs) + tsc 0 erreur + vérifications visuelles + checkpoint

## Vague v13 (demande utilisateur — 15/08)

- [x] Audit : comportement des notifications (cloche, badge, marquage lu, rappels J-1, toasts)
- [x] Audit : actions validation/approbation (toggle statut, feedback visuel)
- [x] Audit : actions suppression (poubelle, toast, invalidation cache, état vide)
- [x] Audit : chargement des pages (skeletons, états vides, rechargement cache)
- [x] Corrections : helper toastRich (icône+titre+description+undo), cloche dropdown (Tout marquer lu, dates relatives, lien direct), Notifications.tsx (clic=marqué lu, pulsation badge), Dashboard/Miniatures/Trash (toasts enrichis, undo suppression→Poubelle, planifications avec invalidation calendrier+notifications), 72/72 vitest (dont 8 v13) + tsc 0 erreur + vérifs light/dark + checkpoint
