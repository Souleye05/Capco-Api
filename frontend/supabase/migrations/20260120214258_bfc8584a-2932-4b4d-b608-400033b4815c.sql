-- Create storage bucket for tenant documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('locataires-documents', 'locataires-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Authenticated users can upload tenant documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'locataires-documents');

CREATE POLICY "Authenticated users can view tenant documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'locataires-documents');

CREATE POLICY "Authenticated users can update tenant documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'locataires-documents');

CREATE POLICY "Authenticated users can delete tenant documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'locataires-documents');

-- Add document fields to locataires table
ALTER TABLE public.locataires
ADD COLUMN IF NOT EXISTS piece_identite_url TEXT,
ADD COLUMN IF NOT EXISTS contrat_url TEXT,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;