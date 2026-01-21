# 🚀 GUIDE DE MIGRATION - Supabase + Architecture Séparée

## ✅ Backend PRÊT !

Le nouveau backend avec Supabase est prêt dans `/Users/chriskabela/Documents/Induction-Backend/`

---

## 📋 ÉTAPES DE MIGRATION

### Étape 1 : Configuration Supabase (15 min)

#### 1.1 Créer le Projet Supabase

1. **Allez sur** : https://supabase.com
2. **Connectez-vous** ou créez un compte
3. **Cliquez** sur "New Project"
4. **Remplissez** :
   - Name : `Induction-PM13`
   - Database Password : Créez un mot de passe fort (notez-le !)
   - Region : `Europe West` (ou le plus proche)
5. **Cliquez** "Create new project"
6. **Attendez** 2-3 minutes

#### 1.2 Créer les Tables

1. Dans Supabase, allez dans **"SQL Editor"** (menu gauche)
2. Cliquez **"New query"**
3. **Copiez-collez** tout le contenu de `supabase-schema.sql`
4. Cliquez **"Run"**
5. ✅ Vous devriez voir "Success. No rows returned"

#### 1.3 Récupérer les Clés API

1. Allez dans **"Settings"** → **"API"**
2. **Copiez** :
   - `Project URL` (ex: https://xxxxx.supabase.co)
   - `anon public` key
   - `service_role` key (cliquez "Reveal" puis copiez)

---

### Étape 2 : Configuration Backend Local (10 min)

#### 2.1 Installer les Dépendances

```bash
cd /Users/chriskabela/Documents/Induction-Backend
npm install
```

#### 2.2 Configurer les Variables d'Environnement

```bash
cp .env.example .env
```

Éditez `.env` et remplissez :

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

#### 2.3 Tester le Backend

```bash
npm run dev
```

Vous devriez voir :
```
✅ Backend server running on port 3001
✅ Supabase connected: https://xxxxx.supabase.co
✅ CORS enabled for: http://localhost:5173
```

#### 2.4 Tester l'API

Dans un autre terminal :

```bash
curl http://localhost:3001/api/health
```

Résultat attendu :
```json
{"status":"OK","timestamp":"..."}
```

---

### Étape 3 : Créer l'Utilisateur Admin (5 min)

#### 3.1 Dans Supabase

1. Allez dans **"Table Editor"**
2. Sélectionnez la table **"users"**
3. Cliquez **"Insert row"**
4. Remplissez :
   - `full_name` : Administrateur PM13
   - `email` : admin@pm13.org
   - `job_title` : Administrateur Système
   - `organization` : ADRA
   - `city` : Kinshasa
   - `password_hash` : (voir ci-dessous)
   - `role` : admin

#### 3.2 Générer le Hash du Mot de Passe

Dans le terminal du backend :

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Password123!', 10).then(hash => console.log(hash));"
```

Copiez le hash généré et collez-le dans `password_hash`.

---

### Étape 4 : Créer Repository GitHub Backend (5 min)

#### 4.1 Sur GitHub

1. Allez sur https://github.com/new
2. **Repository name** : `Induction-Backend`
3. **Description** : Backend API pour Plateforme PM13
4. **Public** ou **Private** (votre choix)
5. **NE PAS** initialiser avec README (on l'a déjà)
6. Cliquez **"Create repository"**

#### 4.2 Pousser le Code

```bash
cd /Users/chriskabela/Documents/Induction-Backend
git init
git add .
git commit -m "feat: Backend initial avec Supabase"
git branch -M main
git remote add origin https://github.com/Chriska25/Induction-Backend.git
git push -u origin main
```

---

### Étape 5 : Préparer le Frontend (Prochaine étape)

Le frontend sera préparé dans la prochaine phase.

---

## ✅ Checklist Étape 1 (Backend)

- [ ] Projet Supabase créé
- [ ] Tables créées (schema.sql exécuté)
- [ ] Clés API récupérées
- [ ] Backend installé (`npm install`)
- [ ] `.env` configuré
- [ ] Backend testé (`npm run dev`)
- [ ] API health check fonctionne
- [ ] Utilisateur admin créé
- [ ] Repository GitHub créé
- [ ] Code poussé vers GitHub

---

## 🎯 Prochaines Étapes

1. ✅ **Backend** : TERMINÉ
2. ⏳ **Frontend** : À préparer
3. ⏳ **Déploiement** : Backend + Frontend
4. ⏳ **Tests** : Validation complète

---

## 📞 Support

Si vous rencontrez un problème :

1. Vérifiez que Supabase est bien configuré
2. Vérifiez les clés API dans `.env`
3. Vérifiez que le serveur démarre sans erreur
4. Testez `/api/health`

---

**Dites-moi quand vous avez terminé l'Étape 1 ! 🚀**
