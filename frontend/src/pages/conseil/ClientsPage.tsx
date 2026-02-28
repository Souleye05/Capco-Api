import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientsConseil, useClientsConseilStatistics, useDeleteClientConseil } from '@/hooks/useConseil';
import { ClientConseil, StatutClientConseil, TypePartie } from '@/types/conseil';
import { formatCurrency } from '@/lib/currency';
import { CreateClientDialog, EditClientDialog } from './components';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ClientsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutClientConseil | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TypePartie | 'all'>('all');
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientConseil | null>(null);

  const queryParams = {
    page,
    limit: 10,
    search: searchTerm || undefined,
    statut: statutFilter !== 'all' ? statutFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  };

  const { data: clientsData, isLoading } = useClientsConseil(queryParams);
  const { data: statistics } = useClientsConseilStatistics();
  const deleteClientMutation = useDeleteClientConseil();

  const handleEdit = (client: ClientConseil) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleDelete = async (client: ClientConseil) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.nom}" ?`)) {
      try {
        await deleteClientMutation.mutateAsync(client.id);
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleView = (client: ClientConseil) => {
    navigate(`/conseil/clients/${client.id}`);
  };

  const getStatutBadge = (statut: StatutClientConseil) => {
    const variants = {
      ACTIF: 'default',
      SUSPENDU: 'secondary',
      RESILIE: 'destructive',
    } as const;

    return (
      <Badge variant={variants[statut] || 'default'}>
        {statut}
      </Badge>
    );
  };

  const getTypeBadge = (type: TypePartie) => {
    return (
      <Badge variant="outline">
        {type === 'physique' ? 'Personne physique' : 'Personne morale'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients Conseil</h1>
          <p className="text-muted-foreground">
            Gestion des clients pour l'assistance juridique
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.actifs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Suspendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.suspendus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Honoraire Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statistics.honoraireMoyenMensuel)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statutFilter} onValueChange={(value) => setStatutFilter(value as StatutClientConseil | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actif</SelectItem>
                <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                <SelectItem value="RESILIE">Résilié</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypePartie | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="physique">Personne physique</SelectItem>
                <SelectItem value="morale">Personne morale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Honoraire Mensuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tâches</TableHead>
                  <TableHead>Factures</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsData?.data.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.reference}</TableCell>
                    <TableCell>{client.nom}</TableCell>
                    <TableCell>{getTypeBadge(client.type)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        )}
                        {client.telephone && (
                          <div className="text-sm text-muted-foreground">{client.telephone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(client.honoraireMensuel)}</TableCell>
                    <TableCell>{getStatutBadge(client.statut)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client._count?.tachesConseils || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client._count?.facturesConseils || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(client)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(client)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {clientsData?.pagination && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {((clientsData.pagination.page - 1) * clientsData.pagination.limit) + 1} à{' '}
                {Math.min(clientsData.pagination.page * clientsData.pagination.limit, clientsData.pagination.total)} sur{' '}
                {clientsData.pagination.total} clients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!clientsData.pagination.hasPrev}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!clientsData.pagination.hasNext}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateClientDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {selectedClient && (
        <EditClientDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          client={selectedClient}
        />
      )}
    </div>
  );
};

export default ClientsPage;