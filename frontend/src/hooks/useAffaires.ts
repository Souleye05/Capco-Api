import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

// Types adaptés à notre backend NestJS
export interface AffaireDB {
  id: string;
  reference: string;
  intitule: string;
  statut: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
  observations?: string;
  parties: Array<{
    id: string;
    nom: string;
    role: 'DEMANDEUR' | 'DEFENDEUR' | 'CONSEIL_ADVERSE';
    adresse?: string;
    telephone?: string;
    email?: string;
  }>;
  derniereAudience?: {
    id: string;
    date: string;
    type: string;
    juridiction: string;
    chambre?: string;
    ville?: string;
    statut: string;
  };
  totalHonoraires: number;
  totalDepenses: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PaginatedAffairesResponse {
  data: AffaireDB[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateAffaireData {
  intitule: string;
  parties: Array<{
    nom: string;
    role: 'DEMANDEUR' | 'DEFENDEUR' | 'CONSEIL_ADVERSE';
    adresse?: string;
    telephone?: string;
    email?: string;
  }>;
  statut?: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
  observations?: string;
}

export interface UpdateAffaireData {
  intitule?: string;
  statut?: 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
  observations?: string;
}

// Hook pour récupérer toutes les affaires
export function useAffaires(params?: {
  page?: number;
  limit?: number;
  search?: string;
  statut?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery<PaginatedAffairesResponse>({
    queryKey: ['affaires', params],
    queryFn: async (): Promise<PaginatedAffairesResponse> => {
      const response = await nestjsApi.getAffaires(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaginatedAffairesResponse; // Retourne la réponse complète avec data et pagination
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer une affaire par ID
export function useAffaire(id: string | undefined) {
  return useQuery({
    queryKey: ['affaires', id],
    queryFn: async (): Promise<AffaireDB | null> => {
      if (!id || id === 'undefined') return null;
      const response = await nestjsApi.get<AffaireDB>(`/contentieux/affaires/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    },
    enabled: !!id && id !== 'undefined',
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer une affaire
export function useCreateAffaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAffaireData): Promise<AffaireDB> => {
      const response = await nestjsApi.post<AffaireDB>('/contentieux/affaires', data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['affaires'] });
      toast.success(`Affaire ${data.reference} créée avec succès`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création de l'affaire: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour une affaire
export function useUpdateAffaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAffaireData }): Promise<AffaireDB> => {
      const response = await nestjsApi.patch<AffaireDB>(`/contentieux/affaires/${id}`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['affaires'] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.id] });
      toast.success('Affaire mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// Hook pour supprimer une affaire
export function useDeleteAffaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await nestjsApi.delete(`/contentieux/affaires/${id}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affaires'] });
      toast.success('Affaire supprimée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}

// Hook pour les statistiques des affaires
export function useAffairesStats() {
  return useQuery({
    queryKey: ['affaires', 'stats'],
    queryFn: async () => {
      const response = await nestjsApi.get<{
        total: number;
        actives: number;
        cloturees: number;
        radiees: number;
      }>('/contentieux/affaires/statistics');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}