import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

export interface Juridiction {
  id: string;
  nom: string;
  code?: string;
  description?: string;
  ordre: number;
  estActif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJuridictionData {
  nom: string;
  code?: string;
  description?: string;
  ordre?: number;
  estActif?: boolean;
}

// Hook pour récupérer toutes les juridictions
export function useJuridictions(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['juridictions', params],
    queryFn: async () => {
      const response = await nestjsApi.get<{
        data: Juridiction[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>('/juridictions?' + new URLSearchParams({
        ...(params?.page && { page: params.page.toString() }),
        ...(params?.limit && { limit: params.limit.toString() }),
        ...(params?.search && { search: params.search }),
      }).toString());
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour récupérer les juridictions actives
export function useJuridictionsActives() {
  return useQuery({
    queryKey: ['juridictions', 'active'],
    queryFn: async (): Promise<Juridiction[]> => {
      const response = await nestjsApi.get<Juridiction[]>('/juridictions/active');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // Cache plus long pour les juridictions actives
  });
}

// Hook pour rechercher des juridictions
export function useSearchJuridictions(search: string, limit?: number) {
  return useQuery({
    queryKey: ['juridictions', 'search', search, limit],
    queryFn: async (): Promise<Juridiction[]> => {
      if (!search.trim()) return [];
      
      const params = new URLSearchParams({ q: search });
      if (limit) params.append('limit', limit.toString());
      
      const response = await nestjsApi.get<Juridiction[]>(`/juridictions/search?${params}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    },
    enabled: !!search.trim(),
    staleTime: 2 * 60 * 1000,
  });
}

// Hook pour récupérer une juridiction par ID
export function useJuridiction(id: string | undefined) {
  return useQuery({
    queryKey: ['juridictions', id],
    queryFn: async (): Promise<Juridiction | null> => {
      if (!id) return null;
      
      const response = await nestjsApi.get<Juridiction>(`/juridictions/${id}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer une juridiction
export function useCreateJuridiction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJuridictionData): Promise<Juridiction> => {
      const response = await nestjsApi.post<Juridiction>('/juridictions', data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juridictions'] });
      toast.success('Juridiction créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour une juridiction
export function useUpdateJuridiction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateJuridictionData> }): Promise<Juridiction> => {
      const response = await nestjsApi.patch<Juridiction>(`/juridictions/${id}`, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['juridictions'] });
      queryClient.invalidateQueries({ queryKey: ['juridictions', data.id] });
      toast.success('Juridiction mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// Hook pour supprimer une juridiction
export function useDeleteJuridiction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await nestjsApi.delete(`/juridictions/${id}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juridictions'] });
      toast.success('Juridiction supprimée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}