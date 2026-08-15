# V17 — Retrait du vert (interne)

Demande : palette à 2 couleurs uniquement — bleu de nuit + orange. Retirer tout le vert.

## Tokens (client/src/index.css)
- `--color-light-green` (ligne 53) → supprimer ou remapper en orange clair
- `--color-neon-pink` (ligne 55, actuel = vert) → remapper en orange foncé/autre
- `--chart-2` (ligne 84) → orange variant
- Commentaires « vert léger » à retirer

## Conversions (liste /tmp/green_list.txt, 86 lignes)
Règles :
- `from-orange-400 to-green-400` → `from-orange-400 to-orange-300`
- `from-orange-400 to-green-500` → `from-orange-400 to-orange-300`
- `green-400` seul (bg/text/border hover) → `orange-400`
- `green-500` (filled/active/badge) → `orange-500`
- `green-600` boutons → `orange-600`, hover green-500 → orange-500
- `emerald-400/500` → `orange-400/500`
- `text-green-300` → `text-orange-300`
- Statut "green" dans Admin.tsx StatCard color props → "orange" (StatCard peut avoir color="green"? vérifier props; sinon garder color="orange")
- Admin.tsx ligne 706-708 : map colors pink/purple/green → borders orange variants
- Features.tsx lignes 22/28 (from-green-400 to-green-600 etc.) → orange variants
- toasts.tsx ligne 35 : text-emerald-400 (icône succès) → text-orange-400
- Gallery/AbTest : likes = cœur, winner = vert → orange
- hover:bg-green-400/20 (favori) → hover:bg-orange-400/20

## Vidéo démo
- Vérifier section vidéo démo dans Home.tsx / HeroSection / VideoTestimonialsSection
- L'utilisateur dit « elle est où la vidéo démo » → peut-être la section embed YouTube invisible car ids vides (auto-hide). Vérifier.

## Fichiers touchés (~25 fichiers)
index.css, HeroSection.tsx, Navbar.tsx, TestimonialsSection.tsx, AppSidebar.tsx, TestContributionsPanel.tsx, toasts.tsx, Dashboard.tsx, Gallery.tsx, Features.tsx, Pricing.tsx, Generator.tsx, Faq.tsx, Docs.tsx, Blog.tsx, Models.tsx, BestPractices.tsx, Examples.tsx, Comparisons.tsx, ForCreators.tsx, Contact.tsx, Billing.tsx, Admin.tsx, AbTest.tsx, ShareAbTest.tsx, Organization.tsx, Invitations.tsx, Miniatures.tsx, Personnes.tsx, Home.tsx (vidéo), VideoTestimonialsSection.tsx

Après : pnpm test, tsc, screenshots, checkpoint.
