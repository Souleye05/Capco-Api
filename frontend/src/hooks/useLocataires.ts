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

// Fetch all locataires
export function useLocatairesComplete() {
  return useQuery({
    queryKey: ['locataires'],
    queryFn: async () => {
      const response = await nestjsApi.getLocataires();
      // Handle paginated response - the API returns { data: [...], pagination: {...} }
      return response.data?.data as LocataireComplete[] || [];
    },
  });
}

// Fetch single locataire
export function useLocataireComplete(id: string) {
  return useQuery({
    queryKey: ['locataires', id],
    queryFn: async () => {
      const response = await nestjsApi.getLocataire(id);
      return response as LocataireComplete;
    },
    enabled: !!id,
  });
}

// Create locataire
export function useCreateLocataire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LocataireComplete>) => nestjsApi.createLocataire(data as any),
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
      return nestjsApi.updateLocataire(id, updates as any);
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
      return response as any[];
    },
    enabled: !!locataireId,
  });
}

// Delete locataire
export function useDeleteLocataire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nestjsApi.deleteLocataire(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Locataire supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    }
  });
}
