import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

/**
 * Types matching the NestJS backend DTOs (camelCase)
 */
export interface LocataireComplete {
  id: string;
  nom: string;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  profession?: string | null;
  lieuTravail?: string | null;
  personneContactUrgence?: string | null;
  telephoneUrgence?: string | null;
  numeroPieceIdentite?: string | null;
  typePieceIdentite?: string | null;
  nationalite?: string | null;
  dateNaissance?: string | null;
  situationFamiliale?: string | null;
  notes?: string | null;
  pieceIdentiteUrl?: string | null;
  contratUrl?: string | null;
  documents?: any;
  nombreLots: number;
  nombreBauxActifs: number;
  createdAt: string;
  lots?: any[];
  baux?: any[];
}

// Basic PaginatedResult type if not imported
interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Fetch all locataires
export function useLocatairesComplete(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['locataires', params],
    queryFn: async () => {
      const response = await nestjsApi.getLocataires(params);
      return response.data as PaginatedResult<LocataireComplete>;
    },
  });
}

// Fetch single locataire
export function useLocataireComplete(id: string) {
  return useQuery({
    queryKey: ['locataires', id],
    queryFn: async () => {
      const response = await nestjsApi.getLocataire(id);
      return response.data as LocataireComplete;
    },
    enabled: !!id,
  });
}

// Create locataire
export function useCreateLocataire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LocataireComplete>) => {
      const response = await nestjsApi.createLocataire(data as any);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Locataire créé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création: ' + error.message);
    }
  });
}

// Update locataire
export function useUpdateLocataire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LocataireComplete> & { id: string }) => {
      const response = await nestjsApi.updateLocataire(id, updates as any);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      queryClient.invalidateQueries({ queryKey: ['locataires', data.id] });
      toast.success('Locataire mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });
}

// Fetch baux for a locataire
export function useBauxByLocataire(locataireId: string) {
  return useQuery({
    queryKey: ['baux', 'locataire', locataireId],
    queryFn: async () => {
      const response = await nestjsApi.getBauxByLocataire(locataireId);
      return response.data as any[];
    },
    enabled: !!locataireId,
  });
}

// Fetch encaissements for a locataire
export function useEncaissementsByLocataire(locataireId: string) {
  return useQuery({
    queryKey: ['encaissements', 'locataire', locataireId],
    queryFn: async () => {
      try {
        const response = await nestjsApi.getEncaissementsByLocataire(locataireId);
        return response.data as any[];
      } catch (error: any) {
        console.error('Error fetching encaissements:', error);
        if (error.response?.status === 404) {
          return []; // Return empty array for not found
        }
        throw error;
      }
    },
    enabled: !!locataireId,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or validation errors
      if (error?.response?.status === 404 || error?.response?.status === 400) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Delete locataire
export function useDeleteLocataire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await nestjsApi.deleteLocataire(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Locataire supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}
