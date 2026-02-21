import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

export interface DepenseDB {
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
  date: string;
  typeDepense: string;
  nature: string;
  montant: number;
  description?: string;
  justificatif?: string;
  createdAt: string;
}

export interface CreateDepenseData {
  affaireId: string;
  date?: string;
  typeDepense: string;
  nature: string;
  montant: number;
  description?: string;
  justificatif?: string;
}

export interface UpdateDepenseData {
  date?: string;
  typeDepense?: string;
  nature?: string;
  montant?: number;
  description?: string;
  justificatif?: string;
}

export interface DepensesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  affaireId?: string;
  typeDepense?: string;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
}

// Hook pour récupérer les dépenses avec pagination
export function useDepenses(params?: DepensesQueryParams) {
  return useQuery({
    queryKey: ['depenses', params],
    queryFn: () => nestjsApi.getDepenses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer une dépense spécifique
export function useDepense(id: string) {
  return useQuery({
    queryKey: ['depenses', id],
    queryFn: () => nestjsApi.getDepense(id),
    enabled: !!id,
  });
}

// Hook pour récupérer les statistiques des dépenses
export function useDepensesStats() {
  return useQuery({
    queryKey: ['depenses-stats'],
    queryFn: () => nestjsApi.getDepensesStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook pour créer une dépense
export function useCreateDepense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepenseData) => nestjsApi.createDepense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses-stats'] });
      toast.success('Dépense créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la création de la dépense');
    },
  });
}

// Hook pour mettre à jour une dépense
export function useUpdateDepense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepenseData }) =>
      nestjsApi.updateDepense(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses', id] });
      queryClient.invalidateQueries({ queryKey: ['depenses-stats'] });
      toast.success('Dépense mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour de la dépense');
    },
  });
}

// Hook pour supprimer une dépense
export function useDeleteDepense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => nestjsApi.deleteDepense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses-stats'] });
      toast.success('Dépense supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la suppression de la dépense');
    },
  });
}

// Types de dépenses disponibles
export const TYPE_DEPENSES = [
  { value: 'FRAIS_JUSTICE', label: 'Frais de justice' },
  { value: 'FRAIS_HUISSIER', label: 'Frais d\'huissier' },
  { value: 'FRAIS_GREFFE', label: 'Frais de greffe' },
  { value: 'FRAIS_EXPERTISE', label: 'Frais d\'expertise' },
  { value: 'FRAIS_DEPLACEMENT', label: 'Frais de déplacement' },
  { value: 'FRAIS_COURRIER', label: 'Frais de courrier' },
  { value: 'TIMBRES_FISCAUX', label: 'Timbres fiscaux' },
  { value: 'AUTRES', label: 'Autres frais' },
] as const;

export type TypeDepense = typeof TYPE_DEPENSES[number]['value'];