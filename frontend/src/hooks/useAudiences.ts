import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AudienceDB {
  id: string;
  affaire_id: string;
  date: string;
  heure: string | null;
  objet: 'MISE_EN_ETAT' | 'PLAIDOIRIE' | 'REFERE' | 'AUTRE';
  statut: 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';
  notes_preparation: string | null;
  created_at: string;
  created_by: string;
  affaires?: {
    id: string;
    reference: string;
    intitule: string;
    juridiction: string;
    chambre: string;
  };
}

export function useAudiences() {
  return useQuery({
    queryKey: ['audiences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiences')
        .select(`
          *,
          affaires (
            id,
            reference,
            intitule,
            juridiction,
            chambre
          )
        `)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as AudienceDB[];
    },
  });
}

export function useAudiencesByAffaire(affaireId: string) {
  return useQuery({
    queryKey: ['audiences', 'affaire', affaireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiences')
        .select('*')
        .eq('affaire_id', affaireId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as AudienceDB[];
    },
    enabled: !!affaireId,
  });
}

export function useCreateAudience() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (audience: Omit<AudienceDB, 'id' | 'created_at' | 'affaires'>) => {
      const { data, error } = await supabase
        .from('audiences')
        .insert(audience)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      toast.success('Audience créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });
}

export function useUpdateAudience() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AudienceDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('audiences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      toast.success('Audience mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });
}
