-- Create table for expenses related to litigation cases
CREATE TABLE IF NOT EXISTS public.depenses_affaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affaire_id UUID NOT NULL REFERENCES public.affaires(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type_depense TEXT NOT NULL CHECK (type_depense IN ('FRAIS_HUISSIER', 'FRAIS_GREFFE', 'TIMBRES_FISCAUX', 'FRAIS_COURRIER', 'FRAIS_DEPLACEMENT', 'FRAIS_EXPERTISE', 'AUTRES')),
  nature TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  justificatif TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create table for fee payments (honoraires) related to litigation cases
CREATE TABLE IF NOT EXISTS public.paiements_honoraires_contentieux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  honoraires_id UUID NOT NULL REFERENCES public.honoraires_contentieux(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  montant NUMERIC NOT NULL DEFAULT 0,
  mode_paiement TEXT NOT NULL CHECK (mode_paiement IN ('VIREMENT', 'CASH', 'CHEQUE', 'WAVE', 'OM')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on both tables
ALTER TABLE public.depenses_affaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements_honoraires_contentieux ENABLE ROW LEVEL SECURITY;

-- RLS policies for depenses_affaires
CREATE POLICY "Users can view all depenses_affaires" 
ON public.depenses_affaires FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Users can create depenses_affaires" 
ON public.depenses_affaires FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own depenses_affaires" 
ON public.depenses_affaires FOR UPDATE 
TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own depenses_affaires" 
ON public.depenses_affaires FOR DELETE 
TO authenticated USING (auth.uid() = created_by);

-- RLS policies for paiements_honoraires_contentieux
CREATE POLICY "Users can view all paiements_honoraires_contentieux" 
ON public.paiements_honoraires_contentieux FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Users can create paiements_honoraires_contentieux" 
ON public.paiements_honoraires_contentieux FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own paiements_honoraires_contentieux" 
ON public.paiements_honoraires_contentieux FOR UPDATE 
TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own paiements_honoraires_contentieux" 
ON public.paiements_honoraires_contentieux FOR DELETE 
TO authenticated USING (auth.uid() = created_by);

-- Add indexes for better performance
CREATE INDEX idx_depenses_affaires_affaire_id ON public.depenses_affaires(affaire_id);
CREATE INDEX idx_paiements_honoraires_contentieux_honoraires_id ON public.paiements_honoraires_contentieux(honoraires_id);