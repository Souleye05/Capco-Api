import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Search, 
  Building2,
  Filter,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useEncaissementsLoyers, useImmeubles, useLots, useCreateEncaissementLoyer } from '@/hooks/useImmobilier';
import { useAuth } from '@/contexts/AuthContext';

interface LoyerAttendu {
  id: string;
  lot_id: string;
  lot_numero: string;
  immeuble_id: string;
  immeuble_nom: string;
  locataire_nom: string;
  mois: string;
  montant_attendu: number;
  taux_commission: number;
  statut: 'IMPAYE' | 'PAYE';
  encaissement_id?: string;
}

export default function ImpayesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: encaissements = [], isLoading: encLoading } = useEncaissementsLoyers();
  const { data: immeubles = [], isLoading: immLoading } = useImmeubles();
  const { data: lots = [], isLoading: lotsLoading } = useLots();
  const createEncaissement = useCreateEncaissementLoyer();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
  const [selectedMois, setSelectedMois] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [showPaidOnly, setShowPaidOnly] = useState<string>('impayes');

  // Dialog paiement
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [selectedLoyer, setSelectedLoyer] = useState<LoyerAttendu | null>(null);
  const [paiementMontant, setPaiementMontant] = useState('');
  const [paiementMode, setPaiementMode] = useState<'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM'>('VIREMENT');
  const [paiementDate, setPaiementDate] = useState<Date>(new Date());

  const isLoading = encLoading || immLoading || lotsLoading;

  // Générer les 12 derniers mois pour le select
  const availableMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(format(date, 'yyyy-MM'));
    }
    return months;
  }, []);

  // Générer la liste des loyers attendus pour le mois sélectionné
  const loyersAttendus: LoyerAttendu[] = useMemo(() => {
    const [year, month] = selectedMois.split('-').map(Number);
    
    return lots
      .filter(lot => lot.statut === 'OCCUPE')
      .map(lot => {
        const immeuble = immeubles.find(i => i.id === lot.immeuble_id);
        
        // Vérifier si un encaissement existe pour ce lot et ce mois
        const encaissement = encaissements.find(e => 
          e.lot_id === lot.id && 
          e.mois_concerne === selectedMois
        );
        
        return {
          id: `${lot.id}-${selectedMois}`,
          lot_id: lot.id,
          lot_numero: lot.numero,
          immeuble_id: lot.immeuble_id,
          immeuble_nom: immeuble?.nom || 'N/A',
          locataire_nom: (lot as any).locataires?.nom || 'N/A',
          mois: selectedMois,
          montant_attendu: lot.loyer_mensuel_attendu,
          taux_commission: immeuble?.taux_commission_capco || 5,
          statut: encaissement ? 'PAYE' : 'IMPAYE',
          encaissement_id: encaissement?.id
        } as LoyerAttendu;
      })
      .filter(loyer => {
        // Filtre par immeuble
        if (selectedImmeuble !== 'all' && loyer.immeuble_id !== selectedImmeuble) return false;
        
        // Filtre par recherche
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!loyer.lot_numero.toLowerCase().includes(query) && 
              !loyer.immeuble_nom.toLowerCase().includes(query) &&
              !loyer.locataire_nom.toLowerCase().includes(query)) {
            return false;
          }
        }
        
        // Filtre par statut
        if (showPaidOnly === 'impayes' && loyer.statut === 'PAYE') return false;
        if (showPaidOnly === 'payes' && loyer.statut === 'IMPAYE') return false;
        
        return true;
      });
  }, [lots, immeubles, encaissements, selectedMois, selectedImmeuble, searchQuery, showPaidOnly]);

  const totalAttendu = loyersAttendus.reduce((sum, l) => sum + l.montant_attendu, 0);
  const totalImpayes = loyersAttendus.filter(l => l.statut === 'IMPAYE').reduce((sum, l) => sum + l.montant_attendu, 0);
  const totalPayes = loyersAttendus.filter(l => l.statut === 'PAYE').reduce((sum, l) => sum + l.montant_attendu, 0);
  const nbImpayes = loyersAttendus.filter(l => l.statut === 'IMPAYE').length;

  const openPaiementDialog = (loyer: LoyerAttendu) => {
    setSelectedLoyer(loyer);
    setPaiementMontant(loyer.montant_attendu.toString());
    setPaiementMode('VIREMENT');
    setPaiementDate(new Date());
    setPaiementDialogOpen(true);
  };

  const handleSubmitPaiement = async () => {
    if (!selectedLoyer) return;
    
    const montant = parseFloat(paiementMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    const commission = montant * (selectedLoyer.taux_commission / 100);
    const netProprietaire = montant - commission;
    
    try {
      await createEncaissement.mutateAsync({
        lot_id: selectedLoyer.lot_id,
        date_encaissement: format(paiementDate, 'yyyy-MM-dd'),
        mois_concerne: selectedLoyer.mois,
        montant_encaisse: montant,
        mode_paiement: paiementMode,
        commission_capco: commission,
        net_proprietaire: netProprietaire,
        observation: null,
        created_by: user?.id || ''
      });
      
      setPaiementDialogOpen(false);
      setSelectedLoyer(null);
      toast.success('Paiement enregistré avec succès');
    } catch (error) {
      // Error handled in hook
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedImmeuble('all');
    setShowPaidOnly('impayes');
  };

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
        title="Impayés de loyers" 
        subtitle={`${nbImpayes} impayé(s) pour ${format(new Date(selectedMois + '-01'), 'MMMM yyyy', { locale: fr })}`}
      />

      <div className="p-6 animate-fade-in space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loyers attendus</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAttendu)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(nbImpayes > 0 && "border-destructive/50")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Impayés ({nbImpayes})</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalImpayes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Encaissés</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalPayes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label className="mb-2 block">Mois concerné</Label>
                <Select value={selectedMois} onValueChange={setSelectedMois}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(mois => (
                      <SelectItem key={mois} value={mois}>
                        {format(new Date(mois + '-01'), 'MMMM yyyy', { locale: fr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Immeuble</Label>
                <Select value={selectedImmeuble} onValueChange={setSelectedImmeuble}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les immeubles</SelectItem>
                    {immeubles.map(imm => (
                      <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Statut</Label>
                <Select value={showPaidOnly} onValueChange={setShowPaidOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="impayes">Impayés uniquement</SelectItem>
                    <SelectItem value="payes">Payés uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Lot, immeuble..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  Effacer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Immeuble</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Montant attendu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loyersAttendus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun loyer trouvé pour ce mois
                  </TableCell>
                </TableRow>
              ) : (
                loyersAttendus.map(loyer => (
                  <TableRow key={loyer.id} className={cn(loyer.statut === 'IMPAYE' && 'bg-destructive/5')}>
                    <TableCell>
                      <div 
                        className="flex items-center gap-2 hover:text-primary cursor-pointer"
                        onClick={() => navigate(`/immobilier/immeubles/${loyer.immeuble_id}`)}
                      >
                        <Building2 className="h-4 w-4" />
                        {loyer.immeuble_nom}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{loyer.lot_numero}</Badge>
                    </TableCell>
                    <TableCell>{loyer.locataire_nom}</TableCell>
                    <TableCell>
                      {format(new Date(loyer.mois + '-01'), 'MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(loyer.montant_attendu)}
                    </TableCell>
                    <TableCell>
                      {loyer.statut === 'PAYE' ? (
                        <Badge className="bg-success/20 text-success hover:bg-success/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Payé
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Impayé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {loyer.statut === 'IMPAYE' && (
                        <Button 
                          size="sm" 
                          onClick={() => openPaiementDialog(loyer)}
                        >
                          Enregistrer paiement
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog paiement */}
      <Dialog open={paiementDialogOpen} onOpenChange={setPaiementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              {selectedLoyer && (
                <>Lot {selectedLoyer.lot_numero} - {selectedLoyer.immeuble_nom} - {format(new Date(selectedLoyer.mois + '-01'), 'MMMM yyyy', { locale: fr })}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Date de paiement</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(paiementDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={paiementDate}
                    onSelect={(d) => d && setPaiementDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Montant (FCFA)</Label>
              <Input
                type="number"
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(e.target.value)}
                className="mt-2"
              />
              {selectedLoyer && (
                <p className="text-sm text-muted-foreground mt-1">
                  Montant attendu : {formatCurrency(selectedLoyer.montant_attendu)}
                </p>
              )}
            </div>
            
            <div>
              <Label>Mode de paiement</Label>
              <Select value={paiementMode} onValueChange={(v) => setPaiementMode(v as any)}>
                <SelectTrigger className="mt-2">
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
            
            {selectedLoyer && paiementMontant && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Commission CAPCO ({selectedLoyer.taux_commission}%)</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(paiementMontant) * (selectedLoyer.taux_commission / 100))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net propriétaire</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(paiementMontant) * (1 - selectedLoyer.taux_commission / 100))}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaiementDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitPaiement} disabled={createEncaissement.isPending}>
              {createEncaissement.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
