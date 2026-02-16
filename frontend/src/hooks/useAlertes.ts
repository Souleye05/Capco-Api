import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlerteDB {
  id: string;
  type: 'AUDIENCE_NON_RENSEIGNEE' | 'DOSSIER_SANS_ACTION' | 'LOYER_IMPAYE' | 'ECHEANCE_PROCHE' | 'FACTURE_IMPAYEE';
  titre: string;
  description: string;
  lien: string | null;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  lu: boolean;
  user_id: string | null;
  created_at: string;
}

export function useAlertes() {
  return useQuery({
    queryKey: ['alertes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AlerteDB[];
    },
  });
}

export function useAlertesNonLues() {
  return useQuery({
    queryKey: ['alertes', 'non-lues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertes')
        .select('*')
        .eq('lu', false)
        .order('priorite')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AlerteDB[];
    },
  });
}

export function useMarkAlerteAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('alertes')
        .update({ lu: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertes'] });
    },
  });
}

export function useCreateAlerte() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alerte: Omit<AlerteDB, 'id' | 'created_at' | 'lu'>) => {
      const { data, error } = await supabase
        .from('alertes')
        .insert({ ...alerte, lu: false })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertes'] });
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}
