-- Migration manuelle pour adapter les données existantes au nouveau schéma
-- Date: 2026-02-18
-- Adaptation pour préserver les données existantes

BEGIN;

-- 1. Créer les nouveaux enums s'ils n'existent pas
DO $$ BEGIN
    CREATE TYPE "RolePartie" AS ENUM ('DEMANDEUR', 'DEFENDEUR', 'CONSEIL_ADVERSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TypeAudience" AS ENUM ('MISE_EN_ETAT', 'PLAIDOIRIE', 'REFERE', 'EVOCATION', 'CONCILIATION', 'MEDIATION', 'AUTRE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Modifier la table affaires pour le nouveau schéma
-- Ajouter la colonne observations si elle n'existe pas
ALTER TABLE affaires 
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Copier notes vers observations si notes existe et observations est vide
UPDATE affaires 
SET observations = notes 
WHERE notes IS NOT NULL AND (observations IS NULL OR observations = '');

-- 3. Créer la nouvelle table parties_affaires pour remplacer les JSON
CREATE TABLE IF NOT EXISTS parties_affaires (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nom TEXT NOT NULL,
    role "RolePartie" NOT NULL,
    affaire_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (affaire_id) REFERENCES affaires(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS parties_affaires_affaire_id_idx ON parties_affaires(affaire_id);

-- 4. Migrer les données JSON des demandeurs/défendeurs vers la nouvelle table parties
-- Seulement si la table est vide pour éviter les doublons
INSERT INTO parties_affaires (nom, role, affaire_id)
SELECT 
    COALESCE(partie->>'nom', partie->>'name', 'Nom non spécifié') as nom,
    'DEMANDEUR'::"RolePartie" as role,
    id as affaire_id
FROM affaires,
LATERAL jsonb_array_elements(
    CASE 
        WHEN jsonb_typeof(demandeurs) = 'array' THEN demandeurs
        ELSE '[]'::jsonb
    END
) AS partie
WHERE jsonb_typeof(demandeurs) = 'array' 
  AND jsonb_array_length(demandeurs) > 0
  AND NOT EXISTS (SELECT 1 FROM parties_affaires WHERE affaire_id = affaires.id AND role = 'DEMANDEUR');

INSERT INTO parties_affaires (nom, role, affaire_id)
SELECT 
    COALESCE(partie->>'nom', partie->>'name', 'Nom non spécifié') as nom,
    'DEFENDEUR'::"RolePartie" as role,
    id as affaire_id
FROM affaires,
LATERAL jsonb_array_elements(
    CASE 
        WHEN jsonb_typeof(defendeurs) = 'array' THEN defendeurs
        ELSE '[]'::jsonb
    END
) AS partie
WHERE jsonb_typeof(defendeurs) = 'array' 
  AND jsonb_array_length(defendeurs) > 0
  AND NOT EXISTS (SELECT 1 FROM parties_affaires WHERE affaire_id = affaires.id AND role = 'DEFENDEUR');

-- 5. Modifier la table audiences pour ajouter les nouveaux champs
-- Ajouter ville si elle n'existe pas
ALTER TABLE audiences 
ADD COLUMN IF NOT EXISTS ville TEXT;

-- Ajouter les champs de préparation et enrôlement
ALTER TABLE audiences 
ADD COLUMN IF NOT EXISTS est_preparee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rappel_enrolement BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS date_rappel_enrolement TIMESTAMP,
ADD COLUMN IF NOT EXISTS enrolement_effectue BOOLEAN DEFAULT FALSE;

-- Ajouter updated_at si elle n'existe pas
ALTER TABLE audiences 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Renommer la colonne objet vers type si elle existe et type n'existe pas
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audiences' AND column_name = 'objet') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audiences' AND column_name = 'type') THEN
        ALTER TABLE audiences RENAME COLUMN objet TO type;
    END IF;
END $$;

-- Modifier le type de la colonne type si nécessaire
DO $$
BEGIN
    -- Vérifier si la colonne type existe et a le bon type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'audiences' AND column_name = 'type') THEN
        -- Supprimer la valeur par défaut temporairement
        ALTER TABLE audiences ALTER COLUMN type DROP DEFAULT;
        -- Changer le type vers TypeAudience
        ALTER TABLE audiences ALTER COLUMN type TYPE "TypeAudience" USING type::text::"TypeAudience";
        -- Remettre la valeur par défaut
        ALTER TABLE audiences ALTER COLUMN type SET DEFAULT 'MISE_EN_ETAT'::"TypeAudience";
    END IF;
END $$;

-- 6. Créer la table juridictions
CREATE TABLE IF NOT EXISTS juridictions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nom TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    ordre INTEGER DEFAULT 0,
    est_actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS juridictions_est_actif_ordre_idx ON juridictions(est_actif, ordre);

-- Insérer quelques juridictions par défaut
INSERT INTO juridictions (nom, code, description, ordre) VALUES
('Tribunal de Grande Instance', 'TGI', 'Tribunal de Grande Instance', 1),
('Tribunal de Commerce', 'TC', 'Tribunal de Commerce', 2),
('Cour d''Appel', 'CA', 'Cour d''Appel', 3),
('Tribunal Administratif', 'TA', 'Tribunal Administratif', 4)
ON CONFLICT (nom) DO NOTHING;

-- 7. Créer la table configuration_systeme
CREATE TABLE IF NOT EXISTS configuration_systeme (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cle TEXT UNIQUE NOT NULL,
    valeur TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Mettre à jour les contraintes et index
CREATE INDEX IF NOT EXISTS audiences_affaire_id_idx ON audiences(affaire_id);
CREATE INDEX IF NOT EXISTS audiences_date_idx ON audiences(date);
CREATE INDEX IF NOT EXISTS audiences_statut_idx ON audiences(statut);

COMMIT;

-- Afficher un résumé de la migration
SELECT 'Migration terminée avec succès' as status;
SELECT COUNT(*) as nb_affaires FROM affaires;
SELECT COUNT(*) as nb_parties FROM parties_affaires;
SELECT COUNT(*) as nb_audiences FROM audiences;
SELECT COUNT(*) as nb_juridictions FROM juridictions;