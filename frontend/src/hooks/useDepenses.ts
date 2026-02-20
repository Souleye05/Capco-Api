import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

export interface DepenseDB {
  id: string;
  affaireId: string;
  affaire?: {
    id: string;
    reference: string;
    intitule: string;
  };
  typeDepense: 'FRAIS_JUSTICE' | 'FRAIS_HUISSIER' | 'FRAIS_EXPERTISE' | 'FRAIS_DEPLACEMENT' | 'AUTRE';
  montant: number;
  dateDepense: string;
  description?: string;
  fournisseur?: string;
  numeroFacture?: string;
  estRembourse: boolean;
  dateRemboursement?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateDepenseData {
  affaireId: string;
  typeDepense: 'FRAIS_JUSTICE' | 'FRAIS_HUISSIER' | 'FRAIS_EXPERTISE' | 'FRAIS_DEPLACEMENT' | 'AUTRE';
  montant: number;
  dateDepense: string;
  description?: string;
  fournisseur?: string;
  numeroFacture?: string;
}

export interface UpdateDepenseData {
  typeDepense?: 'FRAIS_JUSTICE' | 'FRAIS_HUISSIER' | 'FRAIS_EXPERTISE' | 'FRAIS_DEPLACEMENT' | 'AUTRE';
  montant?: number;
  dateDepense?: string;
  description?: string;
  fournisseur?: string;
  numeroFacture?: string;
  estRembourse?: boolean;
  dateRemboursement?: string;
}

// Hook pour récupérer toutes les dépenses
export function useDepenses(params?: {
  affaireId?: string;
  typeDepense?: string;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
}) {
  return useQuery({
    queryKey: ['depenses', params],
    queryFn: async () => {
      const response = await nestjsApi.getDepenses(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour récupérer une dépense par ID
export function useDepense(id: string) {
  return useQuery({
    queryKey: ['depenses', id],
    queryFn: async (): Promise<DepenseDB | null> => {
      if (!id) return null;
      const response = await nestjsApi.getDepense(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer une dépense
export function useCreateDepense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDepenseData): Promise<DepenseDB> => {
      const response = await nestjsApi.createDepense(data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Dépense créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création de la dépense: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour une dépense
export function useUpdateDepense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDepenseData }): Promise<DepenseDB> => {
      const response = await nestjsApi.updateDepense(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses', data.id] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Dépense mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// Hook pour supprimer une dépense
export function useDeleteDepense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await nestjsApi.deleteDepense(id);
      
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.removeQueries({ queryKey: ['depenses', id] });
      toast.success('Dépense supprimée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}

// Hook pour les statistiques des dépenses
export function useDepensesStats() {
  return useQuery({
    queryKey: ['depenses', 'stats'],
    queryFn: async () => {
      const response = await nestjsApi.getDepensesStats();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 10 * 60 * 1000,
  });
}