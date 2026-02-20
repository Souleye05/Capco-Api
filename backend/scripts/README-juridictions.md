# Script de Seeding des Juridictions

Ce script permet d'insérer la liste des juridictions dans la base de données.

## Données insérées

Le script insère les 10 juridictions suivantes :

1. **Tribunal de Grande Instance** (TGI) - Ordre: 1
2. **Tribunal de Commerce** (TC) - Ordre: 2  
3. **Tribunal du Travail** (TT) - Ordre: 3
4. **Tribunal Correctionnel** (TCOR) - Ordre: 4
5. **Tribunal Administratif** (TA) - Ordre: 5
6. **Cour d'Appel** (CA) - Ordre: 6
7. **Cour de Cassation** (CC) - Ordre: 7
8. **Cour Suprême** (CS) - Ordre: 8
9. **Conseil d'État** (CE) - Ordre: 9
10. **Tribunal Judiciaire** (TJ) - Ordre: 10

## Utilisation

### Prérequis

1. Être dans le répertoire `backend/`
2. Avoir configuré la variable `DATABASE_URL` dans le fichier `.env`
3. Avoir une base de données PostgreSQL accessible

### Exécution

Choisissez la méthode selon votre environnement :

#### Linux/macOS (Bash)
```bash
cd backend
./scripts/seed-juridictions.sh
```

#### Windows (PowerShell)
```powershell
cd backend
.\scripts\seed-juridictions.ps1
```

#### Windows (Command Prompt)
```cmd
cd backend
scripts\seed-juridictions.bat
```

#### Exécution directe avec Node.js
```bash
cd backend
npx ts-node scripts/seed-juridictions.ts
```

## Fonctionnalités

- **Upsert intelligent** : Le script utilise `upsert` pour éviter les doublons
- **Gestion des erreurs** : Affichage détaillé des erreurs et gestion des cas d'échec
- **Rapport détaillé** : Affiche le nombre d'enregistrements créés, mis à jour ou ignorés
- **Vérifications** : Contrôle de la connexion DB et de la configuration Prisma
- **Sécurité** : Utilise les contraintes uniques de la base pour éviter les doublons

## Structure des données

Chaque juridiction est créée avec :
- `nom` : Nom complet de la juridiction (unique)
- `code` : Code abrégé (unique)
- `ordre` : Ordre d'affichage (1-10)
- `est_actif` : `true` par défaut
- `created_at` et `updated_at` : Timestamps automatiques

## Résolution des problèmes

### Erreur de connexion à la base
- Vérifiez la variable `DATABASE_URL` dans `.env`
- Assurez-vous que PostgreSQL est démarré
- Vérifiez les permissions de connexion

### Erreur "schema.prisma not found"
- Exécutez le script depuis le répertoire `backend/`
- Vérifiez que le fichier `prisma/schema.prisma` existe

### Erreur de dépendances
- Exécutez `npm install` dans le répertoire `backend/`
- Vérifiez que Node.js et npm sont installés

## Vérification

Après exécution, vous pouvez vérifier les données dans votre base :

```sql
SELECT nom, code, ordre, est_actif 
FROM juridictions 
WHERE est_actif = true 
ORDER BY ordre;
```

Ou via l'API NestJS :
```
GET /api/contentieux/juridictions
```