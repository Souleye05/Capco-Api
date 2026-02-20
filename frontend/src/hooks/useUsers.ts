import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi, User, CreateUserRequest } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UsersData {
  users: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Hook principal pour récupérer les utilisateurs avec pagination
export function useUsers(options: UseUsersOptions = {}) {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy,
    sortOrder = 'desc',
  } = options;

  return useQuery({
    queryKey: ['users', { page, limit, search, sortBy, sortOrder }],
    queryFn: async (): Promise<UsersData> => {
      const response = await nestjsApi.getUsers({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('Aucune donnée reçue');
      }

      return {
        users: response.data.data,
        meta: response.data.meta,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer un utilisateur par ID
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async (): Promise<User | null> => {
      if (!id || id === 'undefined') return null;
      const response = await nestjsApi.get<User>(`/users/${id}`);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    },
    enabled: !!id && id !== 'undefined',
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour créer un utilisateur
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserRequest): Promise<User> => {
      const response = await nestjsApi.createUser(userData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });
}

// Hook pour mettre à jour un utilisateur
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateUserRequest> }): Promise<User> => {
      const response = await nestjsApi.updateUser(id, data);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', data.id] });
      toast.success('Utilisateur mis à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });
}

// Hook pour supprimer un utilisateur
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await nestjsApi.deleteUser(id);
      
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}

// Hook pour assigner un rôle
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }): Promise<any> => {
      const response = await nestjsApi.assignRole(userId, role);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Rôle assigné avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'assignation du rôle: ${error.message}`);
    },
  });
}

// Hook pour supprimer un rôle
export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }): Promise<any> => {
      const response = await nestjsApi.removeRole(userId, role);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Rôle supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression du rôle: ${error.message}`);
    },
  });
}