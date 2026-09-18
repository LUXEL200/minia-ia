# Minia IA — Guide de configuration locale & administration

## Prérequis

- Node.js 22+
- pnpm 10+
- MySQL/TiDB (pour la base de données)

## Installation locale

```bash
# 1. Cloner le projet
git clone <ton-repo-minia-ia>
cd minia-ia

# 2. Installer les dépendances
pnpm install

# 3. Créer ton fichier .env (vois la section Variables d'environnement ci-dessous)

# 4. Créer la base de données MySQL et appliquer les migrations
#    Le fichier de migration SQL se trouve dans drizzle/0000_chief_famine.sql
#    Après modification du schéma, régénère avec : pnpm drizzle-kit generate
pnpm db:push

# 5. Lancer le serveur de développement
pnpm dev
# Le site sera disponible sur http://localhost:3000
```

## Variables d'environnement

Crée un fichier `.env` à la racine du projet. Voici les variables requises :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | Connexion MySQL/TiDB | `mysql://root:pass@localhost:3306/minia_ia` |
| `JWT_SECRET` | Secret pour signer les sessions | Une chaîne aléatoire longue |
| `OAUTH_SERVER_URL` | URL du serveur OAuth Manus | `https://api.manus.im` |
| `VITE_APP_ID` | ID de l'app Manus | Trouvable dans Settings |
| `VITE_OAUTH_PORTAL_URL` | Portail d'auth Manus | `https://auth.manus.im` |
| `OWNER_OPEN_ID` | Ton openId pour le rôle admin | `user_xxxxxxxx` |
| `OWNER_NAME` | Ton nom d'affichage | `Admin` |
| `VITE_APP_TITLE` | Titre du site | `Minia IA` |
| `VITE_APP_LOGO` | URL du logo | `/logo.png` |

### Configuration production du super admin

`OWNER_OPEN_ID` doit contenir l’**openId exact retourné par Manus OAuth** pour le compte propriétaire vérifié. Il ne faut pas y mettre l’adresse e-mail ni un mot de passe. Définis cette variable dans les secrets de l’environnement de production, redémarre le serveur, puis vérifie que l’utilisateur connecté avec ce compte voit la route `/admin`. Si la variable est absente, les procédures `adminProcedure` restent volontairement bloquées et le serveur écrit une alerte de sécurité.

## Rôle Admin

En tant que super admin, tu as les droits suivants :

1. **Lister les modèles d'IA disponibles** — via `trpc.imageModels.list` (réservé admin)
2. **Gérer les utilisateurs** — via la base de données MySQL directement
3. **Ajouter des crédits** — modifie directement la table `userCredits` dans la BDD
4. **Promouvoir un utilisateur en admin** — exécute la requête SQL ci-dessous

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
-- Donner 50 crédits à un utilisateur (ID = 1) avec plan Pro
INSERT INTO userCredits (userId, credits, planType)
VALUES (1, 50, 'pro')
ON DUPLICATE KEY UPDATE credits = 50, planType = 'pro';

-- Vérifier les crédits d'un utilisateur
SELECT * FROM userCredits WHERE userId = 1;

-- Remettre à zéro les crédits (pour test)
UPDATE userCredits SET credits = 0 WHERE userId = 1;
```

## API Forge — Génération IA

### En environnement Manus (production)

Les variables `BUILT_IN_FORGE_API_KEY` et `BUILT_IN_FORGE_API_URL` sont **injectées automatiquement** par le runtime Manus. La génération de miniatures fonctionne out-of-the-box.

### En local (test)

Ces variables ne sont **pas disponibles** hors du runtime Manus. Pour tester la génération IA en local, tu as 3 options :

**Option A — Utiliser une clé Manus directement**
1. Copie les valeurs de `BUILT_IN_FORGE_API_KEY` et `BUILT_IN_FORGE_API_URL` depuis ton panel Manus Settings → Secrets
2. Ajoute-les à ton `.env` local

**Option B — Utiliser un provider alternatif (OpenAI)**
Modifie `server/_core/imageGeneration.ts` pour utiliser OpenAI :
```ts
// Exemple avec OpenAI DALL-E
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateImage({ prompt, model, quality }) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    quality: quality === "high" ? "hd" : "standard",
    n: 1,
    size: "1024x1024", // ou "1792x1024" pour 16:9
  });
  return { url: response.data[0].url };
}
```

**Option C — Utiliser Replicate ou Stability AI**
Similaire à l'option B, adapte `imageGeneration.ts` pour appeler l'API de ton choix.

## Comment gérer les témoignages vidéo

Édite le fichier `client/src/components/VideoTestimonialsSection.tsx` :

1. Remplace les `youtubeId: ""` par les vrais IDs YouTube
2. Mets à jour les quotes, créateurs et métriques
3. La section s'affiche automatiquement dès qu'au moins un ID est renseigné

```ts
// Exemple d'activation :
youtubeId: "dQw4w9WgXcQ", // Remplace par le vrai ID de la vidéo
```

## Test de la génération de miniatures

1. Connecte-toi via le bouton "Connexion" en haut à droite
2. Navigue vers `/dashboard`
3. Décris ta miniature dans le champ texte (min. 10 caractères)
4. Choisis un style (viral, MrBeast, minimalist, dramatic, tech, retro)
5. Choisis une quantité (1-4 miniatures)
6. Clique sur "Générer"
7. Les miniatures apparaîtront dans "Miniatures récentes" avec statut (en cours / terminé / échoué)
8. Tu peux télécharger ou supprimer chaque miniature

## Structure des fichiers clés

```
server/
  routers.ts                    → Endpoints tRPC (thumbnail.generate, credits, delete, imageModels)
  db.ts                         → Helpers de requêtes DB (getThumbnailsByUserId, deductCredits, etc.)
  _core/imageGeneration.ts      → Forge API wrapper (à adapter pour usage local)

drizzle/
  schema.ts                     → Tables: users, thumbnails, userCredits

client/src/pages/
  Home.tsx                      → Landing page (18 sections)
  Dashboard.tsx                 → Interface de génération (connectée API Forge)

client/src/components/
  VideoTestimonialsSection.tsx  → Témoignages vidéo (conditionnel, auto-hide si vide)
```

## Sécurité implémentée

| Fonctionnalité | Protection |
|----------------|------------|
| `thumbnail.get` | Vérifie que la miniature appartient à l'utilisateur connecté |
| `thumbnail.delete` | Vérifie l'ownership avant suppression |
| `thumbnail.generate` | Crédits débités uniquement pour les générations réussies |
| `imageModels.list` | Réservé aux admins (role = 'admin') |
| Système de crédits | Plafond de 4 miniatures par requête, vérification avant génération |
