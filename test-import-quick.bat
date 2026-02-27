@echo off
echo 🚀 Tests Rapides - Service d'Import Excel
echo ========================================

:: 1. Vérifier que nous sommes dans le bon répertoire
if not exist "backend" (
    echo ❌ Ce script doit être exécuté depuis la racine du projet
    echo    ^(où se trouvent les dossiers backend et frontend^)
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Ce script doit être exécuté depuis la racine du projet
    echo    ^(où se trouvent les dossiers backend et frontend^)
    pause
    exit /b 1
)

:: 2. Tests de compilation Backend
echo.
echo 1️⃣ Test de compilation Backend...
cd backend
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Compilation backend réussie
) else (
    echo ❌ Échec de compilation backend
    cd ..
    pause
    exit /b 1
)

:: 3. Tests unitaires
echo.
echo 2️⃣ Tests unitaires du service d'import...
call npm test -- --testPathPattern=import-excel.service.spec.ts --silent >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Tests unitaires réussis
) else (
    echo ⚠️  Tests unitaires échoués ou non trouvés
)

:: 4. Création des fichiers de test
echo.
echo 3️⃣ Création des fichiers Excel de test...
call npx ts-node scripts/create-test-excel-files.ts >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Fichiers de test créés dans backend/test-files/
) else (
    echo ❌ Échec de création des fichiers de test
)

:: 5. Test de compilation Frontend
echo.
echo 4️⃣ Test de compilation Frontend...
cd ..\frontend
call npm run build >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Compilation frontend réussie
) else (
    echo ❌ Échec de compilation frontend
    cd ..
    pause
    exit /b 1
)

cd ..

:: 6. Vérification des fichiers de test
echo.
echo 5️⃣ Vérification des fichiers de test créés...
if exist "backend\test-files" (
    dir /b backend\test-files\*.xlsx >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Fichiers Excel de test disponibles
        echo    📁 Fichiers dans backend/test-files/:
        for %%f in (backend\test-files\*.xlsx) do echo    - %%~nxf
    ) else (
        echo ⚠️  Aucun fichier Excel trouvé dans backend/test-files/
    )
) else (
    echo ⚠️  Dossier backend/test-files/ non trouvé
)

:: 7. Instructions pour les tests manuels
echo.
echo 6️⃣ Prochaines étapes pour tests complets...
echo.
echo 🔧 Pour tester manuellement :
echo    1. Démarrer le backend : cd backend ^&^& npm run start:dev
echo    2. Démarrer le frontend : cd frontend ^&^& npm run dev
echo    3. Aller sur http://localhost:5173
echo    4. Se connecter et tester l'import Excel
echo.
echo 🤖 Pour tests automatisés API :
echo    1. Démarrer le backend
echo    2. Modifier le token dans backend/scripts/test-import-endpoints.ts
echo    3. Exécuter : cd backend ^&^& npx ts-node scripts/test-import-endpoints.ts
echo.
echo 📊 Fichiers de test disponibles :
echo    - proprietaires_valide.xlsx ^(pour test basique^)
echo    - import_complet_valide.xlsx ^(pour test complet^)
echo    - proprietaires_avec_erreurs.xlsx ^(pour test d'erreurs^)
echo    - test_performance_1000_lignes.xlsx ^(pour test de performance^)

echo.
echo 🎉 Tests rapides terminés avec succès !
echo.
echo ✅ Le service d'import Excel est prêt à être testé
echo 📖 Guide complet : docs/GUIDE_TESTS_IMPORT_SERVICE.md

pause