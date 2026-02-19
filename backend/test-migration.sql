-- Test de la migration
SELECT 'Vérification des données migrées' as test;

-- Vérifier les affaires
SELECT COUNT(*) as nb_affaires FROM affaires;

-- Vérifier les parties migrées
SELECT COUNT(*) as nb_parties_affaires FROM parties_affaires;

-- Vérifier les juridictions
SELECT COUNT(*) as nb_juridictions FROM juridictions;
SELECT nom, code FROM juridictions ORDER BY ordre;

-- Vérifier les audiences avec les nouveaux champs
SELECT COUNT(*) as nb_audiences FROM audiences;
SELECT COUNT(*) as nb_audiences_avec_ville FROM audiences WHERE ville IS NOT NULL;

-- Vérifier les enums
SELECT DISTINCT type FROM audiences;

-- Vérifier la structure des parties_affaires
SELECT role, COUNT(*) as nb FROM parties_affaires GROUP BY role;