import { useState, useEffect } from 'react';
import { nestjsApi, User, CreateUserRequest } from '@/integrations/nestjs/client';

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    page = 1,
    limit = 10,
    search,
    sortBy,
    sortOrder = 'desc',
    autoFetch = true,
  } = options;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await nestjsApi.getUsers({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      if (response.error) {
        setError(response.error);
        setData(null);
      } else if (response.data) {
        setData({
          users: response.data.data,
          meta: response.data.meta,
        });
      }
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserRequest) => {
    try {
      const response = await nestjsApi.createUser(userData);
      if (response.error) {
        return { error: response.error, user: null };
      }
      
      // Rafraîchir la liste après création
      await fetchUsers();
      return { error: null, user: response.data };
    } catch (err) {
      return { error: 'Erreur lors de la création de l\'utilisateur', user: null };
    }
  };

  const updateUser = async (id: string, userData: Partial<CreateUserRequest>) => {
    try {
      const response = await nestjsApi.updateUser(id, userData);
      if (response.error) {
        return { error: response.error, user: null };
      }
      
      // Rafraîchir la liste après mise à jour
      await fetchUsers();
      return { error: null, user: response.data };
    } catch (err) {
      return { error: 'Erreur lors de la mise à jour de l\'utilisateur', user: null };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await nestjsApi.deleteUser(id);
      if (response.error) {
        return { error: response.error };
      }
      
      // Rafraîchir la liste après suppression
      await fetchUsers();
      return { error: null };
    } catch (err) {
      return { error: 'Erreur lors de la suppression de l\'utilisateur' };
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const response = await nestjsApi.assignRole(userId, role);
      if (response.error) {
        return { error: response.error };
      }
      
      // Rafraîchir la liste après assignation de rôle
      await fetchUsers();
      return { error: null, message: response.data?.message };
    } catch (err) {
      return { error: 'Erreur lors de l\'assignation du rôle' };
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const response = await nestjsApi.removeRole(userId, role);
      if (response.error) {
        return { error: response.error };
      }
      
      // Rafraîchir la liste après suppression de rôle
      await fetchUsers();
      return { error: null, message: response.data?.message };
    } catch (err) {
      return { error: 'Erreur lors de la suppression du rôle' };
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [page, limit, search, sortBy, sortOrder, autoFetch]);

  return {
    data,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    assignRole,
    removeRole,
    refetch: fetchUsers,
  };
}