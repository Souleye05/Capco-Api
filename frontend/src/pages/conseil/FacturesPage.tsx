import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Send, Euro } from 'lucide-react';
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
import { 
  useFacturesConseil, 
  useDeleteFactureConseil,
  useGenerateMonthlyBill,
  useClientsConseil 
} from '@/hooks/useConseil';
import { FactureConseil, StatutFacture } from '@/types/conseil';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/date-utils';
import { CreateFactureDialog, EditFactureDialog, GenerateFactureDialog } from './components';
import { toast } from 'sonner';

const FacturesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFacture | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<FactureConseil | null>(null);

  const queryParams = {
    page,
    limit: 10,
    search: searchTerm || undefined,
    statut: statutFilter !== 'all' ? statutFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  };

  const { data: facturesData, isLoading } = useFacturesConseil(queryParams);
  const { data: clientsData } = useClientsConseil({ limit: 100 }); // Pour le filtre
  const deleteFactureMutation = useDeleteFactureConseil();

  const handleEdit = (facture: FactureConseil) => {
    setSelectedFacture(facture);
    setEditDialogOpen(true);
  };

  const handleDelete = async (facture: FactureConseil) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture "${facture.reference}" ?`)) {
      try {
        await deleteFactureMutation.mutateAsync(facture.id);
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getStatutBadge = (statut: StatutFacture) => {
    const variants = {
      BROUILLON: 'outline',
      ENVOYEE: 'secondary',
      PAYEE: 'default',
      ANNULEE: 'destructive',
    } as const;

    const colors = {
      BROUILLON: 'text-gray-600',
      ENVOYEE: 'text-blue-600',
      PAYEE: 'text-green-600',
      ANNULEE: 'text-red-600',
    };

    return (
      <Badge variant={variants[statut] || 'outline'} className={colors[statut]}>
        {statut}
      </Badge>
    );
  };

  // Calcul des statistiques
  const stats = facturesData?.data.reduce(
    (acc, facture) => {
      acc.total++;
      acc.montantTotal += facture.montantTtc;
      
      if (facture.statut === 'PAYEE') {
        acc.payees++;
        acc.montantPaye += facture.montantTtc;
      } else if (facture.statut === 'ENVOYEE') {
        acc.enAttente++;
        acc.montantEnAttente += facture.montantTtc;
      }
      
      return acc;
    },
    { 
      total: 0, 
      payees: 0, 
      enAttente: 0, 
      montantTotal: 0, 
      montantPaye: 0, 
      montantEnAttente: 0 
    }
  ) || { total: 0, payees: 0, enAttente: 0, montantTotal: 0, montantPaye: 0, montantEnAttente: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factures Conseil</h1>
          <p className="text-muted-foreground">
            Gestion des factures d'assistance juridique
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
            <Euro className="h-4 w-4 mr-2" />
            Générer Facture
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Facture
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.montantTotal)} au total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures Payées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.payees}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.montantPaye)} encaissé
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.enAttente}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.montantEnAttente)} à encaisser
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.payees / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.payees} sur {stats.total} factures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par référence, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clientsData?.data.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statutFilter} onValueChange={(value) => setStatutFilter(value as StatutFacture | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="BROUILLON">Brouillon</SelectItem>
                <SelectItem value="ENVOYEE">Envoyée</SelectItem>
                <SelectItem value="PAYEE">Payée</SelectItem>
                <SelectItem value="ANNULEE">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Factures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Factures</CardTitle>
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
                  <TableHead>Client</TableHead>
                  <TableHead>Mois</TableHead>
                  <TableHead>Montant HT</TableHead>
                  <TableHead>TVA</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiements</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturesData?.data.map((facture) => (
                  <TableRow key={facture.id}>
                    <TableCell className="font-medium">{facture.reference}</TableCell>
                    <TableCell>
                      {facture.clientsConseil ? (
                        <div>
                          <div className="font-medium">{facture.clientsConseil.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {facture.clientsConseil.reference}
                          </div>
                        </div>
                      ) : (
                        'Client supprimé'
                      )}
                    </TableCell>
                    <TableCell>{facture.moisConcerne}</TableCell>
                    <TableCell>{formatCurrency(facture.montantHt)}</TableCell>
                    <TableCell>{formatCurrency(facture.tva)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(facture.montantTtc)}</TableCell>
                    <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                    <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {facture._count?.paiementsConseils || 0}
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
                          <DropdownMenuItem onClick={() => handleEdit(facture)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          {facture.statut === 'BROUILLON' && (
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Marquer comme envoyée
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(facture)}
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
          {facturesData?.pagination && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {((facturesData.pagination.page - 1) * facturesData.pagination.limit) + 1} à{' '}
                {Math.min(facturesData.pagination.page * facturesData.pagination.limit, facturesData.pagination.total)} sur{' '}
                {facturesData.pagination.total} factures
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!facturesData.pagination.hasPrev}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!facturesData.pagination.hasNext}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateFactureDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        clientId="" // Will be selected in dialog
      />
      
      {selectedFacture && (
        <EditFactureDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          facture={selectedFacture}
        />
      )}

      <GenerateFactureDialog 
        open={generateDialogOpen} 
        onOpenChange={setGenerateDialogOpen}
      />
    </div>
  );
};

export default FacturesPage;