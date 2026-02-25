import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { parseDateFromAPI } from '@/lib/date-utils';
import {
  Plus,
  FileText,
  Building2,
  Download,
  Eye,
  Send,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Users,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { generateRapportPDF } from '@/utils/generateRapportPDF';
import {
  useRapportsGestion,
  useImmeubles,
  useLots,
  useEncaissementsLoyers,
  useDepensesImmeubles,
  useCreateRapportGestion,
  RapportGestionDB,
  DepenseImmeubleDB
} from '@/hooks/useImmobilier';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';

type TypeDepenseImmeuble = 'PLOMBERIE_ASSAINISSEMENT' | 'ELECTRICITE_ECLAIRAGE' | 'ENTRETIEN_MAINTENANCE' | 'SECURITE_GARDIENNAGE_ASSURANCE' | 'AUTRES_DEPENSES';

const typeDepenseLabels: Record<TypeDepenseImmeuble, string> = {
  PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
  ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
  ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance générale',
  SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
  AUTRES_DEPENSES: 'Autres dépenses'
};

export default function RapportsPage() {
  const { user } = useNestJSAuth();
  const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<RapportGestionDB | null>(null);

  // Generate dialog state
  const [genImmeuble, setGenImmeuble] = useState<string>('');
  const [genDateDebut, setGenDateDebut] = useState<Date | undefined>();
  const [genDateFin, setGenDateFin] = useState<Date | undefined>();

  // Fetch data from database
  const { data: rapports = [], isLoading: rapportsLoading } = useRapportsGestion(
    selectedImmeuble !== 'all' ? selectedImmeuble : undefined
  );
  const { data: immeubles = [], isLoading: immeublesLoading } = useImmeubles();
  const { data: lots = [] } = useLots();
  const { data: encaissements = [] } = useEncaissementsLoyers();
  const { data: depenses = [] } = useDepensesImmeubles();
  const createRapport = useCreateRapportGestion();

  const isLoading = rapportsLoading || immeublesLoading;

  // Calculate detailed report data for preview
  const reportDetails = useMemo(() => {
    if (!selectedRapport) return null;

    const immeubleLots = lots.filter(l => l.immeubleId === selectedRapport.immeubleId);
    const immeubleEncaissements = encaissements.filter(e => {
      const lot = lots.find(l => l.id === e.lotId);
      return lot?.immeubleId === selectedRapport.immeubleId;
    });
    const immeubleDepenses = depenses.filter(d => d.immeubleId === selectedRapport.immeubleId);

    // Group encaissements by lot to determine who paid
    const paidLotIds = new Set(immeubleEncaissements.map(e => e.lotId));

    const locatairesStatus = immeubleLots.filter(l => l.statut === 'OCCUPE').map(lot => ({
      lot,
      locataire: lot.locataires,
      hasPaid: paidLotIds.has(lot.id),
      paiement: immeubleEncaissements.find(e => e.lotId === lot.id)
    }));

    // Group expenses by type
    const expensesByType = immeubleDepenses.reduce((acc, dep) => {
      const type = dep.typeDepense;
      if (!acc[type]) {
        acc[type] = { total: 0, items: [] };
      }
      acc[type].total += dep.montant;
      acc[type].items.push(dep);
      return acc;
    }, {} as Record<TypeDepenseImmeuble, { total: number; items: DepenseImmeubleDB[] }>);

    return {
      locatairesStatus,
      expensesByType,
      totalPaid: locatairesStatus.filter(l => l.hasPaid).length,
      totalUnpaid: locatairesStatus.filter(l => !l.hasPaid).length
    };
  }, [selectedRapport, lots, encaissements, depenses]);

  const handleGenerate = async () => {
    if (!genImmeuble || !genDateDebut || !genDateFin || !user) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // Calculate totals for the period
    const immeubleLots = lots.filter(l => l.immeubleId === genImmeuble);
    const selectedImmeubleData = immeubles.find(i => i.id === genImmeuble);

    const immeubleEncaissements = encaissements.filter(e => {
      const lot = lots.find(l => l.id === e.lotId);
      if (!lot || lot.immeubleId !== genImmeuble) return false;
      const encDate = new Date(e.dateEncaissement);
      return encDate >= genDateDebut && encDate <= genDateFin;
    });

    const immeubleDepenses = depenses.filter(d => {
      if (d.immeubleId !== genImmeuble) return false;
      const depDate = new Date(d.date);
      return depDate >= genDateDebut && depDate <= genDateFin;
    });

    const totalLoyers = immeubleEncaissements.reduce((sum, e) => sum + e.montantEncaisse, 0);
    const totalDepenses = immeubleDepenses.reduce((sum, d) => sum + d.montant, 0);
    const tauxCommission = selectedImmeubleData?.tauxCommissionCapco || 10;
    const totalCommissions = totalLoyers * (tauxCommission / 100);
    const netProprietaire = totalLoyers - totalDepenses - totalCommissions;

    await createRapport.mutateAsync({
      immeubleId: genImmeuble,
      periodeDebut: format(genDateDebut, 'yyyy-MM-dd'),
      periodeFin: format(genDateFin, 'yyyy-MM-dd'),
      totalLoyers: totalLoyers,
      totalDepenses: totalDepenses,
      totalCommissions: totalCommissions,
      netProprietaire: netProprietaire,
      genererPar: user.id,
      statut: 'GENERE'
    });

    setShowGenerateDialog(false);
    setGenImmeuble('');
    setGenDateDebut(undefined);
    setGenDateFin(undefined);
  };

  const handlePreview = (rapport: RapportGestionDB) => {
    setSelectedRapport(rapport);
    setShowPreviewDialog(true);
  };

  const handleDownload = async (rapport: RapportGestionDB) => {
    // Calculate report details for PDF
    const immeubleLots = lots.filter(l => l.immeubleId === rapport.immeubleId);
    const immeubleEncaissements = encaissements.filter(e => {
      const lot = lots.find(l => l.id === e.lotId);
      return lot?.immeubleId === rapport.immeubleId;
    });
    const immeubleDepenses = depenses.filter(d => d.immeubleId === rapport.immeubleId);

    const paidLotIds = new Set(immeubleEncaissements.map(e => e.lotId));

    const locatairesStatus = immeubleLots.filter(l => l.statut === 'OCCUPE').map(lot => ({
      lot: {
        id: lot.id,
        numero: lot.numero,
        type: lot.type,
        loyerMensuelAttendu: lot.loyerMensuelAttendu,
        locataire: lot.locataires ? { nom: lot.locataires.nom } : null
      },
      hasPaid: paidLotIds.has(lot.id),
      paiement: immeubleEncaissements.find(e => e.lotId === lot.id) ? {
        montantEncaisse: immeubleEncaissements.find(e => e.lotId === lot.id)!.montantEncaisse
      } : undefined
    }));

    const expensesByType = immeubleDepenses.reduce((acc, dep) => {
      const type = dep.typeDepense;
      if (!acc[type]) {
        acc[type] = { total: 0, items: [] as { id: string; nature: string; description?: string | null; date: string; montant: number; typeDepense: TypeDepenseImmeuble }[] };
      }
      acc[type].total += dep.montant;
      acc[type].items.push({
        id: dep.id,
        nature: dep.nature,
        description: dep.description,
        date: dep.date,
        montant: dep.montant,
        typeDepense: dep.typeDepense
      });
      return acc;
    }, {} as Record<TypeDepenseImmeuble, { total: number; items: { id: string; nature: string; description?: string | null; date: string; montant: number; typeDepense: TypeDepenseImmeuble }[] }>);

    // Transform rapport to match expected format
    const rapportForPdf = {
      id: rapport.id,
      immeubleId: rapport.immeubleId,
      periodeDebut: rapport.periodeDebut,
      periodeFin: rapport.periodeFin,
      totalLoyers: rapport.totalLoyers,
      totalDepenses: rapport.totalDepenses,
      totalCommissions: rapport.totalCommissions,
      netProprietaire: rapport.netProprietaire,
      dateGeneration: rapport.dateGeneration,
      statut: rapport.statut,
      immeuble: rapport.immeubles ? {
        id: rapport.immeubles.id,
        nom: rapport.immeubles.nom,
        adresse: rapport.immeubles.adresse,
        tauxCommissionCAPCO: rapport.immeubles.tauxCommissionCapco,
        proprietaire: rapport.immeubles.proprietaires ? {
          nom: rapport.immeubles.proprietaires.nom
        } : undefined
      } : undefined
    };

    await generateRapportPDF({
      rapport: rapportForPdf,
      locatairesStatus,
      expensesByType
    });

    toast.success(`Rapport PDF téléchargé avec succès`);
  };

  const handleSend = (rapport: RapportGestionDB) => {
    toast.success('Rapport envoyé au propriétaire par email');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-immobilier" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Rapports de gestion"
        subtitle={`${rapports.length} rapports générés`}
        actions={
          <Button className="gap-2" onClick={() => setShowGenerateDialog(true)}>
            <Plus className="h-4 w-4" />
            Générer un rapport
          </Button>
        }
      />

      <div className="p-6 animate-fade-in space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label>Filtrer par immeuble:</Label>
          </div>
          <Select value={selectedImmeuble} onValueChange={setSelectedImmeuble}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Tous les immeubles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les immeubles</SelectItem>
              {immeubles.map(imm => (
                <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reports list */}
        {rapports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">Aucun rapport généré</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Cliquez sur "Générer un rapport" pour créer votre premier rapport de gestion.
              </p>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Générer un rapport
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rapports.map(rapport => (
              <Card key={rapport.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-immobilier/10">
                        <FileText className="h-6 w-6 text-immobilier" />
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {rapport.immeubles?.nom}
                        </h3>
                        <p className="text-lg font-medium mt-1">
                          Rapport {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeDebut))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Période: {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeDebut))} - {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeFin))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Généré le {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.dateGeneration))}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      rapport.statut === 'GENERE' && 'bg-success/10 text-success',
                      rapport.statut === 'ENVOYE' && 'bg-primary/10 text-primary',
                      rapport.statut === 'BROUILLON' && 'bg-muted text-muted-foreground'
                    )}>
                      {rapport.statut}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Loyers encaissés</p>
                      <p className="text-lg font-semibold text-success">{formatCurrency(rapport.totalLoyers)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Dépenses</p>
                      <p className="text-lg font-semibold text-destructive">-{formatCurrency(rapport.totalDepenses)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Commissions CAPCO</p>
                      <p className="text-lg font-semibold text-immobilier">-{formatCurrency(rapport.totalCommissions)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Net propriétaire</p>
                      <p className="text-lg font-bold">{formatCurrency(rapport.netProprietaire)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handlePreview(rapport)}>
                      <Eye className="h-4 w-4" />
                      Aperçu
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownload(rapport)}>
                      <Download className="h-4 w-4" />
                      Télécharger PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleSend(rapport)}>
                      <Send className="h-4 w-4" />
                      Envoyer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Générer un rapport de gestion</DialogTitle>
            <DialogDescription>
              Sélectionnez l'immeuble et la période pour générer le rapport.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Immeuble</Label>
              <Select value={genImmeuble} onValueChange={setGenImmeuble}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un immeuble" />
                </SelectTrigger>
                <SelectContent>
                  {immeubles.map(imm => (
                    <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {genDateDebut ? format(genDateDebut, 'dd/MM/yyyy') : 'Début'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={genDateDebut}
                      onSelect={setGenDateDebut}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Date fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {genDateFin ? format(genDateFin, 'dd/MM/yyyy') : 'Fin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={genDateFin}
                      onSelect={setGenDateFin}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Annuler</Button>
            <Button onClick={handleGenerate} disabled={createRapport.isPending}>
              {createRapport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Générer le rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - Detailed Report */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport de gestion détaillé</DialogTitle>
          </DialogHeader>

          {selectedRapport && reportDetails && (
            <div className="space-y-6 py-4">
              {/* Header */}
              <div className="text-center border-b pb-6">
                <h2 className="text-2xl font-bold">CABINET CAPCO</h2>
                <p className="text-muted-foreground">Rapport de gestion immobilière</p>
              </div>

              {/* Building info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Immeuble</h3>
                  <p className="font-medium text-lg">{selectedRapport.immeubles?.nom}</p>
                  <p className="text-sm text-muted-foreground">{selectedRapport.immeubles?.adresse}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Propriétaire</h3>
                  <p className="font-medium text-lg">{selectedRapport.immeubles?.proprietaireNom}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Période</h3>
                <p className="font-medium">
                  Du {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(selectedRapport.periodeDebut))} au {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(selectedRapport.periodeFin))}
                </p>
              </div>

              <Separator />

              <Tabs defaultValue="locataires" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="locataires" className="gap-2">
                    <Users className="h-4 w-4" />
                    Locataires ({reportDetails.locatairesStatus.length})
                  </TabsTrigger>
                  <TabsTrigger value="depenses" className="gap-2">
                    Dépenses
                  </TabsTrigger>
                  <TabsTrigger value="resume" className="gap-2">
                    Résumé financier
                  </TabsTrigger>
                </TabsList>

                {/* Locataires Tab */}
                <TabsContent value="locataires" className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <Badge className="bg-success/10 text-success gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {reportDetails.totalPaid} payé(s)
                    </Badge>
                    <Badge className="bg-destructive/10 text-destructive gap-1">
                      <XCircle className="h-3 w-3" />
                      {reportDetails.totalUnpaid} impayé(s)
                    </Badge>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Locataire</th>
                          <th className="text-left px-4 py-3 font-medium">Appartement</th>
                          <th className="text-left px-4 py-3 font-medium">Loyer attendu</th>
                          <th className="text-left px-4 py-3 font-medium">Montant payé</th>
                          <th className="text-left px-4 py-3 font-medium">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportDetails.locatairesStatus.map((item, idx) => (
                          <tr key={item.lot.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                            <td className="px-4 py-3 font-medium">{item.locataire?.nom || '-'}</td>
                            <td className="px-4 py-3">{item.lot.numero} ({item.lot.type})</td>
                            <td className="px-4 py-3">{formatCurrency(item.lot.loyerMensuelAttendu)}</td>
                            <td className="px-4 py-3">
                              {item.paiement ? formatCurrency(item.paiement.montantEncaisse) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {item.hasPaid ? (
                                <Badge className="bg-success/10 text-success gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Payé
                                </Badge>
                              ) : (
                                <Badge className="bg-destructive/10 text-destructive gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Impayé
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Dépenses Tab */}
                <TabsContent value="depenses" className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Type de dépense</th>
                          <th className="text-left px-4 py-3 font-medium">Désignation</th>
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-right px-4 py-3 font-medium">Montant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportDetails.expensesByType).map(([type, data]) => (
                          <>
                            {/* Type header */}
                            <tr key={`header-${type}`} className="bg-muted/30">
                              <td colSpan={3} className="px-4 py-2 font-semibold">
                                {typeDepenseLabels[type as TypeDepenseImmeuble]}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold">
                                {formatCurrency(data.total)}
                              </td>
                            </tr>
                            {/* Individual items */}
                            {data.items.map((dep, idx) => (
                              <tr key={dep.id} className={idx % 2 === 0 ? '' : 'bg-muted/10'}>
                                <td className="px-4 py-2 pl-8 text-muted-foreground">└</td>
                                <td className="px-4 py-2">{dep.nature}</td>
                                <td className="px-4 py-2">{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(dep.date))}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(dep.montant)}</td>
                              </tr>
                            ))}
                          </>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50 border-t-2">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 font-bold">TOTAL DES DÉPENSES</td>
                          <td className="px-4 py-3 text-right font-bold text-destructive">
                            {formatCurrency(selectedRapport.totalDepenses)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </TabsContent>

                {/* Résumé financier Tab */}
                <TabsContent value="resume" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 px-4 border rounded-lg">
                      <span className="font-medium">Loyers encaissés</span>
                      <span className="text-lg font-semibold text-success">+{formatCurrency(selectedRapport.totalLoyers)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 border rounded-lg">
                      <span className="font-medium">Total des dépenses</span>
                      <span className="text-lg font-semibold text-destructive">-{formatCurrency(selectedRapport.totalDepenses)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 border rounded-lg">
                      <span className="font-medium">Commission CAPCO ({selectedRapport.immeubles?.tauxCommissionCapco}%)</span>
                      <span className="text-lg font-semibold text-immobilier">-{formatCurrency(selectedRapport.totalCommissions)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-4 px-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                      <span className="font-bold text-lg">Net à reverser au propriétaire</span>
                      <span className="text-2xl font-bold">{formatCurrency(selectedRapport.netProprietaire)}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Rapport généré le {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(parseDateFromAPI(selectedRapport.dateGeneration))}</p>
                <p>Cabinet CAPCO - Gestion Immobilière</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>Fermer</Button>
            <Button onClick={() => selectedRapport && handleDownload(selectedRapport)} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



