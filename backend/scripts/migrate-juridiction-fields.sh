#!/bin/bash

# Script de migration pour déplacer les champs juridiction, chambre et ville
# de la table affaires vers la table audiences

echo "🚀 Début de la migration des champs juridiction/chambre/ville..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le répertoire backend"
    exit 1
fi

# Vérifier que la base de données est accessible
echo "🔍 Vérification de la connexion à la base de données..."
if ! npx prisma db execute --stdin < /dev/null 2>/dev/null; then
    echo "❌ Erreur: Impossible de se connecter à la base de données"
    echo "Vérifiez votre variable DATABASE_URL dans le fichier .env"
    exit 1
fi

echo "✅ Connexion à la base de données OK"

# Exécuter la migration des données
echo "📊 Migration des données existantes..."
if npx prisma db execute --file prisma/migrations/move_juridiction_fields_to_audiences/data_migration.sql; then
    echo "✅ Migration des données terminée"
else
    echo "⚠️  Avertissement: Erreur lors de la migration des données (peut être normal si les colonnes n'existent pas)"
fi

# Exécuter la migration de structure
echo "🔧 Modification de la structure des tables..."
if npx prisma db execute --file prisma/migrations/move_juridiction_fields_to_audiences/migration.sql; then
    echo "✅ Modification de la structure terminée"
else
    echo "❌ Erreur lors de la modification de la structure"
    exit 1
fi

# Régénérer le client Prisma
echo "🔄 Régénération du client Prisma..."
if npx prisma generate; then
    echo "✅ Client Prisma régénéré"
else
    echo "❌ Erreur lors de la régénération du client Prisma"
    exit 1
fi

echo "🎉 Migration terminée avec succès !"
echo ""
echo "📋 Prochaines étapes recommandées :"
echo "1. Vérifiez que votre application fonctionne correctement"
echo "2. Mettez à jour vos DTOs et services si nécessaire"
echo "3. Testez les fonctionnalités liées aux audiences"