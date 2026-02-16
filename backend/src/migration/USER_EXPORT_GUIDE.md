# Guide d'Export des Utilisateurs Supabase

Ce guide vous explique comment exporter tous les utilisateurs depuis votre instance Supabase vers votre système NestJS.

## 🚀 Options d'Export

### Option 1: Export Complet avec Sauvegarde (Recommandé)

```bash
cd backend
npx ts-node src/migration/demo/user-export-demo.ts
```

**Avantages:**
- Export complet avec statistiques détaillées
- Sauvegarde automatique dans des fichiers JSON
- Export des rôles et profils utilisateur (si disponibles)
- Masquage des données sensibles
- Rapport détaillé dans la console

### Option 2: Export Rapide pour Tests

```bash
cd backend
npx ts-node src/migration/demo/quick-user-export.ts
```

**Avantages:**
- Plus rapide, utilise les services existants
- Parfait pour tester la connexion Supabase
- Affichage console uniquement

## 📋 Prérequis

### 1. Variables d'Environnement

Assurez-vous que votre fichier `backend/.env` contient :

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration (pour NestJS)
DATABASE_URL="postgresql://username:password@localhost:5432/your_db"
```

### 2. Clé de Service Supabase

La `SUPABASE_SERVICE_ROLE_KEY` doit avoir les permissions suivantes :
- ✅ Lecture des utilisateurs (`auth.users`)
- ✅ Accès aux tables personnalisées (`user_roles`, `profiles`)
- ✅ Permissions d'administration

**Comment obtenir la clé :**
1. Allez dans votre dashboard Supabase
2. Settings → API
3. Copiez la "service_role" key (pas la "anon" key)

## 📁 Fichiers Générés

L'export complet génère les fichiers suivants dans `backend/migration-exports/` :

```
migration-exports/
├── users-export-2026-02-13T10-30-00-000Z.json      # Utilisateurs principaux
├── user-roles-export-2026-02-13T10-30-00-000Z.json # Rôles (si disponibles)
└── user-profiles-export-2026-02-13T10-30-00-000Z.json # Profils (si disponibles)
```

### Structure du Fichier Users

```json
{
  "metadata": {
    "exportDate": "2026-02-13T10:30:00.000Z",
    "totalUsers": 150,
    "supabaseUrl": "https://your-project.supabase.co",
    "statistics": {
      "confirmedUsers": 145,
      "usersWithLastSignIn": 120,
      "usersWithPhone": 30,
      "usersWithMetadata": 80
    }
  },
  "users": [
    {
      "id": "uuid-here",
      "email": "user@example.com",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-02-10T15:45:00.000Z",
      "last_sign_in_at": "2024-02-12T09:20:00.000Z",
      "email_confirmed_at": "2024-01-15T10:35:00.000Z",
      "phone": "+33123456789",
      "user_metadata": "[METADATA_PRESENT]",
      "app_metadata": "[APP_METADATA_PRESENT]"
    }
  ]
}
```

## 🔧 Résolution des Problèmes

### Erreur: "Variables d'environnement manquantes"

```bash
❌ Variables d'environnement manquantes:
- SUPABASE_URL: ❌
- SUPABASE_SERVICE_ROLE_KEY: ❌
```

**Solution :** Vérifiez votre fichier `.env` et assurez-vous que les variables sont correctement définies.

### Erreur: "Invalid JWT"

```bash
❌ Erreur lors de l'export des utilisateurs: Invalid JWT
```

**Solutions :**
1. Vérifiez que vous utilisez la `service_role` key et non la `anon` key
2. Assurez-vous que la clé n'est pas expirée
3. Vérifiez que l'URL Supabase est correcte

### Erreur: "Insufficient permissions"

```bash
❌ Erreur lors de l'export des utilisateurs: Insufficient permissions
```

**Solution :** Votre clé de service n'a pas les bonnes permissions. Contactez votre administrateur Supabase.

### Aucun utilisateur trouvé

```bash
✅ 0 utilisateurs exportés avec succès
```

**Causes possibles :**
1. Votre projet Supabase n'a pas d'utilisateurs
2. Mauvaise URL de projet
3. Problème de permissions

## 📊 Statistiques Affichées

L'export affiche les statistiques suivantes :

- **Total utilisateurs** : Nombre total d'utilisateurs
- **Emails confirmés** : Utilisateurs ayant confirmé leur email
- **Avec dernière connexion** : Utilisateurs s'étant connectés au moins une fois
- **Avec téléphone** : Utilisateurs ayant un numéro de téléphone
- **Avec métadonnées** : Utilisateurs ayant des métadonnées personnalisées

## 🔄 Migration Complète

Une fois l'export réussi, vous pouvez procéder à la migration complète :

```bash
# 1. Export des utilisateurs (fait)
npx ts-node src/migration/demo/user-export-demo.ts

# 2. Migration vers NestJS (prochaine étape)
npx ts-node src/migration/demo/user-migration-demo.ts

# 3. Validation de la migration
npx ts-node src/migration/demo/checkpoint-phase3-validation.ts
```

## 🛡️ Sécurité

- Les métadonnées sensibles sont masquées dans les exports
- Les fichiers d'export contiennent uniquement les données nécessaires à la migration
- Assurez-vous de sécuriser vos fichiers d'export (ne pas les commiter dans Git)
- Supprimez les exports après migration réussie

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs détaillés dans la console
2. Consultez la documentation Supabase Auth Admin
3. Vérifiez vos permissions et configurations
4. Testez avec l'export rapide d'abord

---

**Note :** Cet export est la première étape de la migration complète des utilisateurs. Une fois l'export réussi, vous pourrez procéder à la migration effective vers votre base de données NestJS.