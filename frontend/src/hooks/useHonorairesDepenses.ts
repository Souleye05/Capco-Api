import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============ HONORAIRES RECOUVREMENT ============

export interface HonorairesRecouvrementDB {
  id: string;
  dossier_id: string;
  type: 'FORFAIT' | 'POURCENTAGE' | 'MIXTE';
  pourcentage: number | null;
  montant_prevu: number;
  montant_paye: number;
  created_at: string;
  created_by: string;
}

export function useHonorairesRecouvrement(dossierId?: string) {
  return useQuery({
    queryKey: ['honoraires-recouvrement', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('honoraires_recouvrement')
        .select('*')
        .eq('dossier_id', dossierId)
        .maybeSingle();
      
      if (error) throw error;
      return data as HonorairesRecouvrementDB | null;
    },
    enabled: !!dossierId,
  });
}

export function useCreateHonorairesRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (honoraires: Omit<HonorairesRecouvrementDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('honoraires_recouvrement')
        .insert(honoraires)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires-recouvrement', data.dossier_id] });
      toast.success('Honoraires enregistrés');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

export function useUpdateHonorairesRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HonorairesRecouvrementDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('honoraires_recouvrement')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires-recouvrement', data.dossier_id] });
      toast.success('Honoraires mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// ============ DEPENSES DOSSIER ============

export interface DepenseDossierDB {
  id: string;
  dossier_id: string;
  date: string;
  type_depense: 'FRAIS_HUISSIER' | 'FRAIS_GREFFE' | 'TIMBRES_FISCAUX' | 'FRAIS_COURRIER' | 'FRAIS_DEPLACEMENT' | 'FRAIS_EXPERTISE' | 'AUTRES';
  nature: string;
  montant: number;
  justificatif: string | null;
  created_at: string;
  created_by: string;
}

export function useDepensesDossier(dossierId?: string) {
  return useQuery({
    queryKey: ['depenses-dossier', dossierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depenses_dossier')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as DepenseDossierDB[];
    },
    enabled: !!dossierId,
  });
}

export function useCreateDepenseDossier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (depense: Omit<DepenseDossierDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('depenses_dossier')
        .insert(depense)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['depenses-dossier', data.dossier_id] });
      toast.success('Dépense enregistrée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// ============ HONORAIRES CONTENTIEUX ============

export interface HonorairesContentieuxDB {
  id: string;
  affaire_id: string;
  montant_facture: number;
  montant_encaisse: number;
  date_facturation: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
}

export function useHonorairesContentieux(affaireId?: string) {
  return useQuery({
    queryKey: ['honoraires-contentieux', affaireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('honoraires_contentieux')
        .select('*')
        .eq('affaire_id', affaireId)
        .maybeSingle();
      
      if (error) throw error;
      return data as HonorairesContentieuxDB | null;
    },
    enabled: !!affaireId,
  });
}

export function useCreateHonorairesContentieux() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (honoraires: Omit<HonorairesContentieuxDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('honoraires_contentieux')
        .insert(honoraires)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires-contentieux', data.affaire_id] });
      toast.success('Honoraires enregistrés');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

export function useUpdateHonorairesContentieux() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HonorairesContentieuxDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('honoraires_contentieux')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires-contentieux', data.affaire_id] });
      toast.success('Honoraires mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// ============ DEPENSES AFFAIRES (CONTENTIEUX) ============

export interface DepenseAffaireDB {
  id: string;
  affaire_id: string;
  date: string;
  type_depense: 'FRAIS_HUISSIER' | 'FRAIS_GREFFE' | 'TIMBRES_FISCAUX' | 'FRAIS_COURRIER' | 'FRAIS_DEPLACEMENT' | 'FRAIS_EXPERTISE' | 'AUTRES';
  nature: string;
  montant: number;
  description: string | null;
  justificatif: string | null;
  created_at: string;
  created_by: string;
}

export function useDepensesAffaire(affaireId?: string) {
  return useQuery({
    queryKey: ['depenses-affaire', affaireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depenses_affaires')
        .select('*')
        .eq('affaire_id', affaireId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as DepenseAffaireDB[];
    },
    enabled: !!affaireId,
  });
}

export function useCreateDepenseAffaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (depense: Omit<DepenseAffaireDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('depenses_affaires')
        .insert(depense)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['depenses-affaire', data.affaire_id] });
      toast.success('Dépense enregistrée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// ============ PAIEMENTS HONORAIRES CONTENTIEUX ============

export interface PaiementHonorairesContentieuxDB {
  id: string;
  honoraires_id: string;
  date: string;
  montant: number;
  mode_paiement: 'VIREMENT' | 'CASH' | 'CHEQUE' | 'WAVE' | 'OM';
  notes: string | null;
  created_at: string;
  created_by: string;
}

export function usePaiementsHonorairesContentieux(honorairesId?: string) {
  return useQuery({
    queryKey: ['paiements-honoraires-contentieux', honorairesId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paiements_honoraires_contentieux')
        .select('*')
        .eq('honoraires_id', honorairesId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as PaiementHonorairesContentieuxDB[];
    },
    enabled: !!honorairesId,
  });
}

export function useCreatePaiementHonorairesContentieux() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paiement: Omit<PaiementHonorairesContentieuxDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('paiements_honoraires_contentieux')
        .insert(paiement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paiements-honoraires-contentieux', data.honoraires_id] });
      queryClient.invalidateQueries({ queryKey: ['honoraires-contentieux'] });
      toast.success('Paiement enregistré');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}
