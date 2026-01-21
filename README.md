# Induction PM13 - Backend API

Backend API pour la Plateforme de Formation PM13 avec Supabase.

## 🚀 Technologies

- **Node.js** + **Express.js**
- **Supabase** (PostgreSQL)
- **Bcrypt** pour les mots de passe
- **Multer** pour les uploads

## 📋 Prérequis

- Node.js 18+
- Compte Supabase (gratuit)

## ⚙️ Installation

### 1. Cloner le repository

```bash
git clone https://github.com/Chriska25/Induction-Backend.git
cd Induction-Backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le script `supabase-schema.sql` dans l'éditeur SQL de Supabase
3. Récupérez vos clés API

### 4. Configuration environnement

Copiez `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Remplissez les variables :

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 5. Démarrer le serveur

```bash
# Développement
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:3001`

## 📡 API Endpoints

### Auth
- `POST /api/login` - Connexion

### Users
- `GET /api/users` - Liste utilisateurs
- `GET /api/users/:id` - Détails utilisateur
- `POST /api/users` - Créer utilisateur
- `PUT /api/users/:id` - Modifier utilisateur

### Modules
- `GET /api/modules` - Liste modules
- `POST /api/modules` - Créer module
- `PUT /api/modules/:id` - Modifier module
- `DELETE /api/modules/:id` - Supprimer module

### Trainings
- `GET /api/trainings/user/:userId` - Progression utilisateur
- `POST /api/trainings` - Créer/Mettre à jour progression

### Settings
- `GET /api/settings` - Récupérer paramètres
- `PUT /api/settings` - Modifier paramètres

### Upload
- `POST /api/upload` - Upload image

### Admin
- `GET /api/admin/users` - Liste complète utilisateurs
- `GET /api/admin/logs` - Logs système

### Health
- `GET /api/health` - Vérifier statut serveur

## 🗄️ Base de Données

La base de données PostgreSQL est gérée par Supabase.

### Tables principales :
- `users` - Utilisateurs
- `modules` - Formations
- `trainings` - Progression
- `images` - Images uploadées
- `settings` - Paramètres
- `logs` - Logs système

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Coolify

1. Créer une nouvelle application
2. Connecter le repository GitHub
3. Configurer les variables d'environnement
4. Déployer

## 📝 Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_KEY` | Clé secrète Supabase |
| `PORT` | Port du serveur (défaut: 3001) |
| `FRONTEND_URL` | URL du frontend pour CORS |

## 🔒 Sécurité

- Mots de passe hachés avec bcrypt
- Row Level Security (RLS) activé sur Supabase
- CORS configuré
- Variables d'environnement pour les secrets

## 📄 Licence

MIT
