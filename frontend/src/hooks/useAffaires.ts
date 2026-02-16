import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AffaireDB {
  id: string;
  reference: string;
  intitule: string;
  demandeurs: any[];
  defendeurs: any[];
  juridiction: string;
  chambre: string;
  statut: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useAffaires() {
  return useQuery({
    queryKey: ['affaires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affaires')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AffaireDB[];
    },
  });
}

export function useAffaire(id: string) {
  return useQuery({
    queryKey: ['affaires', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affaires')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as AffaireDB | null;
    },
    enabled: !!id,
  });
}

export function useCreateAffaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (affaire: Omit<AffaireDB, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('affaires')
        .insert(affaire)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affaires'] });
      toast.success('Affaire créée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });
}

export function useUpdateAffaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AffaireDB> & { id: string }) => {
      const { data, error } = await supabase
        .from('affaires')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['affaires'] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.id] });
      toast.success('Affaire mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });
}
