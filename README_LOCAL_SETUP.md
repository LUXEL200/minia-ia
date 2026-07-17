# Minia IA — Guide de configuration locale & administration

## Prérequis

- Node.js 22+
- pnpm 10+
- MySQL/TiDB (pour la base de données)

## Installation locale

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd minia-ia

# 2. Installer les dépendances
pnpm install

# 3. Créer un fichier .env
cp .env.example .env

# 4. Modifier .env avec vos valeurs (voir section ci-dessous)

# 5. Lancer la base de données et appliquer les migrations
pnpm drizzle-kit generate
# Appliquer le SQL généré dans votre base MySQL

# 6. Lancer le serveur de développement
pnpm dev
```

## Variables d'environnement (.env)

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# === Base de données ===
DATABASE_URL=mysql://user:password@localhost:3306/minia-ia

# === Manus OAuth (si tu veux garder l'auth Manus) ===
JWT_SECRET=ton-secret-jwt
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=ton-app-id
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# === Variables frontend ===
VITE_APP_TITLE=Minia IA
VITE_APP_LOGO=https://ton-logo-url/logo.png
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# === Admin (pour le rôle admin) ===
OWNER_OPEN_ID=ton-open-id
OWNER_NAME=ton-nom

# === Forge API (injection automatique par le runtime Manus, pas besoin de configurer en local) ===
BUILT_IN_FORGE_API_KEY=
BUILT_IN_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
```

## Rôle Admin

En tant que super admin, tu as les droits suivants :

1. **Lister les modèles d'IA disponibles** — via `trpc.imageModels.list` (réservé admin)
2. **Gérer les utilisateurs** — via la base de données MySQL directement ou le panel d'administration
3. **Ajouter des crédits** — modifie directement la table `userCredits` dans la BDD
4. **Promouvoir un utilisateur en admin** — exécute :

```sql
UPDATE users SET role = 'admin' WHERE openId = 'ton-open-id';
```

## Base de données — Tables créées

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (auth, rôle, dernière connexion) |
| `thumbnails` | Miniatures générées (prompt, style, URL, statut) |
| `userCredits` | Crédits restants et type de plan |

### Schéma `thumbnails`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INT AUTO_INCREMENT | ID unique |
| `userId` | INT | Lien vers l'utilisateur |
| `prompt` | TEXT | Description de la miniature |
| `style` | ENUM | viral, mrbeast, minimalist, dramatic, tech, retro |
| `imageUrl` | TEXT | URL de l'image générée |
| `status` | ENUM | generating, completed, failed |
| `creditsUsed` | INT | Nombre de crédits utilisés (1) |
| `createdAt` | TIMESTAMP | Date de création |

### Schéma `userCredits`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INT AUTO_INCREMENT | ID unique |
| `userId` | INT | Lien vers l'utilisateur |
| `credits` | INT | Nombre de crédits restants |
| `planType` | ENUM | free, pro, max |
| `createdAt` | TIMESTAMP | Date de création |

## Comment ajouter des crédits manuellement (admin)

```sql
-- Donner 50 crédits à un utilisateur
INSERT INTO userCredits (userId, credits, planType)
VALUES (1, 50, 'pro')
ON DUPLICATE KEY UPDATE credits = 50, planType = 'pro';
```

## Comment gérer les témoignages vidéo

Édite le fichier `client/src/components/VideoTestimonialsSection.tsx` :

1. Remplace les `youtubeId: ""` par les vrais IDs YouTube
2. Mets à jour les quotes, créateurs et métriques
3. La section s'affiche automatiquement dès qu'au moins un ID est renseigné

## Test de la génération de miniatures

1. Connecte-toi via le bouton "Connexion" en haut à droite
2. Navigate to `/dashboard`
3. Décris ta miniature dans le champ texte
4. Choisis un style et une quantité
5. Clique sur "Générer"
6. Les miniatures apparaîtront dans "Miniatures récentes"

## Structure des fichiers clés

```
server/
  routers.ts          → Endpoints tRPC (thumbnail.generate, credits, delete, etc.)
  db.ts               → Helpers de requêtes (getThumbnailsByUserId, deductCredits, etc.)
  _core/imageGeneration.ts → Forge API wrapper

drizzle/
  schema.ts           → Tables: users, thumbnails, userCredits

client/src/pages/
  Home.tsx            → Landing page (18 sections)
  Dashboard.tsx       → Interface de génération (connectée)

client/src/components/
  VideoTestimonialsSection.tsx → Témoignages vidéo (conditionnel)
```

## Sécurité implémentée

- **Ownership verification** : `thumbnail.get` et `thumbnail.delete` vérifient que la miniature appartient à l'utilisateur connecté
- **Crédit deduction** : Les crédits ne sont débités que pour les miniatures réellement générées avec succès
- **Admin-only** : La route `imageModels.list` est réservée aux admins
