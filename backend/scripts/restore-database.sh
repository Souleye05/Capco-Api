#!/bin/bash

# Script pour restaurer un dump dans Docker PostgreSQL
# Usage: ./scripts/restore-database.sh [fichier_dump]

set -e

echo "🔄 Restauration de la base de données..."
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier qu'un fichier dump est fourni
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erreur: Veuillez spécifier le fichier dump${NC}"
    echo "Usage: ./scripts/restore-database.sh dumps/capco_dump_*.dump"
    exit 1
fi

DUMP_FILE="$1"
CONTAINER_NAME="capco-postgres"
DB_USER="capco_user"
DB_NAME="capco_db"

# Vérifier que le fichier existe
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}❌ Erreur: Le fichier $DUMP_FILE n'existe pas${NC}"
    exit 1
fi

# Décompresser si nécessaire
if [[ "$DUMP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}📦 Décompression du fichier...${NC}"
    gunzip -k "$DUMP_FILE"
    DUMP_FILE="${DUMP_FILE%.gz}"
    echo -e "${GREEN}✅ Fichier décompressé${NC}"
    echo ""
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  Fichier: $DUMP_FILE"
echo "  Conteneur: $CONTAINER_NAME"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Vérifier que Docker est en cours d'exécution
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Erreur: Docker n'est pas en cours d'exécution${NC}"
    exit 1
fi

# Vérifier que le conteneur existe
if ! docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Erreur: Le conteneur $CONTAINER_NAME n'existe pas${NC}"
    echo "Vérifiez votre docker-compose.yml"
    exit 1
fi

# Vérifier que le conteneur est en cours d'exécution
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}⚠️  Le conteneur $CONTAINER_NAME n'est pas en cours d'exécution${NC}"
    echo "Démarrage du conteneur..."
    docker-compose up -d postgres
    sleep 10
fi

echo ""
echo -e "${RED}⚠️  ATTENTION: Cette opération va remplacer toutes les données!${NC}"
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo -e "${YELLOW}ℹ️  Opération annulée${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Étape 1/5: Création d'un backup de sécurité...${NC}"
BACKUP_FILE="backup_avant_restore_$(date +%Y%m%d_%H%M%S).sql"
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"

echo ""
echo -e "${GREEN}Étape 2/5: Copie du dump dans le conteneur...${NC}"
docker cp "$DUMP_FILE" "${CONTAINER_NAME}:/tmp/restore_file"
echo -e "${GREEN}✅ Dump copié${NC}"

echo ""
echo -e "${GREEN}Étape 3/5: Arrêt de l'API...${NC}"
docker-compose stop api || true
echo -e "${GREEN}✅ API arrêtée${NC}"

echo ""
echo -e "${GREEN}Étape 4/5: Restauration du dump...${NC}"

# Détecter le format du fichier
if [[ "$DUMP_FILE" == *.sql ]]; then
    echo "Format SQL détecté"
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$DUMP_FILE"
else
    echo "Format custom détecté"
    docker exec "$CONTAINER_NAME" pg_restore \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        /tmp/restore_file
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dump restauré${NC}"
else
    echo -e "${RED}❌ Erreur lors de la restauration${NC}"
    echo "Restauration du backup..."
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
    exit 1
fi

echo ""
echo -e "${GREEN}Étape 5/5: Redémarrage de l'API...${NC}"
docker-compose start api
sleep 5
echo -e "${GREEN}✅ API redémarrée${NC}"

echo ""
echo -e "${GREEN}Vérification...${NC}"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Restauration terminée avec succès!${NC}"
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Vérifiez les logs: docker-compose logs -f api"
echo "  2. Testez l'API: curl http://localhost:3000/api/health"
echo "  3. Connectez-vous à l'application"
echo ""
echo "💾 Backup de sécurité conservé: $BACKUP_FILE"
echo ""
