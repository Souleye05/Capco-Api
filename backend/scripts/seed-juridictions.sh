#!/bin/bash

# Script pour saisir la liste des juridictions dans la base de données
# Usage: ./seed-juridictions.sh

set -e  # Arrêter en cas d'erreur

echo "🌱 Script de seeding des juridictions"
echo "======================================"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le répertoire backend/"
    echo "   Répertoire actuel: $(pwd)"
    exit 1
fi

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "⚠️  Les dépendances ne sont pas installées. Installation en cours..."
    npm install
fi

# Vérifier que Prisma est configuré
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Erreur: Le fichier schema.prisma n'existe pas"
    exit 1
fi

# Générer le client Prisma si nécessaire
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Vérifier la connexion à la base de données
echo "🔍 Vérification de la connexion à la base de données..."
if ! npx prisma db pull --preview-feature > /dev/null 2>&1; then
    echo "❌ Erreur: Impossible de se connecter à la base de données"
    echo "   Vérifiez votre variable DATABASE_URL dans le fichier .env"
    exit 1
fi

echo "✅ Connexion à la base de données OK"

# Exécuter le script de seeding
echo "🚀 Exécution du script de seeding..."
npx ts-node scripts/seed-juridictions.ts

echo ""
echo "🎉 Seeding terminé avec succès!"
echo "   Vous pouvez maintenant utiliser les juridictions dans l'application."