#!/bin/bash

# Script pour créer un dump de la base de données locale
# Usage: ./scripts/dump-database.sh

set -e

echo "🗄️  Création du dump de la base de données..."
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Charger les variables d'environnement
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration par défaut
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USERNAME:-postgres}"
DB_NAME="${DB_NAME:-migration_db}"
DUMP_DIR="dumps"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${DUMP_DIR}/capco_dump_${TIMESTAMP}"

# Créer le dossier dumps s'il n'existe pas
mkdir -p "$DUMP_DIR"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Output: $DUMP_FILE"
echo ""

# Demander le format
echo "Choisissez le format du dump:"
echo "  1) Custom (recommandé, compressé)"
echo "  2) SQL (lisible, non compressé)"
read -p "Votre choix (1 ou 2): " format_choice

if [ "$format_choice" = "1" ]; then
    DUMP_FILE="${DUMP_FILE}.dump"
    FORMAT="custom"
    echo ""
    echo -e "${GREEN}Création du dump au format custom...${NC}"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --verbose \
        --file="$DUMP_FILE"
else
    DUMP_FILE="${DUMP_FILE}.sql"
    FORMAT="plain"
    echo ""
    echo -e "${GREEN}Création du dump au format SQL...${NC}"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=plain \
        --verbose \
        --file="$DUMP_FILE"
fi

# Vérifier que le dump a été créé
if [ -f "$DUMP_FILE" ]; then
    FILE_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ Dump créé avec succès!${NC}"
    echo ""
    echo "📊 Informations:"
    echo "  Fichier: $DUMP_FILE"
    echo "  Taille: $FILE_SIZE"
    echo "  Format: $FORMAT"
    echo ""
    
    # Afficher le contenu (premières lignes pour SQL)
    if [ "$FORMAT" = "plain" ]; then
        echo "📄 Aperçu (premières lignes):"
        head -n 20 "$DUMP_FILE"
        echo "..."
        echo ""
    fi
    
    # Proposer de compresser
    read -p "Voulez-vous compresser le dump? (o/n): " compress_choice
    if [ "$compress_choice" = "o" ] || [ "$compress_choice" = "O" ]; then
        echo ""
        echo -e "${GREEN}Compression en cours...${NC}"
        gzip "$DUMP_FILE"
        COMPRESSED_FILE="${DUMP_FILE}.gz"
        COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo -e "${GREEN}✅ Fichier compressé: $COMPRESSED_FILE ($COMPRESSED_SIZE)${NC}"
        DUMP_FILE="$COMPRESSED_FILE"
    fi
    
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "  1. Vérifiez le dump: ls -lh $DUMP_DIR/"
    echo "  2. Transférez vers production: scp $DUMP_FILE user@serveur:/tmp/"
    echo "  3. Restaurez: npm run db:restore $DUMP_FILE"
    echo ""
else
    echo -e "${RED}❌ Erreur: Le dump n'a pas été créé${NC}"
    exit 1
fi
