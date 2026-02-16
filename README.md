# 🏛️ CAPCO - Cabinet d'Avocats API

> API NestJS moderne pour la gestion complète d'un cabinet d'avocats spécialisé en contentieux, recouvrement, immobilier et conseil.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0+-red.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7+-green.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Vue d'Ensemble

CAPCO API est une solution complète de gestion pour cabinets d'avocats, développée avec NestJS et TypeScript. Elle offre une architecture modulaire robuste avec authentification JWT, audit automatique, et gestion des rôles.

### 🎯 Domaines Métier

- **⚖️ Contentieux** - Gestion des affaires, audiences, honoraires
- **💰 Recouvrement** - Suivi des dossiers, actions, paiements
- **🏠 Immobilier** - Patrimoine, baux, encaissements, rapports
- **📋 Conseil** - Clients, tâches, facturation

### ✨ Fonctionnalités Clés

- 🔐 **Authentification JWT** avec gestion des rôles (admin, collaborateur, compta)
- 📊 **API REST** avec ~70 endpoints documentés
- 🔍 **Audit automatique** de toutes les actions utilisateur
- 🛡️ **Sécurité avancée** avec Row Level Security équivalent
- 📄 **Pagination intelligente** avec recherche et tri
- 🧪 **Tests property-based** pour la validation des propriétés universelles
- 📚 **Documentation Swagger** automatique

## 🏗️ Architecture

```
capco-api/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── common/         # Services transversaux
│   │   ├── auth/           # Authentification
│   │   ├── contentieux/    # Module contentieux
│   │   ├── recouvrement/   # Module recouvrement
│   │   ├── immobilier/     # Module immobilier
│   │   ├── conseil/        # Module conseil
│   │   └── config/         # Configuration
│   ├── prisma/             # Schéma base de données
│   └── test/               # Tests
├── frontend/               # Interface utilisateur (à venir)
├── docs/                   # Documentation
└── .kiro/                  # Spécifications et design
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/capco-api.git
cd capco-api

# Installer les dépendances
cd backend
npm install

# Configuration de la base de données
cp .env.example .env
# Éditer .env avec vos paramètres de base de données

# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:push

# Démarrer en mode développement
npm run start:dev
```

### 🔧 Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/capco_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Application
NODE_ENV="development"
PORT=3000

# Pagination
DEFAULT_PAGE_LIMIT=20
MAX_PAGE_LIMIT=100

# Audit
AUDIT_ENABLED=true
```

## 📖 Documentation

### API Documentation
- **Swagger UI** : `http://localhost:3000/api` (en développement)
- **Spécifications** : [Design Document](.kiro/specs/nestjs-api-architecture/design.md)
- **Architecture** : [Module Common](backend/src/common/README.md)

### Guides de Développement
- [Guide d'Installation](docs/INSTALLATION.md)
- [Guide de Développement](docs/DEVELOPMENT.md)
- [Guide de Déploiement](docs/DEPLOYMENT.md)
- [Guide de Migration](docs/MIGRATION.md)

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

### Tests Property-Based
Le projet utilise `fast-check` pour valider les propriétés universelles du système :
- Gestion cohérente des erreurs
- Sécurité des authentifications
- Intégrité des données CRUD

## 🔐 Sécurité

### Authentification
- JWT avec refresh tokens
- Hashage bcrypt des mots de passe
- Protection CSRF

### Autorisation
- Rôles : `admin`, `collaborateur`, `compta`
- Row Level Security équivalent
- Audit automatique des actions

### Validation
- Validation automatique des DTOs
- Sanitisation des données d'entrée
- Protection contre l'injection SQL

## 📊 API Endpoints

### Authentification
```
POST   /auth/login          # Connexion
POST   /auth/refresh        # Refresh token
POST   /auth/logout         # Déconnexion
```

### Contentieux
```
GET    /affaires            # Liste des affaires
POST   /affaires            # Créer une affaire
GET    /affaires/:id        # Détails d'une affaire
PUT    /affaires/:id        # Modifier une affaire
DELETE /affaires/:id        # Supprimer une affaire
```

### Recouvrement
```
GET    /recouvrement        # Liste des dossiers
POST   /recouvrement        # Créer un dossier
# ... autres endpoints CRUD
```

*[Documentation complète des endpoints dans Swagger]*

## 🛠️ Technologies

### Backend
- **NestJS** - Framework Node.js progressif
- **TypeScript** - Typage statique
- **Prisma** - ORM moderne
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification stateless
- **bcrypt** - Hashage des mots de passe
- **class-validator** - Validation des DTOs
- **fast-check** - Tests property-based

### Outils de Développement
- **ESLint** - Linting du code
- **Prettier** - Formatage du code
- **Jest** - Framework de tests
- **Swagger** - Documentation API
- **Kiro** - Spécifications et design

## 🤝 Contribution

### Workflow de Développement

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commiter** les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. **Pousser** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Créer** une Pull Request

### Standards de Code

- Utiliser TypeScript strict
- Suivre les conventions ESLint/Prettier
- Écrire des tests pour les nouvelles fonctionnalités
- Documenter les APIs avec Swagger
- Respecter l'architecture modulaire

### Commits Conventionnels

```
feat: ajout du module recouvrement
fix: correction de la validation JWT
docs: mise à jour du README
test: ajout des tests property-based
refactor: amélioration de l'architecture Common
```

## 📈 Roadmap

### Phase 1 - Infrastructure ✅
- [x] Module Common et services transversaux
- [x] Authentification JWT
- [x] Audit automatique
- [x] Tests property-based

### Phase 2 - Modules Métier 🚧
- [ ] Module Contentieux
- [ ] Module Recouvrement
- [ ] Module Immobilier
- [ ] Module Conseil

### Phase 3 - Fonctionnalités Avancées 📋
- [ ] Dashboard et statistiques
- [ ] Notifications et alertes
- [ ] Export de données
- [ ] API publique

### Phase 4 - Interface Utilisateur 📋
- [ ] Frontend React/Next.js
- [ ] Interface mobile
- [ ] PWA

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développeur Principal** - [@votre-username](https://github.com/votre-username)

## 📞 Support

- 📧 Email : support@capco-api.com
- 🐛 Issues : [GitHub Issues](https://github.com/votre-username/capco-api/issues)
- 📖 Documentation : [Wiki](https://github.com/votre-username/capco-api/wiki)

---

<div align="center">
  <p>Développé avec ❤️ pour les cabinets d'avocats modernes</p>
  <p>
    <a href="https://nestjs.com/">NestJS</a> •
    <a href="https://www.typescriptlang.org/">TypeScript</a> •
    <a href="https://www.prisma.io/">Prisma</a> •
    <a href="https://www.postgresql.org/">PostgreSQL</a>
  </p>
</div>