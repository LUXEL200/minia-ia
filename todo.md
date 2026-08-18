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

## Vague v14 (refonte UI complète — demande utilisateur — 15/08)

- [x] Audit design actuel : landing page (Home, HeroSection, sections), dashboard, composants partagés
- [x] Consulter références : Elementor web-design-inspiration, Pinterest board, Dribbble notifications, 21st.dev (+ tendances SaaS UI 2026)
- [x] Nouveau design system v2 « Cinematic Studio » : police Sora (display), palette cyan→violet, tokens index.css light/dark, classes glass/grid-dots/lift/glow/pill/badge-pulse/gradient-text
- [x] Landing page : hero retravaillé (grid-dots, badge pill, typo gradient), sections lift-card glass, micro-animations
- [x] Dashboard : cartes stats bg-muted rounded-[20px], header glass, chip crédits gradient, badge cloche badge-pulse
- [x] Pages internes : harmonisation tokens (AppSidebar/AppHeader/Navbar, Miniatures, Personnes, Editor, AbTest, Admin, ShareAbTest)
- [x] Logo : nouveau logo Minia IA (style miniature/play) généré + favicon
- [x] Tests vitest 72/72 + tsc 0 erreur + vérifs light/dark + checkpoint

## Vague v15 (demande utilisateur — 15/08)

- [x] Palette : bleu de nuit (base), orange léger (accent), vert léger, opacité 6 % sur effets subtils — tokens index.css (dark + light) [V15 livré]
- [x] Palette : recalibrer classes v14 (gradient-text, glow-btn, badge-pulse, feature-edge) vers la nouvelle palette [V15 livré]
- [x] Palette : vérifier la lisibilité light/dark sur toutes les pages critiques [V15 livré]
- [x] Onboarding : tutoriel pas à pas Dashboard — overlay + highlight + Next/Skip/terminé [V15 livré]
- [x] Onboarding : marque de complétion (localStorage) + bouton « Rejouer la visite » [V15 livré]
- [x] Backend : table `testimonials` + procédures submit/approve/list [V15 livré]
- [x] Frontend : formulaire de témoignage + section témoignages avec statut approuvé uniquement [V15 livré]
- [x] Frontend : aucun faux témoignage seed — état vide propre [V15 livré]
- [x] Tests vitest + tsc + vérifs light/dark + checkpoint [V15 livré]

## État V15 (sauvegarde contexte — 15/08 13:19)
- [x] Palette bleu de nuit/orange/vert APPLIQUÉE : tokens dark (background oklch 0.14 0.028 262, primary orange 0.75 0.13 60) + light (background pâle teinté, primary 0.7 0.14 60) + classes v14 recalibrées (gradient-text orange→vert, glow 6 %) + tous cyan/violet/pink/purple remplacés en orange-400/500 + green-400/500/600 dans components/*.tsx + pages/*.tsx. tsc 0 erreur. Vérifs visuelles dark/light OK (landing + dashboard light confirmés).
- [x] OnboardingTour.tsx monté dans Dashboard avec data-tour (stats, create, calendar, recent, search, hamburger) + bouton "Rejouer la visite" [V15 livré]
- [x] Testimonials : backend + frontend (formulaire + section landing + modération admin) [V15 livré]
- [x] Tests vitest + vérifs + checkpoint final [V15 livré]
NOTE : localStorage key = "minia-onboarding-done-v1". Palette : orange accent, green success, fond bleu nuit.

## Avancement V15 (13:22)
- Palette appliquée dark+light (orange/vert/bleu nuit), tsc OK, vérifs dark+light OK.
- OnboardingTour.tsx créé + data-tour (stats, create, calendar, recent, hamburger) + bouton Galerie ajouté floating nav. Vérifié visuellement en dark et light : tour fonctionne.
- RESTE : testimonials réels (table + router testimonials + formulaire dans dashboard + section landing publique), puis tests + checkpoint.

## Avancement V15 (13:25)
Backend testimonials TERMINÉ : table testimonials créée + migration appliquée, helpers db (listApprovedTestimonials/createTestimonial/setTestimonialVerified/deleteTestimonial), router testimonials (approved public, create protected, setVerified/delete admin). Frontend : TestimonialsSection.tsx réécrit (avis réels + formulaire + état vide honnête, toastRich "success"/variant).
RESTE : (1) panneau admin pour modérer les avis pending (admin panel existe — chercher où ajouter onglet/modération, grep "admin" pages/Admin.tsx) ; (2) vitest v15 tests (create/approved/setVerified) ; (3) vérifs visuelles landing + checkpoint.
Palette déjà appliquée (bleu nuit/orange/vert, opacité 6%) + onboarding tour vérifié dark+light. tsc 0 erreur.

## État V15 (13:32) — tout en place, reste tests + visuel + checkpoint
- Palette v15 appliquée : bleu nuit (bg tokens), orange léger accent, vert léger, opacité 6% sur effets. Classes v14 recalibrées (orange/green). tsc 0.
- Onboarding tour : client/src/components/OnboardingTour.tsx monté dans Dashboard.tsx (data-tour: hamburger, create, stats, calendar, recent, search). Vérifié dark+light.
- Testimonials : table BDD créée + helpers db + router testimonials (approved public, create protected, setVerified/delete/list admin). TestimonialsSection.tsx réécrit (avis réels + formulaire + état vide honnête). Admin.tsx : onglet "Avis" avec modération pending/approved/rejected.
- Test vitest v15 écrit (mock db pattern, 9 tests) — À LANCER.
- RESTE : (1) pnpm test complet ; (2) screenshots /, /dashboard light+dark ; (3) cocher items v15 dans todo.md ; (4) webdev_save_checkpoint.

## Vague v16 (demande utilisateur — 15/08)

- [x] Animations de survol subtiles sur les cartes de témoignages de la landing page (lift + glow + transition)
- [x] Retirer l'accès admin direct depuis les paramètres (lien sidebar/admin panel basés sur isAdminOwner)
- [x] Accès super admin conditionnel : uniquement si l'utilisateur est le compte propriétaire autorisé (OWNER_OPEN_ID) — flag isAdminOwner injecté au contexte tRPC, adminProcedure, guards frontend, badges, endpoints
- [x] Tests vitest mis à jour et verts (81/81, makeCaller avec isAdminOwner)
- [x] Vérification visuelle + checkpoint + publication

## Vague v17 (demande utilisateur — 15/08)

- [x] Retirer la couleur verte de toute la palette du SaaS : bleu de nuit + orange uniquement (tokens CSS dark+light, success/emerald/green remplacés par orange ou bleu, glows 190/335→60/55, gradient-text orange→orange profond)
- [x] Vidéo de démonstration : vérifier la section vidéo démo sur la landing (embed YouTube/TikTok) et la rendre visible/fonctionnelle
- [x] Tests vitest + tsc + vérifs visuelles dark+light + checkpoint + publication

- [x] Landing refonte vidéo : analyser youthumb.ai/en (section vidéo démo, design, animations) et transposer sur la landing Minia IA (hero 2 colonnes + badge compteur animé + maquette produit animée style mock UI + section démo produit scroll-triggered, style bleu nuit/orange)
- [x] Finaliser : tests vitest + tsc + vérifs visuelles dark+light + checkpoint + publication

## Vague v18 (demande utilisateur — 15/08)

- [x] Retirer le lien « Super Admin » du menu déroulant sous le profil (doublon visible, badge ADMIN)
- [x] Refondre l'interface éditeur CANVAS : 3 panneaux style pro — sidebar gauche (formats 16:9/9:16/1:1/4:5/21:9, ajustement fond, couleurs, calques, versions, bouton Générer avec IA), topbar centrale (outils texte/calques/undo-redo/zoom/aperçu device, Exporter gradient), canvas central + bande de variantes, panneau droit de propriétés ; TemplateEditor harmonisé orange/bleu nuit
- [x] Tests vitest + tsc + vérifs visuelles (desktop/mobile/light) + checkpoint + publication (81/81, c1c144ef)

## Vague v19 (demande utilisateur — 15/08)

- [x] Glisser-déposer d'images sur le canvas de l'éditeur (fond par défaut, ou calque si image déjà présente) — zone d'indication visuelle orange au survol (UploadCloud + instructions), toast de confirmation, validation PNG/JPG/WEBP max 8 Mo, formats respectés selon canvasSize, + collage presse-papier Ctrl+V d'images
- [x] Tests vitest + tsc + vérifs visuelles (desktop/mobile, 81/81) + checkpoint + publication

## Vague v20 (demande utilisateur — 15/08)

- [x] Redimensionnement par poignées sur le canvas : 8 poignées orange (coins + côtés ; e/w pour texte), glisser avec min 20px, ratio maintenable (Shift), mise à jour du panneau propriétés en temps réel
- [x] Prévisualisation miniature YouTube en temps réel dans l'éditeur : bouton YouTube dans la topbar + dialog aperçu vignette YouTube (miniature + titre fictif + chaîne + vues) live-mis-à-jour à chaque modification
- [x] Backend notifications : rappels J-5 (colonne remindedJ5 + getJ5RemindersToFire/markScheduleJ5Reminded + handler /api/scheduled/fireJ5Reminders) et alerte crédits bas (seuil 5, notifiedLowCredit pour ne pas spammer + handler /api/scheduled/fireLowCreditAlerts) — migration drizzle/0012_same_morlocks.sql
- [x] Heartbeat : 2 crons créés — weekly-j5-reminders (0 0 8 * * *, task_uid=RjLMQdmJsLmptpQZpXkhrw) et daily-low-credit-alerts (0 0 9 * * *, task_uid=Wtg7s82VKHWuuCM9LJKwLg)
- [x] Tests vitest 81/81 + tsc OK + vérifs visuelles + checkpoint + publication

## Vague v21 (demande utilisateur — 16/08)

- [ ] Thème clair uniformisé : sidebar de l'éditeur (Editor.tsx — FORMAT, Ajustement du fond, Couleurs, Calques, Versions, Générer avec IA) passe en blanc/orange-soft en light (actuellement bg noir forcé)
- [ ] Thème clair uniformisé : blocs sombres landing (Aperçu communautaire, section Démo produit, autres sections home) — overrides .light ou composants theme-aware
- [ ] Créer la page Notifications (/notifications) : toutes les notifs (planification, rappels J-5/J-1, crédits, achats, avis) avec marquage lu/suppression + route dans App.tsx + entrée dans le menu hamburger/dropdown
- [ ] Animations d'effets spéciaux sur les actions : activer/supprimer/modifier/enregistrer/sauvegarder/télécharger — composant Confetti/Flash/Pop intégré aux toasts et boutons d'action
- [ ] Tests vitest + tsc + vérifs visuelles light/mobile + checkpoint + publication
