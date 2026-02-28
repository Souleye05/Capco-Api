import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Calendar, Clock, Euro, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useClientConseil, 
  useTachesConseil, 
  useFacturesConseil,
  useUpdateClientConseilStatus 
} from '@/hooks/useConseil';
import { StatutClientConseil, TypePartie } from '@/types/conseil';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/date-utils';
import { EditClientDialog, CreateTacheDialog, CreateFactureDialog } from './components';

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createTacheDialogOpen, setCreateTacheDialogOpen] = useState(false);
  const [createFactureDialogOpen, setCreateFactureDialogOpen] = useState(false);

  const { data: client, isLoading } = useClientConseil(id!);
  const { data: tachesData } = useTachesConseil({ clientId: id, limit: 10 });
  const { data: facturesData } = useFacturesConseil({ clientId: id, limit: 10 });
  const updateStatusMutation = useUpdateClientConseilStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button onClick={() => navigate('/conseil/clients')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

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

  const handleStatusChange = async (newStatus: StatutClientConseil) => {
    if (newStatus !== client.statut) {
      await updateStatusMutation.mutateAsync({ id: client.id, statut: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/conseil/clients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.nom}</h1>
            <p className="text-muted-foreground">Référence: {client.reference}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatutBadge(client.statut)}
              <select
                value={client.statut}
                onChange={(e) => handleStatusChange(e.target.value as StatutClientConseil)}
                className="text-xs border rounded px-2 py-1"
                disabled={updateStatusMutation.isPending}
              >
                <option value="ACTIF">Actif</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="RESILIE">Résilié</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            {getTypeBadge(client.type)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Honoraire Mensuel</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(client.honoraireMensuel)}</div>
            <p className="text-xs text-muted-foreground">
              Facturé le {client.jourFacturation} de chaque mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">{client._count?.tachesConseils || 0}</span> tâches
              </div>
              <div className="text-sm">
                <span className="font-medium">{client._count?.facturesConseils || 0}</span> factures
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Details */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact</label>
                <div className="mt-1 space-y-1">
                  {client.email && (
                    <div className="text-sm">{client.email}</div>
                  )}
                  {client.telephone && (
                    <div className="text-sm">{client.telephone}</div>
                  )}
                </div>
              </div>
              {client.adresse && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                  <div className="mt-1 text-sm whitespace-pre-line">{client.adresse}</div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Créé le</label>
                <div className="mt-1 text-sm">{formatDate(client.createdAt)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dernière modification</label>
                <div className="mt-1 text-sm">{formatDate(client.updatedAt)}</div>
              </div>
              {client.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <div className="mt-1 text-sm whitespace-pre-line">{client.notes}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Tâches and Factures */}
      <Tabs defaultValue="taches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="taches">Tâches</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="taches" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tâches Récentes</CardTitle>
              <Button onClick={() => setCreateTacheDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Tâche
              </Button>
            </CardHeader>
            <CardContent>
              {tachesData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Mois Concerné</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tachesData.data.map((tache) => (
                      <TableRow key={tache.id}>
                        <TableCell>{formatDate(tache.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tache.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{tache.description}</TableCell>
                        <TableCell>
                          {tache.dureeMinutes ? (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.floor(tache.dureeMinutes / 60)}h{tache.dureeMinutes % 60}m
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{tache.moisConcerne}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune tâche enregistrée
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factures" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Factures Récentes</CardTitle>
              <Button onClick={() => setCreateFactureDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Facture
              </Button>
            </CardHeader>
            <CardContent>
              {facturesData?.data.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Mois</TableHead>
                      <TableHead>Montant HT</TableHead>
                      <TableHead>Montant TTC</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturesData.data.map((facture) => (
                      <TableRow key={facture.id}>
                        <TableCell className="font-medium">{facture.reference}</TableCell>
                        <TableCell>{facture.moisConcerne}</TableCell>
                        <TableCell>{formatCurrency(facture.montantHt)}</TableCell>
                        <TableCell>{formatCurrency(facture.montantTtc)}</TableCell>
                        <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              facture.statut === 'PAYEE' ? 'default' :
                              facture.statut === 'ENVOYEE' ? 'secondary' :
                              facture.statut === 'ANNULEE' ? 'destructive' : 'outline'
                            }
                          >
                            {facture.statut}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune facture émise
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditClientDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        client={client}
      />

      <CreateTacheDialog 
        open={createTacheDialogOpen} 
        onOpenChange={setCreateTacheDialogOpen}
        clientId={client.id}
      />

      <CreateFactureDialog 
        open={createFactureDialogOpen} 
        onOpenChange={setCreateFactureDialogOpen}
        clientId={client.id}
      />
    </div>
  );
};

export default ClientDetailPage;