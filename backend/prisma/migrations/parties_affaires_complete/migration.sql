-- Migration : Consolidation des parties dans parties_affaires
-- Date : 2026-02-24
--
-- Changements :
--   1. Supprime les colonnes JSON 'demandeurs' et 'defendeurs' de la table 'affaires'
--      (ces colonnes étaient toujours vides = '[]', les données réelles étaient
--       déjà exclusivement dans parties_affaires)
--   2. Ajoute 'telephone' et 'adresse' à la table 'parties_affaires'
--      pour stocker les coordonnées complètes par partie et par affaire

-- ---------------------------------------------------------------
-- ÉTAPE 1 : Suppression des colonnes JSON mortes dans 'affaires'
-- ---------------------------------------------------------------
ALTER TABLE "affaires" DROP COLUMN IF EXISTS "demandeurs";
ALTER TABLE "affaires" DROP COLUMN IF EXISTS "defendeurs";

-- ---------------------------------------------------------------
-- ÉTAPE 2 : Ajout de telephone et adresse dans 'parties_affaires'
-- (colonnes nullables → aucun impact sur les lignes existantes)
-- ---------------------------------------------------------------
ALTER TABLE "parties_affaires" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
ALTER TABLE "parties_affaires" ADD COLUMN IF NOT EXISTS "adresse" TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN "parties_affaires"."telephone" IS 'Numéro de téléphone de la partie dans le contexte de l''affaire';
COMMENT ON COLUMN "parties_affaires"."adresse" IS 'Adresse de la partie dans le contexte de l''affaire';
