@echo off
REM Script pour commiter tous les outils de migration
REM Usage: commit-migration-tools.bat

echo.
echo ========================================
echo Commit des outils de migration
echo ========================================
echo.

echo [INFO] Ajout des fichiers...
git add backend/scripts/
git add docs/
git add backend/.env.production
git add backend/MIGRATION_CHECKLIST.md
git add backend/dumps/README.md
git add backend/dumps/.gitignore
git add backend/package.json
git add README.md
git add .gitignore
git add GUIDE_DEPLOIEMENT_GIT_PROD.md
git add GUIDE_MIGRATION_ENSEMBLE.md
git add ETAPES_MIGRATION_MAINTENANT.md
git add RESUME_OUTILS_MIGRATION.md
git add COMMIT_ET_DEPLOYER.md
git add PRET_A_COMMITER.md
git add commit-migration-tools.bat

echo.
echo [INFO] Fichiers a commiter:
git status --short

echo.
set /p confirm="Voulez-vous continuer avec le commit? (oui/non): "

if not "%confirm%"=="oui" (
    echo [INFO] Commit annule
    exit /b 0
)

echo.
echo [INFO] Creation du commit...
git commit -m "feat: ajout des outils de migration et deploiement en production

Nouveaux outils:
- Scripts automatises de dump/restore pour Docker
- Scripts de migration complete en production  
- Documentation complete (15 guides)
- Configuration production (.env.production template)
- Checklist de migration
- Scripts NPM pour faciliter l'utilisation

Nouveaux scripts NPM:
- npm run db:dump / db:dump:win - Creer un dump
- npm run db:restore / db:restore:win - Restaurer un dump
- npm run create:admin - Creer un utilisateur admin
- npm run verify:migration - Verifier la migration
- npm run migrate:prod / migrate:prod:win - Migration complete

Documentation:
- GUIDE_DEPLOIEMENT_GIT_PROD.md - Workflow Git + Production
- GUIDE_MIGRATION_ENSEMBLE.md - Guide pas a pas
- GUIDE_DUMP_RESTORE_DOCKER.md - Guide Docker complet
- QUICK_START_PRODUCTION.md - Demarrage rapide
- Et 11 autres guides...

Mise a jour:
- README.md avec instructions de deploiement
- .gitignore pour exclure les dumps et credentials
- package.json avec nouveaux scripts"

if errorlevel 1 (
    echo.
    echo [ERREUR] Le commit a echoue
    exit /b 1
)

echo.
echo [OK] Commit cree avec succes!
echo.

set /p push="Voulez-vous pusher vers Git? (oui/non): "

if "%push%"=="oui" (
    echo.
    echo [INFO] Push vers Git...
    git push origin main
    
    if errorlevel 1 (
        echo.
        echo [ERREUR] Le push a echoue
        exit /b 1
    )
    
    echo.
    echo [OK] Push reussi!
)

echo.
echo ==========================================
echo [OK] Termine!
echo.
echo Prochaines etapes:
echo   1. Transferer le dump: scp backend/dumps/prod.zip user@serveur:/tmp/
echo   2. Sur le serveur: git pull origin main
echo   3. Sur le serveur: npm run db:restore dumps/capco_dump_*.dump
echo.
