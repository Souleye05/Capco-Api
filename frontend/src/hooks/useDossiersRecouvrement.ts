import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types temporaires pour le recouvrement (en attendant l'implémentation backend)
export interface DossierRecouvrementDB {
  id: string;
  reference: string;
  creancier_id: string | null;
  creancier_nom: string;
  creancier_telephone: string | null;
  creancier_email: string | null;
  debiteur_id: string | null;
  debiteur_nom: string;
  debiteur_telephone: string | null;
  debiteur_email: string | null;
  debiteur_adresse: string | null;
  montant_principal: number;
  penalites_interets: number | null;
  total_a_recouvrer: number;
  statut: 'EN_COURS' | 'CLOTURE';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Hooks temporaires qui retournent des données vides
// Ces hooks seront remplacés quand le module recouvrement sera implémenté dans le backend

export function useDossiersRecouvrement() {
  return useQuery({
    queryKey: ['dossiers-recouvrement'],
    queryFn: async (): Promise<DossierRecouvrementDB[]> => {
      // Retourner un tableau vide en attendant l'implémentation
      return [];
    },
  });
}

export function useDossierRecouvrement(id: string) {
  return useQuery({
    queryKey: ['dossiers-recouvrement', id],
    queryFn: async (): Promise<DossierRecouvrementDB | null> => {
      // Retourner null en attendant l'implémentation
      return null;
    },
    enabled: !!id,
  });
}

export function useCreateDossierRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dossier: Omit<DossierRecouvrementDB, 'id' | 'created_at' | 'updated_at'>) => {
      // Simuler la création
      toast.info('Module recouvrement en cours de développement');
      throw new Error('Module recouvrement pas encore implémenté');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement'] });
    },
    onError: (error) => {
      // Ne pas afficher d'erreur pour l'instant
    },
  });
}

export function useUpdateDossierRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DossierRecouvrementDB> & { id: string }) => {
      toast.info('Module recouvrement en cours de développement');
      throw new Error('Module recouvrement pas encore implémenté');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-recouvrement'] });
    },
    onError: () => {
      // Ne pas afficher d'erreur pour l'instant
    },
  });
}

// Actions Recouvrement
export interface ActionRecouvrementDB {
  id: string;
  dossier_id: string;
  date: string;
  type_action: 'APPEL_TELEPHONIQUE' | 'COURRIER' | 'LETTRE_RELANCE' | 'MISE_EN_DEMEURE' | 'COMMANDEMENT_PAYER' | 'ASSIGNATION' | 'REQUETE' | 'AUDIENCE_PROCEDURE' | 'AUTRE';
  resume: string;
  prochaine_etape: string | null;
  echeance_prochaine_etape: string | null;
  piece_jointe: string | null;
  created_at: string;
  created_by: string;
}

export interface ActionRecouvrementWithDossierDB extends ActionRecouvrementDB {
  dossiers_recouvrement?: DossierRecouvrementDB;
}

export function useActionsRecouvrement(dossierId?: string) {
  return useQuery({
    queryKey: ['actions-recouvrement', dossierId],
    queryFn: async (): Promise<ActionRecouvrementWithDossierDB[]> => {
      return [];
    },
    enabled: dossierId ? !!dossierId : true,
  });
}

export function useCreateActionRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: Omit<ActionRecouvrementDB, 'id' | 'created_at'>) => {
      toast.info('Module recouvrement en cours de développement');
      throw new Error('Module recouvrement pas encore implémenté');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions-recouvrement'] });
    },
    onError: () => {
      // Ne pas afficher d'erreur pour l'instant
    },
  });
}

// Paiements Recouvrement
export interface PaiementRecouvrementDB {
  id: string;
  dossier_id: string;
  date: string;
  montant: number;
  mode: 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';
  reference: string | null;
  commentaire: string | null;
  created_at: string;
  created_by: string;
  dossiers_recouvrement?: DossierRecouvrementDB;
}

export function usePaiementsRecouvrement(dossierId?: string) {
  return useQuery({
    queryKey: ['paiements-recouvrement', dossierId],
    queryFn: async (): Promise<PaiementRecouvrementDB[]> => {
      return [];
    },
  });
}

export function useCreatePaiementRecouvrement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paiement: Omit<PaiementRecouvrementDB, 'id' | 'created_at'>) => {
      toast.info('Module recouvrement en cours de développement');
      throw new Error('Module recouvrement pas encore implémenté');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements-recouvrement'] });
    },
    onError: () => {
      // Ne pas afficher d'erreur pour l'instant
    },
  });
}
