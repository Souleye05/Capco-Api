# Scripts de Migration et Maintenance

Ce dossier contient tous les scripts nécessaires pour la migration, la maintenance et l'administration de l'application CAPCO.

## 📋 Scripts de Migration en Production

### `migrate-to-production.sh` / `migrate-to-production.bat`
Script automatisé complet pour migrer vers la production.

**Usage:**
```bash
# Linux/Mac
npm run migrate:prod

# Windows
npm run migrate:prod:win
```

**Ce que fait le script:**
1. Vérifie la configuration
2. Teste la connexion à la base de données
3. Génère le client Prisma
4. Applique les migrations
5. Importe les juridictions
6. Crée l'utilisateur admin
7. Vérifie la migration

### `create-admin-user.ts`
Crée un utilisateur administrateur dans la base de données.

**Usage:**
```bash
npm run create:admin

# Avec des credentials personnalisés
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123! npm run create:admin
```

**Variables d'environnement:**
- `ADMIN_EMAIL`: Email de l'admin (défaut: admin@capco.com)
- `ADMIN_PASSWORD`: Mot de passe (défaut: Admin@2026!)

### `verify-production-migration.ts`
Vérifie que la migration s'est bien déroulée.

**Usage:**
```bash
npm run verify:migration
```

**Vérifications effectuées:**
- Connexion à la base de données
- Migrations Prisma appliquées
- Comptage des enregistrements par table
- Présence des juridictions
- Présence des utilisateurs admin
- Index et contraintes

## 🌱 Scripts de Seed (Données de Référence)

### `seed-juridictions.ts`
Importe les juridictions du Sénégal dans la base de données.

**Usage:**
```bash
npm run seed:juridictions
```

**Juridictions importées:**
- Cour Suprême
- Cour d'Appel de Dakar
- Cour d'Appel de Kaolack
- Cour d'Appel de Saint-Louis
- Cour d'Appel de Ziguinchor
- Tribunaux de Grande Instance
- Tribunaux d'Instance
- Tribunaux de Commerce

## 🔄 Scripts de Migration de Données

### `migrate-juridiction-fields.ts`
Migre les champs de juridiction depuis les audiences vers la nouvelle structure.

**Usage:**
```bash
npm run migrate:juridiction-fields
```

### `import-capco-data.ts`
Importe les données depuis Supabase vers la nouvelle base de données.

**Usage:**
```bash
npm run import:capco
```

**Configuration requise:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### `quick-import.ts`
Version rapide de l'import avec moins de vérifications.

**Usage:**
```bash
npm run import:capco
```

## 🧪 Scripts de Test

### `test-audience-cron.ts`
Teste le service de rappel d'enrôlement des audiences.

**Usage:**
```bash
npm run test:audience-cron
```

### `test-api-endpoints.ts`
Teste les endpoints de l'API.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/test-api-endpoints.ts
```

### `test-audience-actions.ts`
Teste les actions sur les audiences.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/test-audience-actions.ts
```

### `test-migration-complete.ts`
Vérifie que la migration est complète.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/test-migration-complete.ts
```

## 🔍 Scripts de Vérification

### `verify-relationships.ts`
Vérifie les relations entre les tables.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/verify-relationships.ts
```

### `verify-relationships-simple.ts`
Version simplifiée de la vérification des relations.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/verify-relationships-simple.ts
```

### `verify-service-relationships.ts`
Vérifie les relations au niveau des services.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/verify-service-relationships.ts
```

### `verify-migration-success.ts`
Vérifie le succès de la migration.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/verify-migration-success.ts
```

## 🔧 Scripts de Maintenance

### `check-audiences.ts`
Vérifie l'état des audiences.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/check-audiences.ts
```

### `check-data.js`
Vérifie l'intégrité des données.

**Usage:**
```bash
node scripts/check-data.js
```

### `check-users.js`
Vérifie les utilisateurs.

**Usage:**
```bash
node scripts/check-users.js
```

## 📊 Scripts de Génération de Données de Test

### `create-test-audience.ts`
Crée une audience de test.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/create-test-audience.ts
```

### `create-test-audience-with-enrollment.ts`
Crée une audience de test avec enrôlement.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/create-test-audience-with-enrollment.ts
```

### `create-test-arrieres.ts`
Crée des arriérés de test.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/create-test-arrieres.ts
```

### `create-test-excel-files.ts`
Crée des fichiers Excel de test.

**Usage:**
```bash
ts-node -r tsconfig-paths/register scripts/create-test-excel-files.ts
```

## 🎯 Workflows Recommandés

### Migration Initiale en Production

```bash
# 1. Configurer l'environnement
cp .env.production .env.prod
# Éditer .env.prod avec vos credentials

# 2. Exécuter la migration automatique
npm run migrate:prod  # ou migrate:prod:win sous Windows

# 3. Vérifier
npm run verify:migration

# 4. Build et démarrage
npm run build:prod
npm run start:prod
```

### Ajout d'un Nouvel Administrateur

```bash
ADMIN_EMAIL=nouvel.admin@capco.com ADMIN_PASSWORD=SecurePass123! npm run create:admin
```

### Vérification Après Mise à Jour

```bash
# Appliquer les nouvelles migrations
npm run prisma:deploy

# Vérifier
npm run verify:migration

# Redémarrer l'application
pm2 restart capco-api
```

### Import de Données depuis Supabase

```bash
# Configurer les credentials Supabase dans .env
npm run import:capco

# Vérifier l'import
npm run verify:migration
```

## 🔐 Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter les fichiers .env**
   - Utilisez `.env.example` comme template
   - Ajoutez `.env*` au `.gitignore`

2. **Générer de nouveaux secrets pour la production**
   ```bash
   openssl rand -base64 32
   ```

3. **Utiliser SSL pour la base de données**
   ```
   DATABASE_URL="postgresql://...?sslmode=require"
   ```

4. **Limiter les accès à la base de données**
   - Utiliser un utilisateur dédié
   - Limiter les permissions
   - Configurer le firewall

## 📚 Documentation Associée

- [Guide de Migration en Production](../docs/GUIDE_MIGRATION_PRODUCTION.md)
- [Guide de Démarrage Rapide](../docs/QUICK_START_PRODUCTION.md)
- [Documentation de l'Infrastructure](../docs/INFRASTRUCTURE_SETUP.md)
- [Documentation de la Migration](../docs/MIGRATION_README.md)

## 🆘 Dépannage

### Script échoue avec "Cannot find module"

```bash
npm install
npm run prisma:generate
```

### Erreur de connexion à la base de données

```bash
# Vérifier les variables d'environnement
echo $DATABASE_URL

# Tester la connexion
psql "$DATABASE_URL"
```

### Migrations déjà appliquées

```bash
# Voir l'état
npx prisma migrate status

# Marquer comme appliquée
npx prisma migrate resolve --applied "migration_name"
```

## 💡 Conseils

1. **Toujours faire un backup avant une migration**
2. **Tester d'abord en staging**
3. **Vérifier les logs après chaque étape**
4. **Garder une trace des migrations appliquées**
5. **Documenter les changements de configuration**
