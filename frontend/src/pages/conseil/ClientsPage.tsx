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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useClientsConseil, useClientsConseilStatistics, useDeleteClientConseil } from '@/hooks/useConseil';
import { ClientConseil, StatutClientConseil, TypePartie } from '@/types/conseil';
import { formatCurrency } from '@/lib/currency';
import { CreateClientDialog, EditClientDialog } from './components';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    <div className="space-y-[var(--space-6)] animate-in fade-in duration-700">
      {/* Adaptive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-foreground tracking-tight">Clients Conseil</h1>
          <p className="text-[length:var(--fs-sm)] text-muted-foreground opacity-70">
            Gestion stratégique de l'assistance juridique
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto rounded-xl h-12 px-6 bg-primary shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      {/* Statistics Recap - Horizontal Scroll on Mobile */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', value: statistics.total, color: 'text-foreground' },
            { label: 'Actifs', value: statistics.actifs, color: 'text-success' },
            { label: 'Suspendus', value: statistics.suspendus, color: 'text-warning' },
            { label: 'Moyenne / mois', value: formatCurrency(statistics.honoraireMoyenMensuel), color: 'text-primary' }
          ].map((stat, i) => (
            <Card key={i} className="border-border/40 bg-background/50 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-4 sm:p-6">
                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={cn("text-lg sm:text-2xl font-black tracking-tight", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Responsive Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-xl border-border/40 bg-background/50 backdrop-blur-md focus:ring-primary/20 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2">
          <SearchableSelect
            options={[
              { label: "Tous statuts", value: "all" },
              { label: "Actif", value: "ACTIF" },
              { label: "Suspendu", value: "SUSPENDU" },
              { label: "Résilié", value: "RESILIE" },
            ]}
            value={statutFilter}
            onValueChange={(value) => setStatutFilter(value as StatutClientConseil | 'all')}
            placeholder="Statut"
            className="flex-1 md:w-[160px] h-12 rounded-xl bg-background/50 border-border/40 font-bold text-xs uppercase tracking-widest"
          />
          <SearchableSelect
            options={[
              { label: "Tous types", value: "all" },
              { label: "Physique", value: "physique" },
              { label: "Morale", value: "morale" },
            ]}
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypePartie | 'all')}
            placeholder="Type"
            className="flex-1 md:w-[160px] h-12 rounded-xl bg-background/50 border-border/40 font-bold text-xs uppercase tracking-widest"
          />
        </div>
      </div>

      {/* Adaptive Clients List: Table on Desktop, Cards on Mobile */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop View: Table */}
            <div className="hidden lg:block border border-border/40 bg-background/40 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-2xl shadow-black/5">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="py-5 px-6 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Référence</TableHead>
                    <TableHead className="py-5 px-6 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Client</TableHead>
                    <TableHead className="py-5 px-6 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Type</TableHead>
                    <TableHead className="py-5 px-6 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Honoraires</TableHead>
                    <TableHead className="py-5 px-6 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Statut</TableHead>
                    <TableHead className="py-5 px-6 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsData?.data.map((client) => (
                    <TableRow key={client.id} className="group border-border/20 hover:bg-muted/30 transition-colors">
                      <TableCell className="py-5 px-6 font-mono text-xs opacity-60">{client.reference}</TableCell>
                      <TableCell className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{client.nom}</span>
                          <span className="text-[10px] text-muted-foreground opacity-70 truncate max-w-[200px]">{client.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-6">{getTypeBadge(client.type)}</TableCell>
                      <TableCell className="py-5 px-6 font-black text-sm">{formatCurrency(client.honoraireMensuel)}</TableCell>
                      <TableCell className="py-5 px-6">{getStatutBadge(client.statut)}</TableCell>
                      <TableCell className="py-5 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 transition-all">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl p-2 border-border/40 backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => handleView(client)} className="rounded-xl gap-2 font-bold text-xs py-2.5">
                              <Eye className="h-3.5 w-3.5" /> Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(client)} className="rounded-xl gap-2 font-bold text-xs py-2.5">
                              <Edit className="h-3.5 w-3.5" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(client)} className="rounded-xl gap-2 font-bold text-xs py-2.5 text-destructive hover:bg-destructive/5">
                              <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {clientsData?.data.map((client) => (
                <Card key={client.id} className="border-border/40 bg-background shadow-lg shadow-black/5 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform" onClick={() => handleView(client)}>
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono opacity-50 mb-1">{client.reference}</span>
                        <h3 className="text-base font-black leading-tight mb-0.5">{client.nom}</h3>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{client.email || 'Pas d\'email'}</span>
                      </div>
                      {getStatutBadge(client.statut)}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">Mensualité</span>
                        <span className="text-sm font-black text-primary">{formatCurrency(client.honoraireMensuel)}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(client); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

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