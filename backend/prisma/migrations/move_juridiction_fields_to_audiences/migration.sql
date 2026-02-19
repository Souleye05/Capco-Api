-- Migration pour déplacer les champs juridiction, chambre et ville 
-- de la table affaires vers la table audiences
-- Date: 2026-02-19

-- Étape 1: Vérifier et supprimer les champs de la table affaires s'ils existent
-- (Ces commandes ne feront rien si les colonnes n'existent pas)

-- Supprimer les index liés aux champs dans affaires (s'ils existent)
DROP INDEX IF EXISTS "affaires_juridiction_idx";
DROP INDEX IF EXISTS "affaires_chambre_idx";

-- Supprimer les colonnes de la table affaires (si elles existent)
ALTER TABLE "affaires" DROP COLUMN IF EXISTS "juridiction";
ALTER TABLE "affaires" DROP COLUMN IF EXISTS "chambre";
ALTER TABLE "affaires" DROP COLUMN IF EXISTS "ville";

-- Étape 2: S'assurer que les champs sont présents dans la table audiences
-- (Ces commandes ne feront rien si les colonnes existent déjà)

-- Ajouter les colonnes dans audiences si elles n'existent pas
ALTER TABLE "audiences" ADD COLUMN IF NOT EXISTS "juridiction" TEXT;
ALTER TABLE "audiences" ADD COLUMN IF NOT EXISTS "chambre" TEXT;
ALTER TABLE "audiences" ADD COLUMN IF NOT EXISTS "ville" TEXT;

-- Créer les index pour optimiser les requêtes sur audiences
CREATE INDEX IF NOT EXISTS "audiences_juridiction_idx" ON "audiences"("juridiction");
CREATE INDEX IF NOT EXISTS "audiences_chambre_idx" ON "audiences"("chambre");
CREATE INDEX IF NOT EXISTS "audiences_ville_idx" ON "audiences"("ville");

-- Commentaires pour documentation
COMMENT ON COLUMN "audiences"."juridiction" IS 'Juridiction de l''audience (obligatoire)';
COMMENT ON COLUMN "audiences"."chambre" IS 'Chambre de l''audience (optionnel)';
COMMENT ON COLUMN "audiences"."ville" IS 'Ville de l''audience (optionnel)';