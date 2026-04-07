@echo off
REM Script pour créer un dump de la base de données locale (Windows)
REM Usage: scripts\dump-database.bat

echo.
echo ========================================
echo Creation du dump de la base de donnees
echo ========================================
echo.

REM Charger les variables d'environnement
if exist ".env" (
    for /f "usebackq tokens=*" %%a in (".env") do set "%%a"
)

REM Configuration par défaut
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=5432
if not defined DB_USERNAME set DB_USERNAME=postgres
if not defined DB_NAME set DB_NAME=migration_db

set DUMP_DIR=dumps
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Créer le dossier dumps
if not exist "%DUMP_DIR%" mkdir "%DUMP_DIR%"

echo Configuration:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   User: %DB_USERNAME%
echo   Database: %DB_NAME%
echo.

REM Demander le format
echo Choisissez le format du dump:
echo   1) Custom (recommande, compresse)
echo   2) SQL (lisible, non compresse)
set /p format_choice="Votre choix (1 ou 2): "

if "%format_choice%"=="1" (
    set DUMP_FILE=%DUMP_DIR%\capco_dump_%TIMESTAMP%.dump
    set FORMAT=custom
    echo.
    echo [INFO] Creation du dump au format custom...
    
    set PGPASSWORD=%DB_PASSWORD%
    pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% --format=custom --verbose --file="%DUMP_FILE%"
) else (
    set DUMP_FILE=%DUMP_DIR%\capco_dump_%TIMESTAMP%.sql
    set FORMAT=plain
    echo.
    echo [INFO] Creation du dump au format SQL...
    
    set PGPASSWORD=%DB_PASSWORD%
    pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -d %DB_NAME% --format=plain --verbose --file="%DUMP_FILE%"
)

REM Vérifier que le dump a été créé
if exist "%DUMP_FILE%" (
    echo.
    echo [OK] Dump cree avec succes!
    echo.
    echo Informations:
    echo   Fichier: %DUMP_FILE%
    echo   Format: %FORMAT%
    echo.
    
    dir "%DUMP_FILE%"
    
    echo.
    echo Prochaines etapes:
    echo   1. Verifiez le dump: dir %DUMP_DIR%
    echo   2. Transferez vers production
    echo   3. Restaurez: npm run db:restore %DUMP_FILE%
    echo.
) else (
    echo.
    echo [ERREUR] Le dump n'a pas ete cree
    exit /b 1
)
