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
