import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DossierRecouvrementDB {
  id: string;
  reference: string;
  creancier_id: string | null;
  creancier_nom: string;
  creancier_telephone: string | null;
  creancier_email: string | null;
  debiteur_id: string | null;
  debiteur_nom: string;
  debiteur_telephone: string | null;
  debiteur_email: string | null;
  debiteur_adresse: string | null;
  montant_principal: number;
  penalites_interets: number | null;
  total_a_recouvrer: number;
  statut: 'EN_COURS' | 'CLOTURE';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useDossiersRecouvrement() {
  return useQuery({
    queryKey: ['dossiers-recouvrement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers_recouvrement')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DossierRecouvrementDB[];
    },
  });
}

export function useDossierRecouvrement(id: string) {
  return useQuery({
    queryKey: ['dossiers-recouvrement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers_recouvrement')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as DossierRecouvrementDB | null;
    },
    enabled: !!id,
  });
}

export function useCreateDossierRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dossier: Omit<DossierRecouvrementDB, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('dossiers_recouvrement')
        .insert(dossier)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement'] });
      toast.success('Dossier créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });
}

export function useUpdateDossierRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DossierRecouvrementDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('dossiers_recouvrement')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement', data.id] });
      toast.success('Dossier mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });
}

// Actions Recouvrement
export interface ActionRecouvrementDB {
  id: string;
  dossier_id: string;
  date: string;
  type_action: 'APPEL_TELEPHONIQUE' | 'COURRIER' | 'LETTRE_RELANCE' | 'MISE_EN_DEMEURE' | 'COMMANDEMENT_PAYER' | 'ASSIGNATION' | 'REQUETE' | 'AUDIENCE_PROCEDURE' | 'AUTRE';
  resume: string;
  prochaine_etape: string | null;
  echeance_prochaine_etape: string | null;
  piece_jointe: string | null;
  created_at: string;
  created_by: string;
}

export interface ActionRecouvrementWithDossierDB extends ActionRecouvrementDB {
  dossiers_recouvrement?: DossierRecouvrementDB;
}

export function useActionsRecouvrement(dossierId?: string) {
  return useQuery({
    queryKey: ['actions-recouvrement', dossierId],
    queryFn: async () => {
      let query = supabase
        .from('actions_recouvrement')
        .select(`
          *,
          dossiers_recouvrement (*)
        `)
        .order('date', { ascending: false });
      
      if (dossierId) {
        query = query.eq('dossier_id', dossierId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ActionRecouvrementWithDossierDB[];
    },
    enabled: dossierId ? !!dossierId : true,
  });
}

export function useCreateActionRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: Omit<ActionRecouvrementDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('actions_recouvrement')
        .insert([action])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['actions-recouvrement', data.dossier_id] });
      toast.success('Action enregistrée');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Paiements Recouvrement
export interface PaiementRecouvrementDB {
  id: string;
  dossier_id: string;
  date: string;
  montant: number;
  mode: 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';
  reference: string | null;
  commentaire: string | null;
  created_at: string;
  created_by: string;
  dossiers_recouvrement?: DossierRecouvrementDB;
}

export function usePaiementsRecouvrement(dossierId?: string) {
  return useQuery({
    queryKey: ['paiements-recouvrement', dossierId],
    queryFn: async () => {
      let query = supabase
        .from('paiements_recouvrement')
        .select(`
          *,
          dossiers_recouvrement (*)
        `)
        .order('date', { ascending: false });
      
      if (dossierId) {
        query = query.eq('dossier_id', dossierId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PaiementRecouvrementDB[];
    },
  });
}

export function useCreatePaiementRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paiement: Omit<PaiementRecouvrementDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('paiements_recouvrement')
        .insert(paiement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paiements-recouvrement', data.dossier_id] });
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement'] });
      toast.success('Paiement enregistré');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}
