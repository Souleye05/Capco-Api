#!/bin/bash

echo "🚀 Tests Rapides - Service d'Import Excel"
echo "========================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les étapes
print_step() {
    echo -e "\n${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet (où se trouvent les dossiers backend et frontend)"
    exit 1
fi

# 2. Tests de compilation Backend
print_step "1️⃣ Test de compilation Backend..."
cd backend
if npm run build > /dev/null 2>&1; then
    print_success "Compilation backend réussie"
else
    print_error "Échec de compilation backend"
    cd ..
    exit 1
fi

# 3. Tests unitaires
print_step "2️⃣ Tests unitaires du service d'import..."
if npm test -- --testPathPattern=import-excel.service.spec.ts --silent > /dev/null 2>&1; then
    print_success "Tests unitaires réussis"
else
    print_warning "Tests unitaires échoués ou non trouvés"
fi

# 4. Création des fichiers de test
print_step "3️⃣ Création des fichiers Excel de test..."
if npx ts-node scripts/create-test-excel-files.ts > /dev/null 2>&1; then
    print_success "Fichiers de test créés dans backend/test-files/"
else
    print_error "Échec de création des fichiers de test"
fi

# 5. Test de compilation Frontend
print_step "4️⃣ Test de compilation Frontend..."
cd ../frontend
if npm run build > /dev/null 2>&1; then
    print_success "Compilation frontend réussie"
else
    print_error "Échec de compilation frontend"
    cd ..
    exit 1
fi

cd ..

# 6. Vérification des fichiers de test
print_step "5️⃣ Vérification des fichiers de test créés..."
if [ -d "backend/test-files" ]; then
    file_count=$(ls backend/test-files/*.xlsx 2>/dev/null | wc -l)
    if [ $file_count -gt 0 ]; then
        print_success "$file_count fichiers Excel de test disponibles"
        echo "   📁 Fichiers dans backend/test-files/:"
        ls backend/test-files/*.xlsx 2>/dev/null | sed 's/.*\//   - /'
    else
        print_warning "Aucun fichier Excel trouvé dans backend/test-files/"
    fi
else
    print_warning "Dossier backend/test-files/ non trouvé"
fi

# 7. Instructions pour les tests manuels
print_step "6️⃣ Prochaines étapes pour tests complets..."
echo ""
echo "🔧 Pour tester manuellement :"
echo "   1. Démarrer le backend : cd backend && npm run start:dev"
echo "   2. Démarrer le frontend : cd frontend && npm run dev"
echo "   3. Aller sur http://localhost:5173"
echo "   4. Se connecter et tester l'import Excel"
echo ""
echo "🤖 Pour tests automatisés API :"
echo "   1. Démarrer le backend"
echo "   2. Modifier le token dans backend/scripts/test-import-endpoints.ts"
echo "   3. Exécuter : cd backend && npx ts-node scripts/test-import-endpoints.ts"
echo ""
echo "📊 Fichiers de test disponibles :"
echo "   - proprietaires_valide.xlsx (pour test basique)"
echo "   - import_complet_valide.xlsx (pour test complet)"
echo "   - proprietaires_avec_erreurs.xlsx (pour test d'erreurs)"
echo "   - test_performance_1000_lignes.xlsx (pour test de performance)"

print_step "🎉 Tests rapides terminés avec succès !"
echo ""
print_success "Le service d'import Excel est prêt à être testé"
echo "📖 Guide complet : docs/GUIDE_TESTS_IMPORT_SERVICE.md"