@echo off
REM Script pour restaurer un dump dans Docker PostgreSQL (Windows)
REM Usage: scripts\restore-database.bat [fichier_dump]

echo.
echo ========================================
echo Restauration de la base de donnees
echo ========================================
echo.

REM Vérifier qu'un fichier dump est fourni
if "%~1"=="" (
    echo [ERREUR] Veuillez specifier le fichier dump
    echo Usage: scripts\restore-database.bat dumps\capco_dump_*.dump
    exit /b 1
)

set DUMP_FILE=%~1
set CONTAINER_NAME=capco-postgres
set DB_USER=capco_user
set DB_NAME=capco_db

REM Vérifier que le fichier existe
if not exist "%DUMP_FILE%" (
    echo [ERREUR] Le fichier %DUMP_FILE% n'existe pas
    exit /b 1
)

echo Configuration:
echo   Fichier: %DUMP_FILE%
echo   Conteneur: %CONTAINER_NAME%
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.

REM Vérifier que Docker est en cours d'exécution
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas en cours d'execution
    exit /b 1
)

REM Vérifier que le conteneur existe
docker ps -a --format "{{.Names}}" | findstr /C:"%CONTAINER_NAME%" >nul
if errorlevel 1 (
    echo [ERREUR] Le conteneur %CONTAINER_NAME% n'existe pas
    echo Verifiez votre docker-compose.yml
    exit /b 1
)

REM Vérifier que le conteneur est en cours d'exécution
docker ps --format "{{.Names}}" | findstr /C:"%CONTAINER_NAME%" >nul
if errorlevel 1 (
    echo [ATTENTION] Le conteneur %CONTAINER_NAME% n'est pas en cours d'execution
    echo Demarrage du conteneur...
    docker-compose up -d postgres
    timeout /t 10 /nobreak >nul
)

echo.
echo [ATTENTION] Cette operation va remplacer toutes les donnees!
set /p confirm="Etes-vous sur de vouloir continuer? (oui/non): "

if not "%confirm%"=="oui" (
    echo [INFO] Operation annulee
    exit /b 0
)

echo.
echo [INFO] Etape 1/5: Creation d'un backup de securite...
docker exec %CONTAINER_NAME% pg_dump -U %DB_USER% %DB_NAME% > backup_avant_restore_%date:~-4%%date:~3,2%%date:~0,2%.sql
echo [OK] Backup cree

echo.
echo [INFO] Etape 2/5: Copie du dump dans le conteneur...
docker cp "%DUMP_FILE%" %CONTAINER_NAME%:/tmp/restore_file
echo [OK] Dump copie

echo.
echo [INFO] Etape 3/5: Arret de l'API...
docker-compose stop api
echo [OK] API arretee

echo.
echo [INFO] Etape 4/5: Restauration du dump...

REM Détecter le format du fichier
echo %DUMP_FILE% | findstr /C:".sql" >nul
if not errorlevel 1 (
    echo [INFO] Format SQL detecte
    docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% < "%DUMP_FILE%"
) else (
    echo [INFO] Format custom detecte
    docker exec %CONTAINER_NAME% pg_restore -U %DB_USER% -d %DB_NAME% --clean --if-exists --no-owner --no-privileges /tmp/restore_file
)

if errorlevel 1 (
    echo.
    echo [ERREUR] La restauration a echoue
    echo Restauration du backup...
    docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% < backup_avant_restore_%date:~-4%%date:~3,2%%date:~0,2%.sql
    exit /b 1
)

echo [OK] Dump restaure

echo.
echo [INFO] Etape 5/5: Redemarrage de l'API...
docker-compose start api
timeout /t 5 /nobreak >nul
echo [OK] API redemarree

echo.
echo [INFO] Verification...
docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "\dt"

echo.
echo ==========================================
echo [OK] Restauration terminee avec succes!
echo.
echo Prochaines etapes:
echo   1. Verifiez les logs: docker-compose logs -f api
echo   2. Testez l'API: curl http://localhost:3000/api/health
echo   3. Connectez-vous a l'application
echo.
