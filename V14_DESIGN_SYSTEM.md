# V14 — Design System Refonte « Cinematic Studio »

## Sources consultées
- Elementor Blog (inspirations web design, 20+ sources)
- Pinterest board Web Design Inspiration (3 474 pins)
- Dribbble / 21st.dev (composants notification)
- Trends 2026 : Calm Design (Linear), purposeful motion, bold typography, micro-animations avec sens, split layouts, glassmorphism raffiné

## Concept : « Cinematic Studio »
Identité éditoriale inspirée des miniatures YouTube : contrastes dramatiques, typographie massive, accents néon contenus, espaces généreux (calm design). Effet « studio de création » — pas de bruit visuel, chaque élément a un rôle.

## Typographie
- **Display** : Sora (bold/800) — géométrique, moderne, remplace l'actuel Space Grotesk pour un rendu plus doux/arrondi « humain »
- **Body** : Inter (400/500) inchangé
- **Mono / chiffres** : JetBrains Mono pour les crédits, stats, dates — touche technique
- Scale : headline clamp(2.2rem→4.5rem), line-height tight (1.05 display / 1.6 body), tracking léger négatif display

## Palette (dark default)
- Fond : oklch(0.13 0.02 290) (#0B0B0F) — nuance légèrement violacée, plus riche que noir pur
- Surface : oklch(0.18 0.02 290) (#12121A)
- Accent primaire : cyan #22D3EE → dégradé vers violet #8B5CF6 (gradient signature « miniatures IA »)
- Accent secondaire : magenta rose #F43F9E (gardé, signature déjà validée)
- Texte : --foreground oklch(0.97 0 290), muted oklch(0.68 0.02 290)
- Bordures : oklch(0.25 0.02 290) — subtile, 1px
- Light : fond oklch(0.975 0.005 290) (#F8F7FB), surfaces blanches, accents identiques

## Effets visuels
- Glassmorphism raffiné : bg blur(16px) + bg-surface/70 + border 1px /12
- Gradient text : cyan→violet sur mots-clés headline
- Glow contenu : box-shadow cyan/20 subtil sur CTA hover (pas de halo criard)
- Grid texture : motif points 24px (radial-gradient, opacité 0.04) en arrière-plan sections
- Cards : radius 20px (plus doux), ombre douce, hover lift translateY(-2px) 240ms
- Chips/pills : radius plein, micro-bordure, backdrop
- Bords lumineux top sur cartes featured (1px gradient cyan→violet)

## Micro-animations (purposeful motion)
- reveal on scroll (fade+translateY 12px, 200-260ms ease-out, stagger 40ms)
- CTA : hover scale 1.02 + glow, active scale 0.97 140ms
- Cartes : hover lift -2px + border accent 30%, 220ms
- Counter animé hero (requestAnimationFrame, une seule passe)
- Navbar : glass on scroll (transition backdrop 300ms)
- Badge pulse : 2s ease-in-out infini, subtil (scale 1→1.05)
- Marquee logos/stats optionnel si peu coûteux

## Logo
Nouveau logo généré : play-button + étincelle IA, palette cyan/magenta, style minimaliste flat, 1:1
- favicon + navbar wordmark « Minia**IA** » (IA en gradient)

## Landing page (Home)
- Hero : badge pill + headline Sora 800 avec 2 mots en gradient, sous-titre court, double CTA (primary gradient + secondary glass), preuve sociale (avatar stack + compteur animé + rating), miniatures flottantes 3D (tilt, parallax léger), grille de fond
- Sections : réécriture copy orientée story (problem→solution), cartes features avec icônes line (lucide), numbers/stats bar en gradient, templates en carousel-like grid, pricing toggle, FAQ accordion épurée, CTA final plein écran gradient
- Footer : restructuré, colonnes propres, gradient top border

## Dashboard / pages internes
- Header : glass sticky, breadcrumb Sora 600, credits chip mono + gradient border, cloche avec badge pulse
- Stat cards : gros chiffres Sora + delta, icon dans pastille gradient douce
- Calendrier : cellule active glow cyan/30, aujourd'hui ring
- Onglets : pill style (bg + text-foreground), actif gradient subtil
- Empty states : illustration icon + micro-copy encourageante
- Cohérence light/dark : mêmes tokens, pas de hardcodés

## Plan d'exécution
1. index.html : fonts Sora + JetBrains Mono + favicon
2. index.css : tokens v2, classes utilitaires (gradient-text, glass, grid-bg, reveal, glow, pill)
3. client/public/logo.svg + favicon
4. Home.tsx + composants landing (HeroSection, sections, Footer)
5. DashboardLayout/AppSidebar : header + dropdown
6. Pages clés : Dashboard, Miniatures, Personnes, Notifications, Billing, Gallery, Editor (harmonisation tokens)
7. Vérifs light/dark + tests + checkpoint

---
## État d'avancement V14 (pour reprise après compaction)
- Design system documenté ci-dessus (typo Sora+Inter+JetBrains Mono, palette Cinematic Studio, effets glassmorphism/grid-bg, micro-animations)
- Prochaines étapes :
  1. Générer logo (generate_image : play+étincelle, cyan #22D3EE/magenta #F43F9E, flat, fond uni pour transparence) → /home/ubuntu/webdev-static-assets/minia-logo.png
  2. index.html : fonts Google (Sora 400-800, Inter, JetBrains Mono), favicon
  3. index.css : tokens light/dark v2 + classes .gradient-text, .glass, .grid-bg, .reveal, .glow-btn, .pill
  4. Refonte Landing : Home.tsx + composants sections (HeroSection etc.) dans client/src/components/landing/ (vérifier structure existante d'abord)
  5. DashboardLayout + AppSidebar (header glass, credits chip mono, cloche pulse)
  6. Harmoniser pages : Dashboard, Miniatures, Personnes, Notifications, Billing, Gallery, Editor (tokens, radius 20, border subtiles)
  7. Tests vitest (72/72 actuellement) + tsc + screenshots light/dark + checkpoint
- Sources trends 2026 : calm design (Linear), motion purposeful, bold typo, split layouts, glassmorphism raffiné (krishaweb.medium dark-mode-glassmorphism)
- Références compétence : dribbble notification, 21st.dev notification, elementor web-design-inspiration, pinterest ca.pinterest.com/click123ca/web-design-inspiration

## Avancement V14 (état après refonte sections landing)
FAIT : index.html (Sora 400-800 + Inter + JetBrains Mono, favicon logo /manus-storage/minia-logo_8c5c988e.png). index.css : font-display Sora, radius 0.75rem, nouvelles classes .gradient-text, .glass, .grid-dots, .lift-card, .feature-edge, .glow-btn, .pill, .reveal-v14, .badge-pulse + overrides light correspondants. Navbar : logo généré + wordmark gradient-text + CTA pill glow. HeroSection : grid-dots, badge pill, gradient-text, CTA pill. SocialProofSection : lift-card glass. ProblemSection : pill label + gradient-text + cartes glass. Sections restantes (Solution, Features, Process, Styles, Comparison, Testimonials, GalleryPreview, Pricing, FAQ, CTA, Footer) : sed global a remplacé text-[#06B6D4]→text-cyan-400, text-[#EC4899]→text-pink-500, bg-[#18181B]→bg-card/70, border-[#27272A]→border-border, rounded-xl→rounded-[20px], gradients texte→gradient-text. Reste : GalleryPreviewSection ligne 35 font-[Space_Grotesk]→font-display ; Footer wordmark similaire à vérifier ; vérifier tsc ; DashboardLayout/AppSidebar (header glass, credits chip mono, badge-pulse) ; pages internes (tokens radius 20, logos) ; screenshots light/dark ; tests 72/72 ; checkpoint.
Logo URL : /manus-storage/minia-logo_8c5c988e.png (local: /home/ubuntu/webdev-static-assets/minia-logo.png)

## Vérification visuelle v14 (13:06)
Screenshot OK : landing sombre harmonisée (gradient cyan→violet, grid-dots, cartes lift). Dashboard : cartes stat cards bg-muted arrondies, calendar, tout lisible. Miniatures/Organisation : headers gris foncé lisibles, badges OK. tsc 0 erreur.
RESTE : vérifier mode light sur / et /dashboard (les overrides light couvrent bg-muted/border-border) ; vérifier /miniatures bouton "Nouvelle miniature" rouge (#F43F5E?) — il est rose foncé, OK ; tests vitest ; checkpoint.
Note : /dashboard screenshot montre bg noir global — la page Dashboard garde min-h-screen bg-[#000] dans son propre wrapper ; l'override html.light couvre bg-[#000] → light OK.
