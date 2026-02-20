import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types pour les honoraires de recouvrement
export interface HonoraireRecouvrementDB {
  id: string;
  dossierId: string;
  montantPrevu: number;
  montantPaye: number;
  pourcentage?: number;
  type: 'POURCENTAGE' | 'FORFAIT';
  createdAt: string;
}

export interface CreateHonoraireRecouvrementData {
  dossierId: string;
  montantPrevu: number;
  pourcentage?: number;
  type: 'POURCENTAGE' | 'FORFAIT';
}

export interface UpdateHonoraireRecouvrementData {
  montantPrevu?: number;
  montantPaye?: number;
  pourcentage?: number;
}

// Types pour les dépenses de dossier
export interface DepenseDossierDB {
  id: string;
  dossierId: string;
  date: string;
  typeDepense: 'FRAIS_HUISSIER' | 'FRAIS_GREFFE' | 'TIMBRES_FISCAUX' | 'FRAIS_COURRIER' | 'FRAIS_DEPLACEMENT' | 'FRAIS_EXPERTISE' | 'AUTRES';
  nature: string;
  montant: number;
  justificatif?: string;
  createdAt: string;
}

export interface CreateDepenseDossierData {
  dossierId: string;
  date: string;
  typeDepense: 'FRAIS_HUISSIER' | 'FRAIS_GREFFE' | 'TIMBRES_FISCAUX' | 'FRAIS_COURRIER' | 'FRAIS_DEPLACEMENT' | 'FRAIS_EXPERTISE' | 'AUTRES';
  nature: string;
  montant: number;
  justificatif?: string;
}

// ===== HOOKS HONORAIRES RECOUVREMENT =====

// Hook pour récupérer les honoraires d'un dossier de recouvrement
export function useHonorairesRecouvrement(dossierId?: string) {
  return useQuery({
    queryKey: ['honoraires-recouvrement', dossierId],
    queryFn: async (): Promise<HonoraireRecouvrementDB | null> => {
      // Module recouvrement pas encore implémenté dans le backend
      console.log('Module recouvrement en cours de développement');
      return null;
    },
    enabled: !!dossierId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer des honoraires de recouvrement
export function useCreateHonorairesRecouvrement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHonoraireRecouvrementData): Promise<HonoraireRecouvrementDB> => {
      // Module recouvrement pas encore implémenté dans le backend
      toast.info('Fonctionnalité en cours de développement - Module recouvrement à venir');
      throw new Error('Module recouvrement en développement');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires-recouvrement'] });
      toast.success('Honoraires créés avec succès');
    },
    onError: (error: Error) => {
      if (!error.message.includes('développement')) {
        toast.error(`Erreur lors de la création des honoraires: ${error.message}`);
      }
    },
  });
}

// Hook pour mettre à jour des honoraires de recouvrement
export function useUpdateHonorairesRecouvrement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHonoraireRecouvrementData }): Promise<HonoraireRecouvrementDB> => {
      // Module recouvrement pas encore implémenté dans le backend
      toast.info('Fonctionnalité en cours de développement - Module recouvrement à venir');
      throw new Error('Module recouvrement en développement');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['honoraires-recouvrement'] });
      toast.success('Honoraires mis à jour avec succès');
    },
    onError: (error: Error) => {
      if (!error.message.includes('développement')) {
        toast.error(`Erreur lors de la mise à jour: ${error.message}`);
      }
    },
  });
}

// ===== HOOKS DÉPENSES DOSSIER =====

// Hook pour récupérer les dépenses d'un dossier de recouvrement
export function useDepensesDossier(dossierId?: string) {
  return useQuery({
    queryKey: ['depenses-dossier', dossierId],
    queryFn: async (): Promise<DepenseDossierDB[]> => {
      // Module recouvrement pas encore implémenté dans le backend
      console.log('Module recouvrement en cours de développement');
      return [];
    },
    enabled: !!dossierId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer une dépense de dossier
export function useCreateDepenseDossier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDepenseDossierData): Promise<DepenseDossierDB> => {
      // Module recouvrement pas encore implémenté dans le backend
      toast.info('Fonctionnalité en cours de développement - Module recouvrement à venir');
      throw new Error('Module recouvrement en développement');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['depenses-dossier'] });
      toast.success('Dépense enregistrée avec succès');
    },
    onError: (error: Error) => {
      if (!error.message.includes('développement')) {
        toast.error(`Erreur lors de l'enregistrement de la dépense: ${error.message}`);
      }
    },
  });
}