# 📦 Guide d'Installation - CAPCO API

Ce guide vous accompagne dans l'installation et la configuration de l'API CAPCO sur votre environnement de développement.

## 🔧 Prérequis

### Logiciels Requis

- **Node.js** 18.0+ ([Télécharger](https://nodejs.org/))
- **PostgreSQL** 15+ ([Télécharger](https://www.postgresql.org/download/))
- **Git** ([Télécharger](https://git-scm.com/))

### Outils Recommandés

- **VS Code** avec les extensions :
  - TypeScript
  - Prisma
  - ESLint
  - Prettier
- **Postman** ou **Insomnia** pour tester l'API
- **pgAdmin** ou **DBeaver** pour gérer PostgreSQL

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-username/capco-api.git
cd capco-api
```

### 2. Installation des Dépendances

```bash
cd backend
npm install
```

### 3. Configuration de la Base de Données

#### Créer la Base de Données

```sql
-- Se connecter à PostgreSQL
psql -U postgres

-- Créer la base de données
CREATE DATABASE capco_db;
CREATE DATABASE capco_test_db; -- Pour les tests

-- Créer un utilisateur (optionnel)
CREATE USER capco_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE capco_db TO capco_user;
GRANT ALL PRIVILEGES ON DATABASE capco_test_db TO capco_user;
```

#### Configuration des Variables d'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
nano .env
```

**Configurer au minimum :**
```env
DATABASE_URL="postgresql://capco_user:your_password@localhost:5432/capco_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
```

### 4. Configuration de Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer le schéma à la base de données
npm run prisma:push

# (Optionnel) Voir la base de données dans Prisma Studio
npm run prisma:studio
```

### 5. Vérification de l'Installation

```bash
# Démarrer l'application en mode développement
npm run start:dev

# L'API devrait être accessible sur http://localhost:3000
# Documentation Swagger sur http://localhost:3000/api
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:cov

# Tests property-based
npm test -- common.pbt.spec.ts

# Tests end-to-end
npm run test:e2e
```

## 🔍 Vérification de l'Installation

### Health Check

```bash
curl http://localhost:3000/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

### Test d'Authentification

```bash
# Créer un utilisateur de test (si pas de données initiales)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@capco.com",
    "password": "password123",
    "roles": ["admin"]
  }'

# Se connecter
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@capco.com",
    "password": "password123"
  }'
```

## 🐛 Résolution des Problèmes

### Erreur de Connexion à la Base de Données

```
Error: P1001: Can't reach database server
```

**Solutions :**
1. Vérifier que PostgreSQL est démarré
2. Vérifier l'URL de connexion dans `.env`
3. Vérifier les permissions utilisateur

### Erreur de Port Déjà Utilisé

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions :**
1. Changer le port dans `.env` : `PORT=3001`
2. Ou arrêter le processus utilisant le port 3000

### Erreurs de Prisma

```
Error: Schema parsing error
```

**Solutions :**
1. Régénérer le client : `npm run prisma:generate`
2. Réappliquer le schéma : `npm run prisma:push`
3. Vérifier la syntaxe dans `schema.prisma`

### Erreurs de TypeScript

```
Error: Cannot find module '@types/...'
```

**Solutions :**
1. Réinstaller les dépendances : `npm install`
2. Vérifier la version de Node.js
3. Nettoyer le cache : `npm run build:clean`

## 📊 Données de Test

### Importer des Données d'Exemple

```bash
# Si vous avez des données de migration Supabase
npm run import:capco

# Ou créer des données de test manuellement
npm run seed:dev
```

### Utilisateurs de Test

Par défaut, ces utilisateurs sont créés :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@capco.com | admin123 | admin |
| collaborateur@capco.com | collab123 | collaborateur |
| compta@capco.com | compta123 | compta |

## 🔧 Configuration Avancée

### Variables d'Environnement Complètes

Voir le fichier `.env.example` pour toutes les options disponibles.

### Configuration de Production

```env
NODE_ENV=production
LOG_LEVEL=warn
SWAGGER_ENABLED=false
BCRYPT_ROUNDS=12
```

### Configuration Docker (Optionnel)

```bash
# Construire l'image
docker build -t capco-api .

# Démarrer avec Docker Compose
docker-compose up -d
```

## 📚 Prochaines Étapes

1. **Lire la Documentation** : [Guide de Développement](DEVELOPMENT.md)
2. **Explorer l'API** : Swagger UI sur `http://localhost:3000/api`
3. **Comprendre l'Architecture** : [Module Common](../backend/src/common/README.md)
4. **Contribuer** : [Guide de Contribution](CONTRIBUTING.md)

## 🆘 Support

- **Issues GitHub** : [Signaler un problème](https://github.com/votre-username/capco-api/issues)
- **Documentation** : [Wiki du projet](https://github.com/votre-username/capco-api/wiki)
- **Email** : support@capco-api.com

---

✅ **Installation terminée !** Vous pouvez maintenant commencer à développer avec l'API CAPCO.