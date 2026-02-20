import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

// Types pour les honoraires
export interface HonoraireDB {
  id: string;
  affaireId: string;
  affaire?: {
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

// Types pour les paiements d'honoraires
export interface PaiementHonoraireDB {
  id: string;
  honorairesId: string;
  date: string;
  montant: number;
  modePaiement: 'VIREMENT' | 'CASH' | 'CHEQUE' | 'WAVE' | 'OM';
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreatePaiementHonoraireData {
  honorairesId: string;
  date: string;
  montant: number;
  modePaiement: 'VIREMENT' | 'CASH' | 'CHEQUE' | 'WAVE' | 'OM';
  notes?: string;
}

// Types pour les dépenses
export interface DepenseDB {
  id: string;
  affaireId: string;
  affaire?: {
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
  typeDepense: 'FRAIS_HUISSIER' | 'FRAIS_GREFFE' | 'TIMBRES_FISCAUX' | 'FRAIS_COURRIER' | 'FRAIS_DEPLACEMENT' | 'FRAIS_EXPERTISE' | 'AUTRES';
  nature: string;
  montant: number;
  description?: string;
  justificatif?: string;
  createdAt: string;
}

export interface CreateDepenseData {
  affaireId: string;
  date: string;
  typeDepense: 'FRAIS_HUISSIER' | 'FRAIS_GREFFE' | 'TIMBRES_FISCAUX' | 'FRAIS_COURRIER' | 'FRAIS_DEPLACEMENT' | 'FRAIS_EXPERTISE' | 'AUTRES';
  nature: string;
  montant: number;
  description?: string;
  justificatif?: string;
}

// ===== HOOKS HONORAIRES =====

// Hook pour récupérer les honoraires d'une affaire
export function useHonorairesContentieux(affaireId?: string) {
  return useQuery({
    queryKey: ['honoraires', 'affaire', affaireId],
    queryFn: async (): Promise<HonoraireDB | null> => {
      if (!affaireId || affaireId === 'undefined') return null;
      const response = await nestjsApi.request<{ data: HonoraireDB[] }>(`/contentieux/honoraires?affaireId=${affaireId}`);
      if (response.error) {
        throw new Error(response.error);
      }
      // Retourner le premier honoraire trouvé (il ne devrait y en avoir qu'un par affaire)
      return response.data?.data?.[0] || null;
    },
    enabled: !!affaireId && affaireId !== 'undefined', // Only run query if affaireId is defined and not 'undefined'
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer des honoraires
export function useCreateHonorairesContentieux() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHonoraireData): Promise<HonoraireDB> => {
      const response = await nestjsApi.request<HonoraireDB>('/contentieux/honoraires', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires', 'affaire', data.affaireId] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Honoraires créés avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création des honoraires: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour des honoraires
export function useUpdateHonorairesContentieux() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHonoraireData }): Promise<HonoraireDB> => {
      const response = await nestjsApi.request<HonoraireDB>(`/contentieux/honoraires/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      queryClient.invalidateQueries({ queryKey: ['honoraires', 'affaire', data.affaireId] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Honoraires mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// ===== HOOKS PAIEMENTS HONORAIRES =====

// Hook pour récupérer les paiements d'honoraires
export function usePaiementsHonorairesContentieux(honorairesId?: string) {
  return useQuery({
    queryKey: ['paiements-honoraires', honorairesId],
    queryFn: async (): Promise<PaiementHonoraireDB[]> => {
      if (!honorairesId) return [];
      const response = await nestjsApi.request<{ data: PaiementHonoraireDB[] }>(`/contentieux/honoraires/${honorairesId}/paiements`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.data || [];
    },
    enabled: !!honorairesId, // Only run query if honorairesId is defined
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer un paiement d'honoraires
export function useCreatePaiementHonorairesContentieux() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaiementHonoraireData): Promise<PaiementHonoraireDB> => {
      const response = await nestjsApi.request<PaiementHonoraireDB>(`/contentieux/honoraires/${data.honorairesId}/paiements`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['paiements-honoraires', data.honorairesId] });
      queryClient.invalidateQueries({ queryKey: ['honoraires'] });
      toast.success('Paiement enregistré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'enregistrement du paiement: ${error.message}`);
    },
  });
}

// ===== HOOKS DÉPENSES =====

// Hook pour récupérer les dépenses d'une affaire
export function useDepensesAffaire(affaireId?: string) {
  return useQuery({
    queryKey: ['depenses', 'affaire', affaireId],
    queryFn: async (): Promise<DepenseDB[]> => {
      if (!affaireId || affaireId === 'undefined') return [];
      const response = await nestjsApi.request<{ data: DepenseDB[] }>(`/contentieux/depenses?affaireId=${affaireId}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.data || [];
    },
    enabled: !!affaireId && affaireId !== 'undefined', // Only run query if affaireId is defined and not 'undefined'
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer une dépense
export function useCreateDepenseAffaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDepenseData): Promise<DepenseDB> => {
      const response = await nestjsApi.request<DepenseDB>('/contentieux/depenses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses', 'affaire', data.affaireId] });
      queryClient.invalidateQueries({ queryKey: ['affaires', data.affaireId] });
      toast.success('Dépense enregistrée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'enregistrement de la dépense: ${error.message}`);
    },
  });
}

// Hook pour les statistiques des honoraires
export function useHonorairesStats() {
  return useQuery({
    queryKey: ['honoraires', 'stats'],
    queryFn: async () => {
      const response = await nestjsApi.request<{
        totalFacture: number;
        totalEncaisse: number;
        totalRestant: number;
        nombreHonoraires: number;
      }>('/contentieux/honoraires/statistics');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook pour les statistiques des dépenses
export function useDepensesStats() {
  return useQuery({
    queryKey: ['depenses', 'stats'],
    queryFn: async () => {
      const response = await nestjsApi.request<{
        totalMontant: number;
        nombreDepenses: number;
        parType: Array<{
          type: string;
          montant: number;
          nombre: number;
        }>;
      }>('/contentieux/depenses/statistics');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ===== ALIASES POUR COMPATIBILITÉ RECOUVREMENT =====
// Ces hooks sont des alias temporaires pour les modules pas encore implémentés

// Alias pour les honoraires de recouvrement (temporaire)
export function useCreateHonorairesRecouvrement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any): Promise<any> => {
      toast.info('Fonctionnalité en cours de développement - Module recouvrement à venir');
      throw new Error('Module recouvrement en développement');
    },
    onError: (error: Error) => {
      if (!error.message.includes('développement')) {
        toast.error(`Erreur: ${error.message}`);
      }
    },
  });
}

// Alias pour les dépenses de dossier (temporaire)
export function useCreateDepenseDossier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any): Promise<any> => {
      toast.info('Fonctionnalité en cours de développement - Module recouvrement à venir');
      throw new Error('Module recouvrement en développement');
    },
    onError: (error: Error) => {
      if (!error.message.includes('développement')) {
        toast.error(`Erreur: ${error.message}`);
      }
    },
  });
}