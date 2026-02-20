# Script PowerShell pour saisir la liste des juridictions dans la base de données
# Usage: .\seed-juridictions.ps1

$ErrorActionPreference = "Stop"

Write-Host "🌱 Script de seeding des juridictions" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis le répertoire backend/" -ForegroundColor Red
    Write-Host "   Répertoire actuel: $(Get-Location)" -ForegroundColor Red
    exit 1
}

# Vérifier que les dépendances sont installées
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Les dépendances ne sont pas installées. Installation en cours..." -ForegroundColor Yellow
    npm install
}

# Vérifier que Prisma est configuré
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ Erreur: Le fichier schema.prisma n'existe pas" -ForegroundColor Red
    exit 1
}

# Générer le client Prisma si nécessaire
Write-Host "🔧 Génération du client Prisma..." -ForegroundColor Cyan
npx prisma generate

# Vérifier la connexion à la base de données
Write-Host "🔍 Vérification de la connexion à la base de données..." -ForegroundColor Cyan
try {
    npx prisma db pull --preview-feature 2>$null | Out-Null
    Write-Host "✅ Connexion à la base de données OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Impossible de se connecter à la base de données" -ForegroundColor Red
    Write-Host "   Vérifiez votre variable DATABASE_URL dans le fichier .env" -ForegroundColor Red
    exit 1
}

# Exécuter le script de seeding
Write-Host "🚀 Exécution du script de seeding..." -ForegroundColor Cyan
npx ts-node scripts/seed-juridictions.ts

Write-Host ""
Write-Host "🎉 Seeding terminé avec succès!" -ForegroundColor Green
Write-Host "   Vous pouvez maintenant utiliser les juridictions dans l'application." -ForegroundColor Green