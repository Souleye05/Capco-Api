import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Send,
  Download,
  Eye,
  CreditCard,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useFacturesConseil, useClientsConseil, useCreatePaiementConseil, useUpdateFactureConseil } from '@/hooks/useConseil';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';

type StatutFacture = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
type ModePaiement = 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';

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

type FilterType = 'all' | 'impayees' | 'payees' | 'en_retard';

export default function FacturesPage() {
  const navigate = useNavigate();
  const { user } = useNestJSAuth();
  
  const { data: factures = [], isLoading: facturesLoading } = useFacturesConseil();
  const { data: clients = [], isLoading: clientsLoading } = useClientsConseil();
  const createPaiement = useCreatePaiementConseil();
  const updateFacture = useUpdateFactureConseil();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterType>('all');
  const [isPaiementDialogOpen, setIsPaiementDialogOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<string | null>(null);
  const [paiementData, setPaiementData] = useState({
    montant: 0,
    mode: 'VIREMENT' as ModePaiement,
    reference: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const isLoading = facturesLoading || clientsLoading;

  // Enrichir les factures avec les clients
  const enrichedFactures = factures.map(facture => ({
    ...facture,
    client: clients.find(c => c.id === facture.client_id)
  }));

  // Calcul des stats
  const stats = useMemo(() => {
    const totalFactures = enrichedFactures.length;
    const facturesPayees = enrichedFactures.filter(f => f.statut === 'PAYEE');
    const facturesImpayees = enrichedFactures.filter(f => f.statut === 'ENVOYEE' || f.statut === 'EN_RETARD');
    const facturesEnRetard = enrichedFactures.filter(f => f.statut === 'EN_RETARD');
    
    const montantTotal = enrichedFactures.reduce((sum, f) => sum + f.montant_ttc, 0);
    const montantPaye = facturesPayees.reduce((sum, f) => sum + f.montant_ttc, 0);
    const montantImpaye = facturesImpayees.reduce((sum, f) => sum + f.montant_ttc, 0);

    return {
      totalFactures,
      facturesPayees: facturesPayees.length,
      facturesImpayees: facturesImpayees.length,
      facturesEnRetard: facturesEnRetard.length,
      montantTotal,
      montantPaye,
      montantImpaye
    };
  }, [enrichedFactures]);

  // Filtrage des factures
  const filteredFactures = useMemo(() => {
    let result = [...enrichedFactures];

    // Filtre par statut
    if (filterStatut === 'payees') {
      result = result.filter(f => f.statut === 'PAYEE');
    } else if (filterStatut === 'impayees') {
      result = result.filter(f => f.statut === 'ENVOYEE' || f.statut === 'EN_RETARD');
    } else if (filterStatut === 'en_retard') {
      result = result.filter(f => f.statut === 'EN_RETARD');
    }

    // Filtre par recherche
    if (searchTerm) {
      result = result.filter(f =>
        f.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.client?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri par date d'émission décroissante
    return result.sort((a, b) => new Date(b.date_emission).getTime() - new Date(a.date_emission).getTime());
  }, [enrichedFactures, filterStatut, searchTerm]);

  const handleOpenPaiement = (factureId: string) => {
    const facture = enrichedFactures.find(f => f.id === factureId);
    if (facture) {
      setSelectedFacture(factureId);
      setPaiementData({
        montant: facture.montant_ttc,
        mode: 'VIREMENT',
        reference: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setIsPaiementDialogOpen(true);
    }
  };

  const handleEnregistrerPaiement = async () => {
    if (!paiementData.montant || !selectedFacture) {
      toast.error('Veuillez saisir le montant');
      return;
    }
    
    try {
      await createPaiement.mutateAsync({
        facture_id: selectedFacture,
        date: paiementData.date,
        montant: paiementData.montant,
        mode: paiementData.mode,
        reference: paiementData.reference || null,
        commentaire: null,
        created_by: user?.id || ''
      });
      
      // Mettre à jour le statut de la facture
      await updateFacture.mutateAsync({
        id: selectedFacture,
        statut: 'PAYEE'
      });
      
      setIsPaiementDialogOpen(false);
      setSelectedFacture(null);
    } catch (error) {
      // Error handled in hooks
    }
  };

  const selectedFactureData = selectedFacture ? enrichedFactures.find(f => f.id === selectedFacture) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Factures Conseils"
        subtitle="Suivi des facturations et paiements"
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatut('all')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalFactures}</p>
                  <p className="text-sm text-muted-foreground">Total factures</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatut('payees')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.facturesPayees}</p>
                  <p className="text-sm text-muted-foreground">Payées</p>
                  <p className="text-xs text-success font-medium">{formatCurrency(stats.montantPaye)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatut('impayees')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.facturesImpayees}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-xs text-warning font-medium">{formatCurrency(stats.montantImpaye)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatut('en_retard')}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.facturesEnRetard}</p>
                  <p className="text-sm text-muted-foreground">En retard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filterStatut} onValueChange={(v) => setFilterStatut(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="impayees">Impayées</TabsTrigger>
              <TabsTrigger value="payees">Payées</TabsTrigger>
              <TabsTrigger value="en_retard">En retard</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tableau des factures */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Émission</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFactures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune facture trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFactures.map((facture) => (
                    <TableRow key={facture.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono">{facture.reference}</TableCell>
                      <TableCell>
                        <button
                          className="text-primary hover:underline font-medium"
                          onClick={() => navigate(`/conseil/clients/${facture.client_id}`)}
                        >
                          {facture.client?.nom}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{facture.mois_concerne}</TableCell>
                      <TableCell>
                        {format(new Date(facture.date_emission), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          new Date(facture.date_echeance) < new Date() && facture.statut !== 'PAYEE' && 'text-destructive font-medium'
                        )}>
                          {format(new Date(facture.date_echeance), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(facture.montant_ttc)}
                      </TableCell>
                      <TableCell>{getStatutFactureBadge(facture.statut as StatutFacture)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/conseil/clients/${facture.client_id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir client
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger PDF
                            </DropdownMenuItem>
                            {(facture.statut === 'ENVOYEE' || facture.statut === 'EN_RETARD') && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenPaiement(facture.id)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Enregistrer paiement
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Relancer par email
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog enregistrement paiement */}
      <Dialog open={isPaiementDialogOpen} onOpenChange={setIsPaiementDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              {selectedFactureData && (
                <>Facture {selectedFactureData.reference} - {selectedFactureData.client?.nom}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date du paiement *</Label>
              <Input
                type="date"
                value={paiementData.date}
                onChange={(e) => setPaiementData({ ...paiementData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Montant (FCFA) *</Label>
              <Input
                type="number"
                value={paiementData.montant}
                onChange={(e) => setPaiementData({ ...paiementData, montant: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Mode de paiement</Label>
              <Select
                value={paiementData.mode}
                onValueChange={(value: ModePaiement) => setPaiementData({ ...paiementData, mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIREMENT">Virement</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="WAVE">Wave</SelectItem>
                  <SelectItem value="OM">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Référence (optionnel)</Label>
              <Input
                value={paiementData.reference}
                onChange={(e) => setPaiementData({ ...paiementData, reference: e.target.value })}
                placeholder="N° de virement, chèque..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaiementDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEnregistrerPaiement} disabled={createPaiement.isPending}>
              {createPaiement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
