# V16 — État en cours (interne)

## Demandes utilisateur (15/08)
1. Animations de survol subtiles sur les cartes de témoignages de la landing page → FAIT
2. Retirer l'accès admin direct des paramètres ; accès super admin uniquement avec le bon identifiant (compte propriétaire) → EN COURS

## Changements effectués
- `client/src/components/TestimonialsSection.tsx` : cartes hover (lift y:-6, scale 1.02, glow orange/vert 6%, quote scale 1.1, avatar scale 1.1, étoiles scale 1.05, transition 300ms). prefers-reduced-motion déjà global (index.css ligne 388).
- `server/_core/context.ts` : ajouté `TrpcUser = User & { isAdminOwner: boolean }` ; `isAdminOwner = user && ENV.ownerOpenId && user.openId === ENV.ownerOpenId` (gate par openId, pas par rôle DB).
- `server/_core/trpc.ts` : adminProcedure exige `ctx.user.isAdminOwner` (plus `role !== 'admin'`).
- `server/routers.ts` : templates.delete (ligne 187) et imageModels.list (ligne 1119) → `ctx.user.isAdminOwner`.
- `client/src/components/AppSidebar.tsx` ligne 434 : `{user?.isAdminOwner === true && (` pour le lien Super Admin.
- `client/src/pages/Admin.tsx` : guards (lignes 33,40,43,46,49,84,106) → `isAdminOwner`.
- `client/src/pages/Templates.tsx` ligne 50 : `isAdmin = user?.isAdminOwner === true`.
- `client/src/pages/Account.tsx` ligne 51 : badge admin → `isAdminOwner`.
- `client/src/pages/Personnes.tsx` ligne 176 : badge → `isAdminOwner`.
- `server/features.v15.test.ts` : makeCaller accepte isAdminOwner ; 3 adminCallers avec isAdminOwner: true.

## Reste à faire
1. Vérifier d'autres tests vitest mockant le user sans isAdminOwner (autres fichiers *.test.ts) — grep `role: "admin"` dans les tests.
2. Lancer `npx vitest run` (81 tests attendus, tous verts).
3. Vérifier que OWNER_OPEN_ID est bien injecté en production (env système VITE/OAUTH…) — il est dans ENV par `process.env.OWNER_OPEN_ID`. Le propriétaire de la session Manus est défini par OWNER_OPEN_ID.
4. Marquer todo.md [x] pour les items V16.
5. Screenshot (landing testimonials, /admin).
6. webdev_save_checkpoint → auto-publish.
7. Message final : rappeler que l'accès admin ne s'active que pour le compte dont l'openId correspond à OWNER_OPEN_ID (le compte qui a créé le projet), les autres utilisateurs avec role='admin' en BDD ne peuvent plus accéder.

## Fichiers clés
- test file : /home/ubuntu/minia-ia/server/features.v15.test.ts
- context : server/_core/context.ts
- trpc : server/_core/trpc.ts
