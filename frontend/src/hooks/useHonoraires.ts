import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

export interface HonoraireDB {
  id: string;
  affaireId: string;
  affaire: {
    id: string;
    reference: string;
    intitule: string;
    parties: Array<{
      id: string;
      nom: string;
      role: string;
    }>;
  };
  montantFacture: number;
  montantEncaisse: number;
  montantRestant: number;
  dateFacturation?: string;
  notes?: string;
  paiements: Array<{
    id: string;
    date: string;
    montant: number;
    modePaiement: string;
    notes?: string;
  }>;
  createdAt: string;
}

export interface CreateHonoraireData {
  affaireId: string;
  montantFacture: number;
  montantEncaisse?: number;
  dateFacturation?: string;
  notes?: string;
}

export interface UpdateHonoraireData {
  montantFacture?: number;
  montantEncaisse?: number;
  dateFacturation?: string;
  notes?: string;
}

export interface HonorairesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  affaireId?: string;
  dateDebutFacturation?: string;
  dateFinFacturation?: string;
}

// Hook pour récupérer les honoraires avec pagination
export function useHonoraires(params?: HonorairesQueryParams) {
  return useQuery({
    queryKey: ['honoraires', params],
    queryFn: () => nestjsApi.getHonoraires(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer un honoraire spécifique
export function useHonoraire(id: string) {
  return useQuery({
    queryKey: ['honoraires', id],
    queryFn: () => nestjsApi.getHonoraire(id),
    enabled: !!id,
  });
}

// Hook pour récupérer les statistiques des honoraires
export function useHonorairesStats() {
  return useQuery({
    queryKey: ['honoraires-stats'],
    queryFn: () => nestjsApi.getHonorairesStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook pour créer un honoraire
export function useCreateHonoraire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHonoraireData) => nestjsApi.createHonoraire(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires-stats'] });
      toast.success('Honoraire créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la création de l\'honoraire');
    },
  });
}

// Hook pour mettre à jour un honoraire
export function useUpdateHonoraire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHonoraireData }) =>
      nestjsApi.updateHonoraire(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires', id] });
      queryClient.invalidateQueries({ queryKey: ['honoraires-stats'] });
      toast.success('Honoraire mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour de l\'honoraire');
    },
  });
}

// Hook pour supprimer un honoraire
export function useDeleteHonoraire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => nestjsApi.deleteHonoraire(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires-stats'] });
      toast.success('Honoraire supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la suppression de l\'honoraire');
    },
  });
}

// Hook pour récupérer les paiements d'un honoraire
export function usePaiementsHonoraires(honorairesId: string) {
  return useQuery({
    queryKey: ['paiements-honoraires', honorairesId],
    queryFn: () => nestjsApi.getPaiementsHonoraires(honorairesId),
    enabled: !!honorairesId,
  });
}

// Hook pour créer un paiement d'honoraire
export function useCreatePaiementHonoraires() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ honorairesId, data }: { honorairesId: string; data: any }) =>
      nestjsApi.createPaiementHonoraires(honorairesId, data),
    onSuccess: (_, { honorairesId }) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires', honorairesId] });
      queryClient.invalidateQueries({ queryKey: ['paiements-honoraires', honorairesId] });
      queryClient.invalidateQueries({ queryKey: ['honoraires-stats'] });
      toast.success('Paiement enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de l\'enregistrement du paiement');
    },
  });
}