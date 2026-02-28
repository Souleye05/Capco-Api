import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';
import type {
  ClientConseil,
  TacheConseil,
  FactureConseil,
  PaiementConseil,
  CreateClientConseilDto,
  UpdateClientConseilDto,
  CreateTacheConseilDto,
  UpdateTacheConseilDto,
  CreateFactureConseilDto,
  UpdateFactureConseilDto,
  CreatePaiementConseilDto,
  UpdatePaiementConseilDto,
  ClientsConseilQueryDto,
  TachesConseilQueryDto,
  FacturesConseilQueryDto,
  PaiementsConseilQueryDto,
  PaginatedResponse,
  StatistiquesClientsConseil,
} from '@/types/conseil';

// ===== CLIENTS CONSEIL =====

export const useClientsConseil = (params?: ClientsConseilQueryDto) => {
  return useQuery({
    queryKey: ['clients-conseil', params],
    queryFn: async () => {
      const response = await nestjsApi.getClientsConseil(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaginatedResponse<ClientConseil>;
    },
  });
};

export const useClientConseil = (id: string) => {
  return useQuery({
    queryKey: ['client-conseil', id],
    queryFn: async () => {
      const response = await nestjsApi.getClientConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as ClientConseil;
    },
    enabled: !!id,
  });
};

export const useCreateClientConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientConseilDto) => {
      const response = await nestjsApi.createClientConseil(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as ClientConseil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-conseil'] });
      toast.success('Client conseil créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création : ${error.message}`);
    },
  });
};

export const useUpdateClientConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientConseilDto }) => {
      const response = await nestjsApi.updateClientConseil(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as ClientConseil;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['client-conseil', id] });
      toast.success('Client conseil mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour : ${error.message}`);
    },
  });
};

export const useDeleteClientConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await nestjsApi.deleteClientConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-conseil'] });
      toast.success('Client conseil supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
    },
  });
};

export const useUpdateClientConseilStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const response = await nestjsApi.updateClientConseilStatus(id, statut);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as ClientConseil;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['client-conseil', id] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour du statut : ${error.message}`);
    },
  });
};

export const useClientsConseilStatistics = () => {
  return useQuery({
    queryKey: ['clients-conseil-statistics'],
    queryFn: async () => {
      const response = await nestjsApi.getClientsConseilStatistics();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as StatistiquesClientsConseil;
    },
  });
};

// ===== TÂCHES CONSEIL =====

export const useTachesConseil = (params?: TachesConseilQueryDto) => {
  return useQuery({
    queryKey: ['taches-conseil', params],
    queryFn: async () => {
      const response = await nestjsApi.getTachesConseil(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaginatedResponse<TacheConseil>;
    },
  });
};

export const useTacheConseil = (id: string) => {
  return useQuery({
    queryKey: ['tache-conseil', id],
    queryFn: async () => {
      const response = await nestjsApi.getTacheConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as TacheConseil;
    },
    enabled: !!id,
  });
};

export const useCreateTacheConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTacheConseilDto) => {
      const response = await nestjsApi.createTacheConseil(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as TacheConseil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taches-conseil'] });
      toast.success('Tâche créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création : ${error.message}`);
    },
  });
};

export const useUpdateTacheConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTacheConseilDto }) => {
      const response = await nestjsApi.updateTacheConseil(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as TacheConseil;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['taches-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['tache-conseil', id] });
      toast.success('Tâche mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour : ${error.message}`);
    },
  });
};

export const useDeleteTacheConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await nestjsApi.deleteTacheConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taches-conseil'] });
      toast.success('Tâche supprimée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
    },
  });
};

// ===== FACTURES CONSEIL =====

export const useFacturesConseil = (params?: FacturesConseilQueryDto) => {
  return useQuery({
    queryKey: ['factures-conseil', params],
    queryFn: async () => {
      const response = await nestjsApi.getFacturesConseil(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaginatedResponse<FactureConseil>;
    },
  });
};

export const useFactureConseil = (id: string) => {
  return useQuery({
    queryKey: ['facture-conseil', id],
    queryFn: async () => {
      const response = await nestjsApi.getFactureConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as FactureConseil;
    },
    enabled: !!id,
  });
};

export const useCreateFactureConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFactureConseilDto) => {
      const response = await nestjsApi.createFactureConseil(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as FactureConseil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Facture créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création : ${error.message}`);
    },
  });
};

export const useUpdateFactureConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFactureConseilDto }) => {
      const response = await nestjsApi.updateFactureConseil(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as FactureConseil;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['facture-conseil', id] });
      toast.success('Facture mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour : ${error.message}`);
    },
  });
};

export const useDeleteFactureConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await nestjsApi.deleteFactureConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Facture supprimée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
    },
  });
};

export const useGenerateMonthlyBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, moisConcerne }: { clientId: string; moisConcerne: string }) => {
      const response = await nestjsApi.generateMonthlyBill(clientId, moisConcerne);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as FactureConseil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Facture mensuelle générée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la génération : ${error.message}`);
    },
  });
};

// ===== PAIEMENTS CONSEIL =====

export const usePaiementsConseil = (params?: PaiementsConseilQueryDto) => {
  return useQuery({
    queryKey: ['paiements-conseil', params],
    queryFn: async () => {
      const response = await nestjsApi.getPaiementsConseil(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaginatedResponse<PaiementConseil>;
    },
  });
};

export const usePaiementConseil = (id: string) => {
  return useQuery({
    queryKey: ['paiement-conseil', id],
    queryFn: async () => {
      const response = await nestjsApi.getPaiementConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaiementConseil;
    },
    enabled: !!id,
  });
};

export const useCreatePaiementConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaiementConseilDto) => {
      const response = await nestjsApi.createPaiementConseil(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaiementConseil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Paiement enregistré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'enregistrement : ${error.message}`);
    },
  });
};

export const useUpdatePaiementConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaiementConseilDto }) => {
      const response = await nestjsApi.updatePaiementConseil(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaiementConseil;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['paiements-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['paiement-conseil', id] });
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Paiement mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour : ${error.message}`);
    },
  });
};

export const useDeletePaiementConseil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await nestjsApi.deletePaiementConseil(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements-conseil'] });
      queryClient.invalidateQueries({ queryKey: ['factures-conseil'] });
      toast.success('Paiement supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression : ${error.message}`);
    },
  });
};

export const usePaiementsByFacture = (factureId: string) => {
  return useQuery({
    queryKey: ['paiements-facture', factureId],
    queryFn: async () => {
      const response = await nestjsApi.getPaiementsByFacture(factureId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data as PaiementConseil[];
    },
    enabled: !!factureId,
  });
};

// ===== DASHBOARD & STATISTIQUES =====

export const useConseilDashboard = () => {
  return useQuery({
    queryKey: ['conseil-dashboard'],
    queryFn: async () => {
      const response = await nestjsApi.getConseilDashboard();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
};

export const useConseilStatistics = () => {
  return useQuery({
    queryKey: ['conseil-statistics'],
    queryFn: async () => {
      const response = await nestjsApi.getConseilStatistics();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
};