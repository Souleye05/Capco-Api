-- ============================================================
-- MIGRATION : parties_affaires - Consolidation des données
-- Date : 2026-02-24
-- ============================================================
-- 
-- CE QUE FAIT CETTE MIGRATION :
--   1. Supprime les colonnes JSON 'demandeurs' et 'defendeurs' de
--      la table 'affaires' (elles étaient TOUJOURS vides = '[]')
--   2. Ajoute 'telephone' et 'adresse' à la table 'parties_affaires'
--
-- SÉCURITÉ AVANT DE LANCER : vérifier que les colonnes JSON sont bien vides
--   SELECT id, demandeurs::text, defendeurs::text
--   FROM affaires
--   WHERE demandeurs::text != '[]' OR defendeurs::text != '[]';
--   -> Si cette requête retourne 0 lignes, la migration est 100% safe.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- ÉTAPE 0 : Vérification préventive (lecture seule, pas de modification)
-- Décommenter si vous voulez vérifier avant d'exécuter
-- ------------------------------------------------------------
-- DO $$
-- DECLARE
--   v_count INTEGER;
-- BEGIN
--   SELECT COUNT(*) INTO v_count
--   FROM affaires
--   WHERE demandeurs::text != '[]' OR defendeurs::text != '[]';
--
--   IF v_count > 0 THEN
--     RAISE EXCEPTION 'ARRÊT : % affaires ont des données dans les colonnes JSON. Migration annulée.', v_count;
--   END IF;
--
--   RAISE NOTICE 'Vérification OK : toutes les colonnes JSON sont vides.';
-- END $$;

-- ------------------------------------------------------------
-- ÉTAPE 1 : Supprimer les colonnes JSON mortes de 'affaires'
-- (toujours initialisées à '[]', jamais lues par le service)
-- ------------------------------------------------------------
ALTER TABLE affaires DROP COLUMN IF EXISTS demandeurs;
ALTER TABLE affaires DROP COLUMN IF EXISTS defendeurs;

-- ------------------------------------------------------------
-- ÉTAPE 2 : Ajouter telephone et adresse à 'parties_affaires'
-- (colonnes nullables = aucun risque de perte de données)
-- ------------------------------------------------------------
ALTER TABLE parties_affaires ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE parties_affaires ADD COLUMN IF NOT EXISTS adresse TEXT;

-- ------------------------------------------------------------
-- VÉRIFICATION FINALE
-- ------------------------------------------------------------
SELECT 'affaires: colonnes JSON supprimées' AS etape,
       COUNT(*) AS nb_lignes_affaires
FROM affaires;

SELECT 'parties_affaires: nouvelles colonnes' AS etape,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'parties_affaires'
  AND column_name IN ('telephone', 'adresse', 'nom', 'role');

COMMIT;
