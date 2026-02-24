import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

export type StatutRecouvrement = 'EN_COURS' | 'CLOTURE';
export type TypeAction = 'APPEL_TELEPHONIQUE' | 'COURRIER' | 'LETTRE_RELANCE' | 'MISE_DEMEURE' | 'COMMANDEMENT_PAYER' | 'ASSIGNATION' | 'REQUETE' | 'AUDIENCE_PROCEDURE' | 'AUTRE';
export type ModePaiement = 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';

export interface DossierRecouvrement {
    id: string;
    reference: string;
    creancierNom: string;
    creancierTelephone?: string;
    creancierEmail?: string;
    debiteurNom: string;
    debiteurTelephone?: string;
    debiteurEmail?: string;
    debiteurAdresse?: string;
    montantPrincipal: number;
    penalitesInterets: number;
    totalARecouvrer: number;
    totalPaiements: number;
    soldeRestant: number;
    statut: StatutRecouvrement;
    notes?: string;
    nombreActions: number;
    derniereAction?: {
        id: string;
        date: string;
        typeAction: TypeAction;
        resume: string;
    };
    actions?: any[];
    paiements?: PaiementRecouvrement[];
    createdAt: string;
    updatedAt: string;
}

export interface PaiementRecouvrement {
    id: string;
    dossierId: string;
    date: string;
    montant: number;
    mode: ModePaiement;
    reference?: string;
    commentaire?: string;
    dossierReference?: string;
    creancierNom?: string;
    debiteurNom?: string;
    createdAt: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    total?: number; // Backend alternative for total count
}

export interface RecouvrementDashboardStats {
    synthese: {
        totalARecouvrer: number;
        totalRecouvre: number;
        tauxRecouvrement: number;
    };
    dossiers: {
        enCours: number;
        clotures: number;
    };
}

export interface PaiementsStatistics {
    totalMontant: number;
    nombrePaiements: number;
    dernierPaiement: string | null;
    parMode: Array<{
        mode: ModePaiement;
        montant: number;
        nombre: number;
    }>;
}

export interface CreateDossierData {
    creancierNom: string;
    creancierTelephone?: string;
    creancierEmail?: string;
    debiteurNom: string;
    debiteurTelephone?: string;
    debiteurEmail?: string;
    debiteurAdresse?: string;
    montantPrincipal: number;
    penalitesInterets?: number;
    statut?: StatutRecouvrement;
    notes?: string;
    honoraire?: {
        type?: 'FORFAIT' | 'POURCENTAGE' | 'MIXTE';
        montantPrevu?: number;
        pourcentage?: number;
    };
}

export interface CreateActionData {
    dossierId: string;
    date: string;
    typeAction: TypeAction;
    resume: string;
    prochaineEtape?: string;
    echeanceProchaineEtape?: string;
}

export interface CreatePaiementData {
    dossierId: string;
    date: string;
    montant: number;
    mode: ModePaiement;
    reference?: string;
    commentaire?: string;
}

// Hook pour la liste des dossiers
export function useDossiersRecouvrement(params?: {
    page?: number;
    limit?: number;
    search?: string;
    statut?: string;
}) {
    return useQuery<PaginatedResponse<DossierRecouvrement>>({
        queryKey: ['recouvrement', 'dossiers', params],
        queryFn: async () => {
            const response = await nestjsApi.get<PaginatedResponse<DossierRecouvrement>>('/recouvrement/dossiers', params);
            if (response.error) throw new Error(response.error);
            return response.data!;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Hook pour toutes les actions (Agenda)
export function useActionsRecouvrement() {
    return useQuery<any[]>({
        queryKey: ['recouvrement', 'actions', 'all'],
        queryFn: async () => {
            const response = await nestjsApi.get<any[]>('/recouvrement/actions');
            if (response.error) throw new Error(response.error);
            return response.data!;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Hook pour la liste globale des paiements
export function usePaiementsRecouvrementGlobal(params?: {
    page?: number;
    limit?: number;
    search?: string;
    dossierId?: string;
    startDate?: string;
    endDate?: string;
}) {
    return useQuery<PaginatedResponse<PaiementRecouvrement>>({
        queryKey: ['recouvrement', 'paiements', 'global', params],
        queryFn: async () => {
            const response = await nestjsApi.get<PaginatedResponse<PaiementRecouvrement>>('/recouvrement/paiements', params);
            if (response.error) throw new Error(response.error);
            return response.data!;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Hook pour les statistiques des paiements
export function usePaiementsStatistics(params?: {
    dossierId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}) {
    return useQuery<PaiementsStatistics>({
        queryKey: ['recouvrement', 'paiements', 'statistics', params],
        queryFn: async () => {
            const response = await nestjsApi.get<PaiementsStatistics>('/recouvrement/paiements/statistics', params);
            if (response.error) throw new Error(response.error);
            return response.data!;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Hook pour un dossier spécifique
export function useDossierRecouvrement(id: string | undefined) {
    return useQuery({
        queryKey: ['recouvrement', 'dossiers', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await nestjsApi.get<DossierRecouvrement>(`/recouvrement/dossiers/${id}`);
            if (response.error) throw new Error(response.error);
            return response.data!;
        },
        enabled: !!id,
    });
}

// Hook de création de dossier
export function useCreateDossierRecouvrement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateDossierData) => {
            const response = await nestjsApi.post<DossierRecouvrement>('/recouvrement/dossiers', data);
            if (response.error) throw new Error(response.error);
            return response.data!;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dossiers'] });
            toast.success(`Dossier ${data.reference} créé avec succès`);
        },
        onError: (error: Error) => toast.error(error.message),
    });
}

// Hook pour ajouter une action
export function useCreateActionRecouvrement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateActionData) => {
            const response = await nestjsApi.post('/recouvrement/actions', data);
            if (response.error) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (_, variables: any) => {
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dossiers', variables.dossierId] });
            toast.success('Action enregistrée');
        },
    });
}

// Hook pour modifier une action
export function useUpdateActionRecouvrement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await nestjsApi.patch(`/recouvrement/actions/${id}`, data);
            if (response.error) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dossiers', data.dossierId] });
            toast.success('Action mise à jour');
        },
    });
}

// Hook pour supprimer une action
export function useDeleteActionRecouvrement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dossierId }: { id: string; dossierId: string }) => {
            const response = await nestjsApi.delete(`/recouvrement/actions/${id}`);
            if (response.error) throw new Error(response.error);
            return { id, dossierId };
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dossiers', data.dossierId] });
            toast.success('Action supprimée');
        },
    });
}

// Hook pour ajouter un paiement
export function useCreatePaiementRecouvrement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreatePaiementData) => {
            const response = await nestjsApi.post('/recouvrement/paiements', data);
            if (response.error) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (_, variables: any) => {
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dossiers', variables.dossierId] });
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'paiements'] });
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dashboard'] });
            toast.success('Paiement enregistré');
        },
    });
}

// Hook pour modifier un paiement
export function useUpdatePaiementRecouvrement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await nestjsApi.patch(`/recouvrement/paiements/${id}`, data);
            if (response.error) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dossiers', data.dossierId] });
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'paiements'] });
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dashboard'] });
            toast.success('Paiement mis à jour');
        },
    });
}

// Hook pour supprimer un paiement
export function useDeletePaiementRecouvrement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dossierId }: { id: string; dossierId: string }) => {
            const response = await nestjsApi.delete(`/recouvrement/paiements/${id}`);
            if (response.error) throw new Error(response.error);
            return { id, dossierId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dossiers', data.dossierId] });
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'paiements'] });
            queryClient.invalidateQueries({ queryKey: ['recouvrement', 'dashboard'] });
            toast.success('Paiement supprimé');
        },
    });
}

// Hook pour le dashboard
export function useRecouvrementDashboard() {
    return useQuery<RecouvrementDashboardStats>({
        queryKey: ['recouvrement', 'dashboard'],
        queryFn: async () => {
            const response = await nestjsApi.get<RecouvrementDashboardStats>('/recouvrement/dashboard');
            if (response.error) throw new Error(response.error);
            return response.data!;
        },
        staleTime: 10 * 60 * 1000,
    });
}
