import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nestjsApi, User, CreateUserRequest } from '@/integrations/nestjs/client';
import { toast } from 'sonner';

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
  autoFetch?: boolean;
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

export function useUsers(options: UseUsersOptions = {}) {
  const queryClient = useQueryClient();
  
  const {
    page = 1,
    limit = 10,
    search,
    sortBy,
    sortOrder = 'desc',
    role,
    autoFetch = true,
  } = options;

  // Query pour récupérer les utilisateurs
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['users', { page, limit, search, sortBy, sortOrder, role }],
    queryFn: async (): Promise<UsersData> => {
      const params: any = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      
      if (search) params.search = search;
      if (role && role !== 'all') params.filterByRole = role;

      const response = await nestjsApi.getUsers(params);

      if (response.error) {
        throw new Error(response.error);
      }

      return {
        users: response.data?.data || [],
        meta: response.data?.meta || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    },
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour créer un utilisateur
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserRequest) => {
      const response = await nestjsApi.createUser(userData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation pour mettre à jour un utilisateur
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<CreateUserRequest> }) => {
      const response = await nestjsApi.updateUser(id, userData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await nestjsApi.deleteUser(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation pour assigner un rôle
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await nestjsApi.assignRole(userId, role);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Mutation pour supprimer un rôle
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await nestjsApi.removeRole(userId, role);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Fonctions wrapper pour maintenir la compatibilité
  const createUser = async (userData: CreateUserRequest) => {
    try {
      await createUserMutation.mutateAsync(userData);
      return { error: null, user: null };
    } catch (error: any) {
      return { error: error.message, user: null };
    }
  };

  const updateUser = async (id: string, userData: Partial<CreateUserRequest>) => {
    try {
      const result = await updateUserMutation.mutateAsync({ id, userData });
      return { error: null, user: result };
    } catch (error: any) {
      return { error: error.message, user: null };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteUserMutation.mutateAsync(id);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const result = await assignRoleMutation.mutateAsync({ userId, role });
      return { error: null, message: result?.message };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const result = await removeRoleMutation.mutateAsync({ userId, role });
      return { error: null, message: result?.message };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return {
    data,
    loading,
    error: error?.message || null,
    createUser,
    updateUser,
    deleteUser,
    assignRole,
    removeRole,
    refetch,
  };
}