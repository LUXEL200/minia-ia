# V11 — Diagnostic mode clair (?theme=light)

## Défauts identifiés (screenshots /dashboard, /organisation, /miniatures, /personnes)

1. **Header (barre supérieure du layout)** : fond reste noir (`bg-[#0a0a0a]` ou similaire) en light, texte "Tableau de bord" gris sombre invisible. Le header du layout (PageHeader/breadcrumb bar) ne passe pas en clair.
2. **Sidebar (à gauche, large bande noire)** : toute la colonne gauche du DashboardLayout reste noire en light (bg-[#0a0a0a]/#111 non couvert, ou le layout est un composant avec classe hardcodée).
3. **/organisation — bloc membre "Richy"** : le bg du membre devient gris moyen opaque (bg-[#3F3F46]→?) et l'email "richy.luxel@gmail.com" (probablement text-zinc-500) invisible sur ce fond gris. La ligne du membre devrait devenir var(--secondary) avec texte lisible.
4. **/miniatures — overlay de la carte** : le texte de la miniature ("Un homme dans une piscin…") gris clair sur l'image, overlay bg-gradient-to-t from-black/80 → doit devenir sombre lisible (overlay black/80 reste ok sur image, mais le texte peut rester lisible ; vérifier).
5. **/personnes — premier onglet "Membres"** : label blanc invisible sur fond clair (text-white hardcodé).

## Points-clés du layout
- Layout dark persistant : identifier le composant wrapper (DashboardLayout.tsx ou PageHeader.tsx) qui contient la classe bg-[#0a0a0a] + le header noir + la sidebar gauche.
- Les overrides .light ne ciblent probablement pas la classe exacte utilisée par le layout.

## Fix planifié
- Ajouter overrides .light pour la barre de header (breadcrumb) et la colonne sidebar gauche du layout (identifier les classes exactes).
- Corriger le bloc membre Organisation (text-zinc-500/400 sur fond sombre → foreground).
- Corriger le label d'onglet "Membres" (text-white → foreground en light).
- Vérifier aussi le bouton hamburger flottant (déjà fait en v10), mais dans ces screenshots le menu "Menu" en haut droite semble OK (blanc).

## Résolution (15/08/2026)
- Header sticky /dashboard (`bg-[#000]/90`, `bg-[#000]/80`) → couvert → var(--secondary), lisible.
- Onglet actif "Membres" (/personnes, `/dashboard`, boutons connexion) : `text-black` ne doit plus devenir `var(--background)` (invisible sur fond blanc) → désormais #111 ; `bg-white` → var(--card) ; cas combiné `bg-white text-black` → lisibles.
- Bloc membre /organisation (`bg-zinc-900/60`) + `bg-zinc-950/60`, `bg-black/35` → var(--muted), lisible.
- `hover:bg-white/90`, `hover:text-white`, `hover:text-zinc-300/400`, `hover:text-red-400` couverts.
- Vérifié OK en light (screenshots) : /dashboard, /personnes, /organisation, /miniatures, /gallery, /ab-test, /notifications, /settings, /account, /templates, /avatars, /endcards, /billing, /api-keys, /admin, /editor. Tous les overrides sont sous html.light → thème sombre inchangé.
- Reste : run tests vitest + checkpoint.

## État technique
- `?theme=light` est supporté (ThemeContext, param > localStorage).
- overrides .light dans client/src/index.css, ligne 390+, après @layer utilities.
- tsc 0 erreur, tests 59/59 (avant v11).
