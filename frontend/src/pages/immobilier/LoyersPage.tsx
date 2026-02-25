import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { parseDateFromAPI } from '@/lib/date-utils';
import {
  Plus,
  Search,
  Receipt,
  Building2,
  Filter,
  Download,
  Calendar,
  Loader2
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
import { useQuery } from '@tanstack/react-query';
import { useImmeubles, useLots, useCreateEncaissementLoyer, Encaissement } from '@/hooks/useImmobilier';
import { nestjsApi } from '@/integrations/nestjs/client';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';


export default function LoyersPage() {
  const navigate = useNavigate();

  const { data: immeubles = [], isLoading: immLoading } = useImmeubles();
  const { data: lots = [], isLoading: lotsLoading } = useLots();
  const createEncaissement = useCreateEncaissementLoyer();

  // Aggregate encaissements from all immeubles
  const { data: encaissements = [], isLoading: encLoading } = useQuery({
    queryKey: ['encaissements', 'all', immeubles.map(i => i.id)],
    queryFn: async () => {
      if (immeubles.length === 0) return [] as Encaissement[];
      const results = await Promise.all(
        immeubles.map(imm =>
          nestjsApi.getEncaissementsByImmeuble(imm.id).then(r => (r.data as Encaissement[]) || [])
        )
      );
      return results.flat();
    },
    enabled: immeubles.length > 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
  const [selectedLot, setSelectedLot] = useState<string>('all');
  const [selectedMois, setSelectedMois] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();

  // Dialog nouvel encaissement
  const [encaissementDialogOpen, setEncaissementDialogOpen] = useState(false);
  const [encaissementImmeuble, setEncaissementImmeuble] = useState('');
  const [encaissementLot, setEncaissementLot] = useState('');
  const [encaissementMois, setEncaissementMois] = useState('');
  const [encaissementMontant, setEncaissementMontant] = useState('');
  const [encaissementMode, setEncaissementMode] = useState<'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM'>('VIREMENT');

  const isLoading = encLoading || immLoading || lotsLoading;

  // Enrichir les lots avec les immeubles
  const enrichedLots = lots.map(lot => ({
    ...lot,
    immeuble: immeubles.find(i => i.id === lot.immeubleId)
  }));

  // Lots disponibles pour le dialog en fonction de l'immeuble sélectionné
  const lotsForDialog = encaissementImmeuble
    ? enrichedLots.filter(l => l.immeubleId === encaissementImmeuble && l.statut === 'OCCUPE')
    : [];

  // Get unique months
  const uniqueMois = [...new Set(encaissements.map(e => e.moisConcerne))].sort().reverse();

  // Filter lots based on selected immeuble
  const availableLots = selectedImmeuble === 'all'
    ? enrichedLots
    : enrichedLots.filter(l => l.immeubleId === selectedImmeuble);

  // Enrichir les encaissements avec lot et immeuble
  const enrichedEncaissements = encaissements.map(enc => {
    const lot = enrichedLots.find(l => l.id === enc.lotId);
    return { ...enc, lot };
  });

  const filteredEncaissements = useMemo(() => {
    return enrichedEncaissements.filter(enc => {
      const matchesSearch =
        enc.lot?.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enc.lot?.immeuble?.nom.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesImmeuble = selectedImmeuble === 'all' || enc.lot?.immeubleId === selectedImmeuble;
      const matchesLot = selectedLot === 'all' || enc.lotId === selectedLot;
      const matchesMois = selectedMois === 'all' || enc.moisConcerne === selectedMois;
      const matchesDateDebut = !dateDebut || new Date(enc.dateEncaissement) >= dateDebut;
      const matchesDateFin = !dateFin || new Date(enc.dateEncaissement) <= dateFin;

      return matchesSearch && matchesImmeuble && matchesLot && matchesMois && matchesDateDebut && matchesDateFin;
    });
  }, [enrichedEncaissements, searchQuery, selectedImmeuble, selectedLot, selectedMois, dateDebut, dateFin]);

  const totalEncaisse = filteredEncaissements.reduce((sum, e) => sum + e.montantEncaisse, 0);
  const totalCommissions = filteredEncaissements.reduce((sum, e) => sum + e.commissionCapco, 0);
  const totalNetProprietaire = filteredEncaissements.reduce((sum, e) => sum + e.netProprietaire, 0);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedImmeuble('all');
    setSelectedLot('all');
    setSelectedMois('all');
    setDateDebut(undefined);
    setDateFin(undefined);
  };

  const handleExport = () => {
    toast.success('Export des données en cours...');
  };

  const handleSubmitEncaissement = async () => {
    const montant = parseFloat(encaissementMontant);
    if (!encaissementImmeuble) {
      toast.error('Veuillez sélectionner un immeuble');
      return;
    }
    if (!encaissementLot) {
      toast.error('Veuillez sélectionner un lot');
      return;
    }
    if (!encaissementMois) {
      toast.error('Veuillez sélectionner le mois concerné');
      return;
    }
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }

    const selectedImmeubleData = immeubles.find(i => i.id === encaissementImmeuble);
    const tauxCommission = selectedImmeubleData?.tauxCommissionCapco || 5;
    const commission = montant * (tauxCommission / 100);
    const netProprietaire = montant - commission;

    try {
      await createEncaissement.mutateAsync({
        lotId: encaissementLot,
        dateEncaissement: format(new Date(), 'yyyy-MM-dd'),
        moisConcerne: encaissementMois,
        montantEncaisse: montant,
        modePaiement: encaissementMode,
      });

      setEncaissementDialogOpen(false);
      setEncaissementImmeuble('');
      setEncaissementLot('');
      setEncaissementMois('');
      setEncaissementMontant('');
      setEncaissementMode('VIREMENT');
    } catch (error) {
      // Error handled in hook
    }
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
        title="Encaissements de loyers"
        subtitle={`${encaissements.length} encaissements`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button className="gap-2" onClick={() => setEncaissementDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvel encaissement
            </Button>
          </div>
        }
      />

      <div className="p-6 animate-fade-in space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Receipt className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total encaissé</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalEncaisse)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-immobilier/10">
                  <Receipt className="h-6 w-6 text-immobilier" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commissions CAPCO</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCommissions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net propriétaires</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalNetProprietaire)}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Label className="mb-2 block">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Locataire, lot, immeuble..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Immeuble</Label>
                <Select value={selectedImmeuble} onValueChange={(v) => { setSelectedImmeuble(v); setSelectedLot('all'); }}>
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
                <Label className="mb-2 block">Lot</Label>
                <Select value={selectedLot} onValueChange={setSelectedLot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les lots</SelectItem>
                    {availableLots.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>{lot.numero} - {lot.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Mois</Label>
                <Select value={selectedMois} onValueChange={setSelectedMois}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {uniqueMois.map(mois => (
                      <SelectItem key={mois} value={mois}>
                        {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(mois + '-01'))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  Effacer
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="mb-2 block">Date début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateDebut ? format(dateDebut, 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateDebut}
                      onSelect={setDateDebut}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="mb-2 block">Date fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFin ? format(dateFin, 'dd/MM/yyyy') : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFin}
                      onSelect={setDateFin}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Immeuble</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Mois</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEncaissements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucun encaissement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredEncaissements.map(enc => (
                  <TableRow key={enc.id}>
                    <TableCell>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.dateEncaissement))}</TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-2 hover:text-primary cursor-pointer"
                        onClick={() => navigate(`/immobilier/immeubles/${enc.lot?.immeubleId}`)}
                      >
                        <Building2 className="h-4 w-4" />
                        {enc.lot?.immeuble?.nom}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{enc.lot?.numero}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.moisConcerne + '-01'))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{enc.modePaiement}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(enc.montantEncaisse)}
                    </TableCell>
                    <TableCell className="text-right text-immobilier">
                      {formatCurrency(enc.commissionCapco)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(enc.netProprietaire)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredEncaissements.length > 0 && (
          <div className="flex justify-end gap-8 p-4 bg-muted/50 rounded-lg">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total encaissé</p>
              <p className="text-lg font-bold">{formatCurrency(totalEncaisse)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total commissions</p>
              <p className="text-lg font-bold text-immobilier">{formatCurrency(totalCommissions)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total net</p>
              <p className="text-lg font-bold">{formatCurrency(totalNetProprietaire)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Nouvel Encaissement */}
      <Dialog open={encaissementDialogOpen} onOpenChange={setEncaissementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel encaissement de loyer</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement de loyer reçu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="encaissement-immeuble">Immeuble</Label>
              <Select value={encaissementImmeuble} onValueChange={(v) => {
                setEncaissementImmeuble(v);
                setEncaissementLot('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un immeuble" />
                </SelectTrigger>
                <SelectContent>
                  {immeubles.map(immeuble => (
                    <SelectItem key={immeuble.id} value={immeuble.id}>
                      {immeuble.nom} - {immeuble.adresse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaissement-lot">Lot (occupé)</Label>
              <Select
                value={encaissementLot}
                onValueChange={setEncaissementLot}
                disabled={!encaissementImmeuble}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un lot" />
                </SelectTrigger>
                <SelectContent>
                  {lotsForDialog.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.numero} - {lot.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mois concerné</Label>
              <Input
                type="month"
                value={encaissementMois}
                onChange={(e) => setEncaissementMois(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Montant encaissé (FCFA)</Label>
              <Input
                type="number"
                placeholder="Ex: 150000"
                value={encaissementMontant}
                onChange={(e) => setEncaissementMontant(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={encaissementMode} onValueChange={(v) => setEncaissementMode(v as typeof encaissementMode)}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncaissementDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitEncaissement} disabled={createEncaissement.isPending}>
              {createEncaissement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

