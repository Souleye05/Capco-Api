import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

// Types adaptés à notre backend NestJS
export interface AudienceDB {
  id: string;
  affaireId: string;
  affaire?: {
    id: string;
    reference: string;
    intitule: string;
    statut?: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
    parties: Array<{
      id: string;
      nom: string;
      role: 'DEMANDEUR' | 'DEFENDEUR' | 'CONSEIL_ADVERSE';
    }>;
  };
  date: string;
  heure?: string;
  type: 'MISE_EN_ETAT' | 'PLAIDOIRIE' | 'REFERE' | 'EVOCATION' | 'CONCILIATION' | 'MEDIATION' | 'AUTRE';
  juridiction: string;
  chambre?: string;
  ville?: string;
  statut: 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';
  notesPreparation?: string;
  estPrepare: boolean;
  rappelEnrolement?: boolean;
  dateRappelEnrolement?: string;
  enrolementEffectue?: boolean;
  resultat?: {
    id: string;
    type: 'RENVOI' | 'RADIATION' | 'DELIBERE';
    nouvelleDate?: string;
    motifRenvoi?: string;
    motifRadiation?: string;
    texteDelibere?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateAudienceData {
  affaireId: string;
  date: string;
  heure?: string;
  type?: 'MISE_EN_ETAT' | 'PLAIDOIRIE' | 'REFERE' | 'EVOCATION' | 'CONCILIATION' | 'MEDIATION' | 'AUTRE';
  juridiction: string;
  chambre?: string;
  ville?: string;
  statut?: 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';
  notesPreparation?: string;
  estPrepare?: boolean;
  rappelEnrolement?: boolean;
}

export interface UpdateAudienceData {
  date?: string;
  heure?: string;
  type?: 'MISE_EN_ETAT' | 'PLAIDOIRIE' | 'REFERE' | 'EVOCATION' | 'CONCILIATION' | 'MEDIATION' | 'AUTRE';
  juridiction?: string;
  chambre?: string;
  ville?: string;
  statut?: 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';
  notesPreparation?: string;
  estPrepare?: boolean;
}

export interface CreateResultatAudienceData {
  type: 'RENVOI' | 'RADIATION' | 'DELIBERE';
  nouvelleDate?: string;
  motifRenvoi?: string;
  motifRadiation?: string;
  texteDelibere?: string;
}

// Hook pour récupérer toutes les audiences
export function useAudiences() {
  return useQuery({
    queryKey: ['audiences'],
    queryFn: async () => {
      const response = await nestjsApi.getAudiences();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.data || []; // Retourne directement le tableau d'audiences
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer les audiences d'une affaire
export function useAudiencesByAffaire(affaireId: string | undefined) {
  return useQuery({
    queryKey: ['audiences', 'affaire', affaireId],
    queryFn: async () => {
      if (!affaireId || affaireId === 'undefined') return [];
      const response = await nestjsApi.getAudiences({ affaireId });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.data || [];
    },
    enabled: !!affaireId && affaireId !== 'undefined',
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour récupérer une audience par ID
export function useAudience(id: string) {
  return useQuery({
    queryKey: ['audiences', id],
    queryFn: async (): Promise<AudienceDB | null> => {
      if (!id) return null;
      const response = await nestjsApi.get<AudienceDB>(`/contentieux/audiences/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer une audience
export function useCreateAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAudienceData): Promise<AudienceDB> => {
      const response = await nestjsApi.post<AudienceDB>('/contentieux/audiences', data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.invalidateQueries({ queryKey: ['audiences', 'affaire', data.affaireId] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Audience créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création de l'audience: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour une audience
export function useUpdateAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAudienceData }): Promise<AudienceDB> => {
      const response = await nestjsApi.patch<AudienceDB>(`/contentieux/audiences/${id}`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.invalidateQueries({ queryKey: ['audiences', data.id] });
      queryClient.invalidateQueries({ queryKey: ['audiences', 'affaire', data.affaireId] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Audience mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// Hook pour supprimer une audience
export function useDeleteAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await nestjsApi.delete(`/contentieux/audiences/${id}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.removeQueries({ queryKey: ['audiences', id] });
      toast.success('Audience supprimée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}

// Hook pour créer un résultat d'audience
export function useCreateResultatAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ audienceId, data }: { audienceId: string; data: CreateResultatAudienceData }) => {
      const response = await nestjsApi.post(`/contentieux/audiences/${audienceId}/resultat`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: (_, { audienceId }) => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.invalidateQueries({ queryKey: ['audiences', audienceId] });
      toast.success('Résultat d\'audience enregistré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'enregistrement du résultat: ${error.message}`);
    },
  });
}

// Hook pour marquer l'enrôlement comme effectué
export function useMarquerEnrolementEffectue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (audienceId: string): Promise<AudienceDB> => {
      const response = await nestjsApi.patch<AudienceDB>(`/contentieux/audiences/${audienceId}/enrolement`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audiences'] });
      queryClient.invalidateQueries({ queryKey: ['audiences', data.id] });
      toast.success('Enrôlement marqué comme effectué');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook pour les audiences nécessitant un rappel d'enrôlement
export function useAudiencesRappelEnrolement() {
  return useQuery({
    queryKey: ['audiences', 'rappel-enrolement'],
    queryFn: async (): Promise<AudienceDB[]> => {
      const response = await nestjsApi.get<AudienceDB[]>('/contentieux/audiences/rappel-enrolement');
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook pour les statistiques des audiences
export function useAudiencesStats() {
  return useQuery({
    queryKey: ['audiences', 'stats'],
    queryFn: async () => {
      const response = await nestjsApi.get<{
        total: number;
        aVenir: number;
        tenues: number;
        nonRenseignees: number;
      }>('/contentieux/audiences/statistics');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}