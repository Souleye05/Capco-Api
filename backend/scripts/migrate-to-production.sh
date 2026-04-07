#!/bin/bash

# Script de migration vers la production
# Usage: ./scripts/migrate-to-production.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Migration vers la production - CAPCO API"
echo "==========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Ce script doit être exécuté depuis le répertoire backend/"
    exit 1
fi

# Vérifier que le fichier .env.production existe
if [ ! -f ".env.production" ]; then
    error "Le fichier .env.production n'existe pas!"
    echo "   Créez-le en copiant .env.production.example et en le configurant."
    exit 1
fi

# Demander confirmation
echo ""
warning "ATTENTION: Ce script va migrer la base de données de production!"
echo ""
read -p "Avez-vous configuré le fichier .env.production? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    error "Migration annulée. Configurez d'abord .env.production"
    exit 1
fi

echo ""
info "Étape 1/7: Chargement de la configuration..."
export $(cat .env.production | grep -v '^#' | xargs)

if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL n'est pas défini dans .env.production"
    exit 1
fi

info "Configuration chargée ✓"
echo ""

# Étape 2: Test de connexion
info "Étape 2/7: Test de connexion à la base de données..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    info "Connexion réussie ✓"
else
    error "Impossible de se connecter à la base de données"
    echo "   Vérifiez vos credentials dans .env.production"
    exit 1
fi
echo ""

# Étape 3: Génération du client Prisma
info "Étape 3/7: Génération du client Prisma..."
npm run prisma:generate
info "Client Prisma généré ✓"
echo ""

# Étape 4: Application des migrations
info "Étape 4/7: Application des migrations Prisma..."
warning "Cette étape va créer/modifier les tables en production!"
read -p "Continuer? (oui/non): " confirm_migrate

if [ "$confirm_migrate" != "oui" ]; then
    error "Migration annulée"
    exit 1
fi

npm run prisma:deploy
info "Migrations appliquées ✓"
echo ""

# Étape 5: Import des juridictions
info "Étape 5/7: Import des juridictions..."
npm run seed:juridictions
info "Juridictions importées ✓"
echo ""

# Étape 6: Création de l'utilisateur admin
info "Étape 6/7: Création de l'utilisateur administrateur..."
warning "Email par défaut: admin@capco.com"
warning "Password par défaut: Admin@2026!"
echo ""
read -p "Voulez-vous créer l'utilisateur admin? (oui/non): " confirm_admin

if [ "$confirm_admin" = "oui" ]; then
    ts-node -r tsconfig-paths/register scripts/create-admin-user.ts
    info "Utilisateur admin créé ✓"
else
    warning "Utilisateur admin non créé. Vous devrez le créer manuellement."
fi
echo ""

# Étape 7: Vérification
info "Étape 7/7: Vérification de la migration..."
ts-node -r tsconfig-paths/register scripts/verify-production-migration.ts
echo ""

# Résumé
echo "=========================================="
echo ""
info "✅ Migration terminée avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Vérifiez les logs ci-dessus"
echo "   2. Testez la connexion à l'API"
echo "   3. Connectez-vous avec les credentials admin"
echo "   4. Changez le mot de passe admin"
echo ""
echo "🚀 Pour démarrer l'application:"
echo "   npm run build:prod"
echo "   npm run start:prod"
echo ""
