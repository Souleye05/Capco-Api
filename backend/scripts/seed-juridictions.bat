@echo off
REM Script batch pour saisir la liste des juridictions dans la base de données
REM Usage: seed-juridictions.bat

echo 🌱 Script de seeding des juridictions
echo ======================================

REM Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: Ce script doit être exécuté depuis le répertoire backend/
    echo    Répertoire actuel: %CD%
    exit /b 1
)

REM Vérifier que les dépendances sont installées
if not exist "node_modules" (
    echo ⚠️  Les dépendances ne sont pas installées. Installation en cours...
    call npm install
)

REM Vérifier que Prisma est configuré
if not exist "prisma\schema.prisma" (
    echo ❌ Erreur: Le fichier schema.prisma n'existe pas
    exit /b 1
)

REM Générer le client Prisma si nécessaire
echo 🔧 Génération du client Prisma...
call npx prisma generate

REM Vérifier la connexion à la base de données
echo 🔍 Vérification de la connexion à la base de données...
call npx prisma db pull --preview-feature >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Impossible de se connecter à la base de données
    echo    Vérifiez votre variable DATABASE_URL dans le fichier .env
    exit /b 1
)

echo ✅ Connexion à la base de données OK

REM Exécuter le script de seeding
echo 🚀 Exécution du script de seeding...
call npx ts-node scripts/seed-juridictions.ts

echo.
echo 🎉 Seeding terminé avec succès!
echo    Vous pouvez maintenant utiliser les juridictions dans l'application.

pause