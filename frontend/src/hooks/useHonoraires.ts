import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

export interface HonoraireDB {
  id: string;
  affaireId: string;
  affaire?: {
    id: string;
    reference: string;
    intitule: string;
  };
  montant: number;
  dateFacturation: string;
  description?: string;
  statut: 'EN_ATTENTE' | 'PAYE' | 'PARTIELLEMENT_PAYE';
  montantPaye: number;
  paiements: Array<{
    id: string;
    montant: number;
    datePaiement: string;
    modePaiement: string;
    reference?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateHonoraireData {
  affaireId: string;
  montant: number;
  dateFacturation: string;
  description?: string;
}

export interface UpdateHonoraireData {
  montant?: number;
  dateFacturation?: string;
  description?: string;
  statut?: 'EN_ATTENTE' | 'PAYE' | 'PARTIELLEMENT_PAYE';
}

export interface CreatePaiementHonoraireData {
  montant: number;
  datePaiement: string;
  modePaiement: string;
  reference?: string;
}

// Hook pour récupérer tous les honoraires
export function useHonoraires(params?: {
  affaireId?: string;
  dateDebutFacturation?: string;
  dateFinFacturation?: string;
}) {
  return useQuery({
    queryKey: ['honoraires', params],
    queryFn: async () => {
      const response = await nestjsApi.getHonoraires(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour récupérer un honoraire par ID
export function useHonoraire(id: string) {
  return useQuery({
    queryKey: ['honoraires', id],
    queryFn: async (): Promise<HonoraireDB | null> => {
      if (!id) return null;
      const response = await nestjsApi.getHonoraire(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer un honoraire
export function useCreateHonoraire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHonoraireData): Promise<HonoraireDB> => {
      const response = await nestjsApi.createHonoraire(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Honoraire créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création de l'honoraire: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour un honoraire
export function useUpdateHonoraire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHonoraireData }): Promise<HonoraireDB> => {
      const response = await nestjsApi.updateHonoraire(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires', data.id] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Honoraire mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// Hook pour supprimer un honoraire
export function useDeleteHonoraire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await nestjsApi.deleteHonoraire(id);
      
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.removeQueries({ queryKey: ['honoraires', id] });
      toast.success('Honoraire supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}

// Hook pour créer un paiement d'honoraire
export function useCreatePaiementHonoraire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ honorairesId, data }: { honorairesId: string; data: CreatePaiementHonoraireData }) => {
      const response = await nestjsApi.createPaiementHonoraires(honorairesId, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: (_, { honorairesId }) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires', honorairesId] });
      toast.success('Paiement enregistré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'enregistrement du paiement: ${error.message}`);
    },
  });
}

// Hook pour les statistiques des honoraires
export function useHonorairesStats() {
  return useQuery({
    queryKey: ['honoraires', 'stats'],
    queryFn: async () => {
      const response = await nestjsApi.getHonorairesStats();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 10 * 60 * 1000,
  });
}