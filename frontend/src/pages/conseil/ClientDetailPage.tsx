import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { parseDateFromAPI } from '@/lib/date-utils';
import {
  ArrowLeft,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Briefcase,
  Euro,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockClientsConseil, mockTachesConseil, mockFacturesConseil, mockPaiementsConseil } from '@/data/mockData';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { StatutClientConseil, StatutFacture, TypeTache } from '@/types';

const getStatutClientBadge = (statut: StatutClientConseil) => {
  switch (statut) {
    case 'ACTIF':
      return <Badge className="bg-success/10 text-success border-success/20">Actif</Badge>;
    case 'SUSPENDU':
      return <Badge className="bg-warning/10 text-warning border-warning/20">Suspendu</Badge>;
    case 'RESILIE':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Résilié</Badge>;
  }
};

const getStatutFactureBadge = (statut: StatutFacture) => {
  switch (statut) {
    case 'BROUILLON':
      return <Badge variant="outline">Brouillon</Badge>;
    case 'ENVOYEE':
      return <Badge className="bg-info/10 text-info border-info/20">Envoyée</Badge>;
    case 'PAYEE':
      return <Badge className="bg-success/10 text-success border-success/20">Payée</Badge>;
    case 'EN_RETARD':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">En retard</Badge>;
    case 'ANNULEE':
      return <Badge variant="secondary">Annulée</Badge>;
  }
};

const getTypeTacheLabel = (type: TypeTache) => {
  const labels: Record<TypeTache, string> = {
    CONSULTATION: 'Consultation',
    REDACTION: 'Rédaction',
    NEGOCIATION: 'Négociation',
    RECHERCHE: 'Recherche',
    REUNION: 'Réunion',
    APPEL: 'Appel',
    EMAIL: 'Email',
    AUTRE: 'Autre'
  };
  return labels[type];
};

const getTypeTacheColor = (type: TypeTache) => {
  const colors: Record<TypeTache, string> = {
    CONSULTATION: 'bg-info/10 text-info',
    REDACTION: 'bg-primary/10 text-primary',
    NEGOCIATION: 'bg-warning/10 text-warning',
    RECHERCHE: 'bg-muted text-muted-foreground',
    REUNION: 'bg-success/10 text-success',
    APPEL: 'bg-chart-1/10 text-chart-1',
    EMAIL: 'bg-chart-2/10 text-chart-2',
    AUTRE: 'bg-muted text-muted-foreground'
  };
  return colors[type];
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('taches');
  const [isNewTacheDialogOpen, setIsNewTacheDialogOpen] = useState(false);
  const [isNewFactureDialogOpen, setIsNewFactureDialogOpen] = useState(false);
  
  const [newTache, setNewTache] = useState({
    type: 'CONSULTATION' as TypeTache,
    description: '',
    dureeMinutes: 60,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const client = mockClientsConseil.find(c => c.id === id);
  const tachesClient = mockTachesConseil.filter(t => t.clientId === id);
  const facturesClient = mockFacturesConseil.filter(f => f.clientId === id);
  const paiementsClient = mockPaiementsConseil.filter(p => 
    facturesClient.some(f => f.id === p.factureId)
  );

  // Stats calculées
  const stats = useMemo(() => {
    const totalFacture = facturesClient.reduce((sum, f) => sum + f.montantTTC, 0);
    const totalPaye = paiementsClient.reduce((sum, p) => sum + p.montant, 0);
    const facturesImpayees = facturesClient.filter(f => f.statut === 'ENVOYEE' || f.statut === 'EN_RETARD').length;
    const tachesMoisCourant = tachesClient.filter(t => {
      const moisCourant = format(new Date(), 'yyyy-MM');
      return t.moisConcerne === moisCourant;
    }).length;
    const tempsTotal = tachesClient.reduce((sum, t) => sum + (t.dureeMinutes || 0), 0);

    return { totalFacture, totalPaye, facturesImpayees, tachesMoisCourant, tempsTotal };
  }, [facturesClient, paiementsClient, tachesClient]);

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Client non trouvé</h2>
          <Button variant="outline" onClick={() => navigate('/conseil/clients')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateTache = () => {
    if (!newTache.description) {
      toast.error('Veuillez saisir une description');
      return;
    }
    toast.success('Tâche enregistrée avec succès');
    setIsNewTacheDialogOpen(false);
    setNewTache({
      type: 'CONSULTATION',
      description: '',
      dureeMinutes: 60,
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleGenererFacture = () => {
    toast.success('Facture générée avec succès');
    setIsNewFactureDialogOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header
        title={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/conseil/clients')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <span className="font-mono text-sm text-muted-foreground">{client.reference}</span>
              <h1 className="text-xl font-semibold">{client.nom}</h1>
            </div>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsNewFactureDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Générer facture
            </Button>
            <Button onClick={() => setIsNewTacheDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Informations client */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte info client */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informations client</CardTitle>
                {getStatutClientBadge(client.statut)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium",
                  client.type === 'morale' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'
                )}>
                  {client.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{client.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.type === 'morale' ? 'Personne morale' : 'Personne physique'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {client.telephone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.telephone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.adresse && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{client.adresse}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Honoraires mensuels</span>
                  <span className="font-semibold">{formatCurrency(client.honoraireMensuel)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jour de facturation</span>
                  <span>Le {client.jourFacturation} du mois</span>
                </div>
              </div>

              {client.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.tachesMoisCourant}</p>
                    <p className="text-xs text-muted-foreground">Tâches ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/10">
                    <Clock className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(stats.tempsTotal / 60)}h</p>
                    <p className="text-xs text-muted-foreground">Temps total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(stats.totalPaye)}</p>
                    <p className="text-xs text-muted-foreground">Total payé</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    stats.facturesImpayees > 0 ? 'bg-warning/10' : 'bg-success/10'
                  )}>
                    <FileText className={cn(
                      "h-5 w-5",
                      stats.facturesImpayees > 0 ? 'text-warning' : 'text-success'
                    )} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.facturesImpayees}</p>
                    <p className="text-xs text-muted-foreground">Factures en attente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Onglets Tâches / Factures */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="taches" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Tâches ({tachesClient.length})
            </TabsTrigger>
            <TabsTrigger value="factures" className="gap-2">
              <FileText className="h-4 w-4" />
              Factures ({facturesClient.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="taches" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {tachesClient.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune tâche enregistrée</p>
                    <Button className="mt-4" onClick={() => setIsNewTacheDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une tâche
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Mois</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tachesClient.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tache) => (
                        <TableRow key={tache.id}>
                          <TableCell>
                            {new Intl.DateTimeFormat('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              timeZone: 'UTC'
                            }).format(parseDateFromAPI(tache.date))}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeTacheColor(tache.type)}>
                              {getTypeTacheLabel(tache.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="line-clamp-2">{tache.description}</p>
                          </TableCell>
                          <TableCell>
                            {tache.dureeMinutes ? `${Math.floor(tache.dureeMinutes / 60)}h${tache.dureeMinutes % 60 > 0 ? (tache.dureeMinutes % 60).toString().padStart(2, '0') : ''}` : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {tache.moisConcerne}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factures" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {facturesClient.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune facture émise</p>
                    <Button className="mt-4" onClick={() => setIsNewFactureDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Générer une facture
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Émission</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead className="text-right">Montant TTC</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturesClient.sort((a, b) => new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime()).map((facture) => (
                        <TableRow key={facture.id}>
                          <TableCell className="font-mono">{facture.reference}</TableCell>
                          <TableCell>{facture.moisConcerne}</TableCell>
                          <TableCell>
                            {new Intl.DateTimeFormat('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              timeZone: 'UTC'
                            }).format(parseDateFromAPI(facture.dateEmission))}
                          </TableCell>
                          <TableCell>
                            {new Intl.DateTimeFormat('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              timeZone: 'UTC'
                            }).format(parseDateFromAPI(facture.dateEcheance))}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(facture.montantTTC)}
                          </TableCell>
                          <TableCell>
                            {getStatutFactureBadge(facture.statut)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Télécharger PDF
                                </DropdownMenuItem>
                                {facture.statut === 'ENVOYEE' && (
                                  <DropdownMenuItem onClick={() => toast.success('Paiement enregistré')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marquer payée
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Renvoyer par email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog nouvelle tâche */}
      <Dialog open={isNewTacheDialogOpen} onOpenChange={setIsNewTacheDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
            <DialogDescription>
              Enregistrer une prestation pour {client.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newTache.date}
                  onChange={(e) => setNewTache({ ...newTache, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select
                  value={newTache.type}
                  onValueChange={(value: TypeTache) => setNewTache({ ...newTache, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSULTATION">Consultation</SelectItem>
                    <SelectItem value="REDACTION">Rédaction</SelectItem>
                    <SelectItem value="NEGOCIATION">Négociation</SelectItem>
                    <SelectItem value="RECHERCHE">Recherche</SelectItem>
                    <SelectItem value="REUNION">Réunion</SelectItem>
                    <SelectItem value="APPEL">Appel</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                value={newTache.dureeMinutes}
                onChange={(e) => setNewTache({ ...newTache, dureeMinutes: parseInt(e.target.value) || 0 })}
                placeholder="60"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea
                value={newTache.description}
                onChange={(e) => setNewTache({ ...newTache, description: e.target.value })}
                placeholder="Décrivez la prestation réalisée..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTacheDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTache}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog génération facture */}
      <Dialog open={isNewFactureDialogOpen} onOpenChange={setIsNewFactureDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Générer une facture</DialogTitle>
            <DialogDescription>
              Créer la facture mensuelle pour {client.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Période</Label>
              <Input
                type="month"
                defaultValue={format(new Date(), 'yyyy-MM')}
              />
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Montant HT</span>
                <span className="font-medium">{formatCurrency(client.honoraireMensuel)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA (18%)</span>
                <span>{formatCurrency(client.honoraireMensuel * 0.18)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total TTC</span>
                <span>{formatCurrency(client.honoraireMensuel * 1.18)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFactureDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleGenererFacture}>
              <FileText className="h-4 w-4 mr-2" />
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}