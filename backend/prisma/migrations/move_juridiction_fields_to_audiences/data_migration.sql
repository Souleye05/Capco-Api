-- Script de migration des données pour transférer juridiction, chambre et ville
-- de la table affaires vers les audiences correspondantes
-- Date: 2026-02-19

-- ATTENTION: Ce script doit être exécuté AVANT la suppression des colonnes dans affaires

-- Mise à jour des audiences avec les données des affaires correspondantes
-- Seulement si les colonnes existent dans affaires et que les audiences n'ont pas déjà ces valeurs

DO $$
BEGIN
    -- Vérifier si les colonnes existent dans affaires
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affaires' AND column_name = 'juridiction'
    ) THEN
        -- Mettre à jour les audiences avec les données des affaires
        UPDATE audiences 
        SET 
            juridiction = COALESCE(audiences.juridiction, affaires.juridiction),
            chambre = COALESCE(audiences.chambre, affaires.chambre),
            ville = COALESCE(audiences.ville, affaires.ville)
        FROM affaires 
        WHERE audiences.affaire_id = affaires.id
        AND (
            audiences.juridiction IS NULL OR audiences.juridiction = '' OR
            audiences.chambre IS NULL OR audiences.chambre = '' OR
            audiences.ville IS NULL OR audiences.ville = ''
        );
        
        RAISE NOTICE 'Migration des données juridiction/chambre/ville terminée';
    ELSE
        RAISE NOTICE 'Les colonnes juridiction/chambre/ville n''existent pas dans affaires, aucune migration nécessaire';
    END IF;
END $$;