# 🚀 DÉPLOIEMENT BACKEND SUR COOLIFY

## ✅ Préparation Terminée

Le backend est prêt avec :
- ✅ Dockerfile optimisé
- ✅ .dockerignore
- ✅ Code sur GitHub

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### Étape 1 : Pousser vers GitHub

```bash
cd /Users/chriskabela/Documents/Induction-Backend
git add .
git commit -m "feat: Add Dockerfile for Coolify deployment"
git push origin main
```

### Étape 2 : Dans Coolify

#### 2.1 Créer une Nouvelle Application

1. **Connectez-vous** à Coolify
2. **Allez** dans votre projet (ou créez-en un nouveau)
3. **Cliquez** "+ New" → "Application"

#### 2.2 Configurer la Source

1. **Source Type** : Git Repository
2. **Git Provider** : GitHub
3. **Repository** : `Chriska25/Induction-Backend`
4. **Branch** : `main`

#### 2.3 Configurer le Build

1. **Build Pack** : Dockerfile
2. **Dockerfile Path** : `./Dockerfile` (ou laissez vide)
3. **Port** : `3001`

#### 2.4 Configurer les Variables d'Environnement

**Ajoutez ces variables** :

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://shzgctsvjkrcirceykxa.supabase.co` |
| `SUPABASE_ANON_KEY` | Votre clé anon |
| `SUPABASE_SERVICE_KEY` | Votre clé service_role |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `*` (on changera après) |

#### 2.5 Configurer le Domaine (Optionnel)

Si vous voulez un domaine personnalisé :
- **Domain** : `api.inductionv1.pro-create-drc.com` (ou autre)

Sinon, Coolify vous donnera une URL automatique.

#### 2.6 Déployer

1. **Cliquez** "Deploy"
2. **Attendez** 2-3 minutes
3. **Surveillez** les logs

---

## ✅ Vérification

### Test 1 : Health Check

```bash
curl https://votre-url-coolify.com/api/health
```

✅ **Attendu** : `{"status":"OK","timestamp":"..."}`

### Test 2 : Login

```bash
curl -X POST https://votre-url-coolify.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pm13.org","password":"Password123!"}'
```

✅ **Attendu** : Informations utilisateur

---

## 🔧 Troubleshooting

### Si le déploiement échoue

1. **Vérifiez les logs** dans Coolify
2. **Vérifiez** que les variables d'environnement sont bien configurées
3. **Vérifiez** que le port 3001 est bien exposé

### Si l'API ne répond pas

1. **Vérifiez** que le conteneur tourne : `docker ps`
2. **Vérifiez** les logs : Coolify → Logs
3. **Vérifiez** les variables d'environnement

---

## 📝 Notes Importantes

### Variables d'Environnement Critiques

**SUPABASE_URL** : Doit commencer par `https://`  
**SUPABASE_SERVICE_KEY** : Clé secrète (pas la clé anon)  
**PORT** : Doit être `3001`

### Sécurité

- ✅ `.env` est dans `.gitignore`
- ✅ Les clés sont configurées dans Coolify
- ✅ Pas de secrets dans le code

---

## 🎯 Après le Déploiement

Une fois déployé, vous aurez :

✅ **Backend API** : `https://votre-url.coolify.com`  
✅ **Endpoints** : `/api/health`, `/api/login`, etc.  
✅ **Base de données** : Supabase (PostgreSQL)  
✅ **Auto-deploy** : À chaque push sur `main`

---

## 🚀 Prochaine Étape

Une fois le backend déployé :
1. **Notez l'URL** du backend
2. **Testez** tous les endpoints
3. **Préparez le frontend** avec cette URL

---

**Poussez vers GitHub puis déployez dans Coolify ! 🎊**
