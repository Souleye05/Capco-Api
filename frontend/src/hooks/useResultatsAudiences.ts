import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';
import type { TypeResultatAudience } from '@/types/api';

export interface ResultatAudience {
  id: string;
  audienceId: string;
  type: TypeResultatAudience;
  nouvelleDate?: string;
  motifRenvoi?: string;
  motifRadiation?: string;
  texteDelibere?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateResultatAudienceData {
  type: TypeResultatAudience;
  nouvelleDate?: string;
  motifRenvoi?: string;
  motifRadiation?: string;
  texteDelibere?: string;
}

// Hook pour récupérer le résultat d'une audience
export function useResultatAudience(audienceId: string | undefined) {
  return useQuery({
    queryKey: ['resultats-audiences', audienceId],
    queryFn: async (): Promise<ResultatAudience | null> => {
      if (!audienceId) return null;
      
      const response = await nestjsApi.get<ResultatAudience>(`/contentieux/audiences/${audienceId}/resultat`);
      
      if (response.error) {
        // Si c'est une erreur 404, c'est normal (pas de résultat)
        if (response.statusCode === 404) {
          return null;
        }
        throw new Error(response.error);
      }
      
      return response.data || null;
    },
    enabled: !!audienceId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer un résultat d'audience
export function useCreateResultatAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ audienceId, data }: { audienceId: string; data: CreateResultatAudienceData }): Promise<ResultatAudience> => {
      const response = await nestjsApi.post<ResultatAudience>(`/contentieux/audiences/${audienceId}/resultat`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resultats-audiences', data.audienceId] });
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.invalidateQueries({ queryKey: ['audiences', data.audienceId] });
      toast.success('Résultat d\'audience enregistré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'enregistrement: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour un résultat d'audience
export function useUpdateResultatAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ audienceId, data }: { audienceId: string; data: Partial<CreateResultatAudienceData> }): Promise<ResultatAudience> => {
      const response = await nestjsApi.patch<ResultatAudience>(`/contentieux/audiences/${audienceId}/resultat`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resultats-audiences', data.audienceId] });
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.invalidateQueries({ queryKey: ['audiences', data.audienceId] });
      toast.success('Résultat d\'audience mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// Hook pour supprimer un résultat d'audience
export function useDeleteResultatAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (audienceId: string): Promise<void> => {
      const response = await nestjsApi.delete(`/contentieux/audiences/${audienceId}/resultat`);
      
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: (_, audienceId) => {
      queryClient.invalidateQueries({ queryKey: ['resultats-audiences', audienceId] });
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.invalidateQueries({ queryKey: ['audiences', audienceId] });
      toast.success('Résultat d\'audience supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}