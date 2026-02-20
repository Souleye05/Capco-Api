import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
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
      try {
        // Pour l'instant, retourner un tableau vide
        // L'API d'alertes sera implémentée plus tard
        return [] as AlerteDB[];
      } catch (error) {
        console.error('Erreur lors du chargement des alertes:', error);
        return [] as AlerteDB[];
      }
    },
  });
}

export function useAlertesNonLues() {
  return useQuery({
    queryKey: ['alertes', 'non-lues'],
    queryFn: async () => {
      try {
        // Pour l'instant, retourner un tableau vide
        // L'API d'alertes sera implémentée plus tard
        return [] as AlerteDB[];
      } catch (error) {
        console.error('Erreur lors du chargement des alertes non lues:', error);
        return [] as AlerteDB[];
      }
    },
  });
}

export function useMarkAlerteAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Pour l'instant, simuler la mise à jour
      // L'API d'alertes sera implémentée plus tard
      return { id, lu: true };
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
      // Pour l'instant, simuler la création
      // L'API d'alertes sera implémentée plus tard
      return {
        ...alerte,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        lu: false
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertes'] });
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}
