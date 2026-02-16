-- Add additional fields to locataires table for comprehensive tenant information
ALTER TABLE public.locataires
ADD COLUMN IF NOT EXISTS adresse TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS lieu_travail TEXT,
ADD COLUMN IF NOT EXISTS personne_contact_urgence TEXT,
ADD COLUMN IF NOT EXISTS telephone_urgence TEXT,
ADD COLUMN IF NOT EXISTS numero_piece_identite TEXT,
ADD COLUMN IF NOT EXISTS type_piece_identite TEXT,
ADD COLUMN IF NOT EXISTS nationalite TEXT,
ADD COLUMN IF NOT EXISTS date_naissance DATE,
ADD COLUMN IF NOT EXISTS situation_familiale TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a junction table to link locataires with dossiers_recouvrement
CREATE TABLE IF NOT EXISTS public.locataires_dossiers_recouvrement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locataire_id UUID NOT NULL REFERENCES public.locataires(id) ON DELETE CASCADE,
  dossier_id UUID NOT NULL REFERENCES public.dossiers_recouvrement(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(locataire_id, dossier_id)
);

-- Enable RLS on the junction table
ALTER TABLE public.locataires_dossiers_recouvrement ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the junction table
CREATE POLICY "Authenticated users can view locataires_dossiers"
ON public.locataires_dossiers_recouvrement
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create locataires_dossiers"
ON public.locataires_dossiers_recouvrement
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete locataires_dossiers"
ON public.locataires_dossiers_recouvrement
FOR DELETE
USING (auth.uid() IS NOT NULL);