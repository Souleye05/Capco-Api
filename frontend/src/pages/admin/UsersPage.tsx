import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useUsers, useCreateUser, useDeleteUser, useAssignRole } from '@/hooks/useUsers';

// New specialized components
import { UserStatsGrid } from '@/components/users/UserStatsGrid';
import { UserFilterBar } from '@/components/users/UserFilterBar';
import { UserTable } from '@/components/users/UserTable';
import { UserPagination } from '@/components/users/UserPagination';
import { UserModals } from '@/components/users/UserModals';
import { PageHeader } from '@/components/layout/PageHeader';

const INITIAL_QUERY = {
  page: 1,
  limit: 10,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc' as 'asc' | 'desc',
  role: 'all' as string,
};

export default function UsersPage() {
  const [query, setQuery] = useState(INITIAL_QUERY);
  
  // Use React Query hooks
  const { data: usersData, isLoading: loading, error } = useUsers(query);
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const assignRoleMutation = useAssignRole();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const users = usersData?.users || [];
  const meta = usersData?.meta;

  // Robust stats calculation
  const total = meta?.total || users.length;
  const actifs = users.filter(u => u.emailVerified).length;
  const inactifs = Math.max(0, total - actifs);

  const stats = {
    total,
    actifs,
    inactifs,
    admins: users.filter(u => u.roles?.includes('admin')).length,
    collabs: users.filter(u => u.roles?.includes('collaborateur')).length,
    recent: users.filter(u => u.lastSignIn).length,
  };

  const handleAction = async (userId: string, action: string) => {
    try {
      if (action === 'delete') {
        await deleteUserMutation.mutateAsync(userId);
        return;
      }
      
      const role = action === 'admin' ? 'admin' : action === 'collab' ? 'collaborateur' : 'compta';
      await assignRoleMutation.mutateAsync({ userId, role });
    } catch (error: any) {
      // Error handling is done in the mutation hooks
      console.error('Action failed:', error);
    }
  };

  const handleCreate = async (userData: any) => {
    if (!userData.email || !userData.password) {
      toast.error('Remplissez les champs obligatoires');
      return;
    }
    
    try {
      await createUserMutation.mutateAsync(userData);
      setCreateOpen(false);
    } catch (error: any) {
      // Error handling is done in the mutation hook
      console.error('Create failed:', error);
    }
  };

  // Show error if query failed
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Gestion des Utilisateurs"
          description="Administrez les accès et permissions de votre cabinet"
        />
        <Card className="p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des utilisateurs: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Administrez les accès et permissions de votre cabinet"
        action={{
          label: 'Nouvel utilisateur',
          onClick: () => setCreateOpen(true),
          icon: <UserPlus className="h-4 w-4" />
        }}
      />

      <UserStatsGrid stats={stats} />

      <UserFilterBar
        search={query.search}
        onSearch={(v) => setQuery(q => ({ ...q, search: v, page: 1 }))}
        role={query.role}
        onRoleChange={(v: any) => setQuery(q => ({ ...q, role: v, page: 1 }))}
        onReset={() => setQuery(INITIAL_QUERY)}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden bg-muted/5">
        <UserTable
          users={users}
          loading={loading}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={(f) => setQuery(q => ({ ...q, sortBy: f, sortOrder: q.sortBy === f && q.sortOrder === 'asc' ? 'desc' : 'asc' }))}
          onEdit={(u) => { setSelectedUser(u); setEditOpen(true); }}
          onAction={handleAction}
        />
        {meta && <UserPagination meta={meta} onPageChange={(p) => setQuery(q => ({ ...q, page: p }))} />}
      </Card>

      <UserModals
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        selectedUser={selectedUser}
        onCreate={handleCreate}
        creating={createUserMutation.isPending}
      />
    </div>
  );
}
