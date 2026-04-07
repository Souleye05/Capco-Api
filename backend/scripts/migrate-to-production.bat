@echo off
REM Script de migration vers la production (Windows)
REM Usage: scripts\migrate-to-production.bat

echo.
echo ========================================
echo Migration vers la production - CAPCO API
echo ========================================
echo.

REM Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo [ERREUR] Ce script doit etre execute depuis le repertoire backend/
    exit /b 1
)

REM Vérifier que le fichier .env.production existe
if not exist ".env.production" (
    echo [ERREUR] Le fichier .env.production n'existe pas!
    echo    Creez-le en copiant .env.production et en le configurant.
    exit /b 1
)

echo.
echo [ATTENTION] Ce script va migrer la base de donnees de production!
echo.
set /p confirm="Avez-vous configure le fichier .env.production? (oui/non): "

if not "%confirm%"=="oui" (
    echo [ERREUR] Migration annulee. Configurez d'abord .env.production
    exit /b 1
)

echo.
echo [INFO] Etape 1/7: Chargement de la configuration...
REM Charger les variables d'environnement depuis .env.production
for /f "usebackq tokens=*" %%a in (".env.production") do (
    set "%%a"
)
echo [OK] Configuration chargee
echo.

REM Étape 2: Test de connexion
echo [INFO] Etape 2/7: Test de connexion a la base de donnees...
npx prisma db execute --stdin < nul > nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Impossible de se connecter a la base de donnees
    echo    Verifiez vos credentials dans .env.production
    exit /b 1
)
echo [OK] Connexion reussie
echo.

REM Étape 3: Génération du client Prisma
echo [INFO] Etape 3/7: Generation du client Prisma...
call npm run prisma:generate
echo [OK] Client Prisma genere
echo.

REM Étape 4: Application des migrations
echo [INFO] Etape 4/7: Application des migrations Prisma...
echo [ATTENTION] Cette etape va creer/modifier les tables en production!
set /p confirm_migrate="Continuer? (oui/non): "

if not "%confirm_migrate%"=="oui" (
    echo [ERREUR] Migration annulee
    exit /b 1
)

call npm run prisma:deploy
echo [OK] Migrations appliquees
echo.

REM Étape 5: Import des juridictions
echo [INFO] Etape 5/7: Import des juridictions...
call npm run seed:juridictions
echo [OK] Juridictions importees
echo.

REM Étape 6: Création de l'utilisateur admin
echo [INFO] Etape 6/7: Creation de l'utilisateur administrateur...
echo [ATTENTION] Email par defaut: admin@capco.com
echo [ATTENTION] Password par defaut: Admin@2026!
echo.
set /p confirm_admin="Voulez-vous creer l'utilisateur admin? (oui/non): "

if "%confirm_admin%"=="oui" (
    call ts-node -r tsconfig-paths/register scripts/create-admin-user.ts
    echo [OK] Utilisateur admin cree
) else (
    echo [ATTENTION] Utilisateur admin non cree. Vous devrez le creer manuellement.
)
echo.

REM Étape 7: Vérification
echo [INFO] Etape 7/7: Verification de la migration...
call ts-node -r tsconfig-paths/register scripts/verify-production-migration.ts
echo.

REM Résumé
echo ==========================================
echo.
echo [OK] Migration terminee avec succes!
echo.
echo Prochaines etapes:
echo    1. Verifiez les logs ci-dessus
echo    2. Testez la connexion a l'API
echo    3. Connectez-vous avec les credentials admin
echo    4. Changez le mot de passe admin
echo.
echo Pour demarrer l'application:
echo    npm run build:prod
echo    npm run start:prod
echo.
