import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Home,
  FileText,
  Receipt,
  TrendingDown,
  Percent,
  Calendar,
  Filter,
  Download,
  Plus,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { TypeDepenseImmeuble } from '@/types';
import { 
  useImmeuble, 
  useLotsByImmeuble, 
  useEncaissementsLoyers, 
  useDepensesImmeubles, 
  useRapportsGestion,
  useCreateEncaissementLoyer,
  useCreateDepenseImmeuble,
  useCreateRapportGestion
} from '@/hooks/useImmobilier';
import { useAuth } from '@/contexts/AuthContext';
import { generateQuittancePDF, shouldGenerateQuittance } from '@/utils/generateQuittancePDF';
import { generateRapportPDF } from '@/utils/generateRapportPDF';

const typeDepenseLabels: Record<TypeDepenseImmeuble, string> = {
  PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
  ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
  ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance générale',
  SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
  AUTRES_DEPENSES: 'Autres dépenses'
};

export default function ImmeubleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch data from Supabase
  const { data: immeuble, isLoading: immeubleLoading } = useImmeuble(id || '');
  const { data: lots = [], isLoading: lotsLoading } = useLotsByImmeuble(id || '');
  const { data: allEncaissements = [] } = useEncaissementsLoyers();
  const { data: depenses = [] } = useDepensesImmeubles(id);
  const { data: rapports = [] } = useRapportsGestion(id);
  
  const createEncaissement = useCreateEncaissementLoyer();
  const createDepense = useCreateDepenseImmeuble();
  const createRapport = useCreateRapportGestion();
  
  // Filter encaissements for this building's lots
  const lotIds = useMemo(() => lots.map(l => l.id), [lots]);
  const encaissements = useMemo(() => 
    allEncaissements.filter(e => lotIds.includes(e.lot_id)),
    [allEncaissements, lotIds]
  );
  
  // Filters
  const [selectedLot, setSelectedLot] = useState<string>('all');
  const [selectedMois, setSelectedMois] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  
  // Dialog nouvelle dépense
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [depenseType, setDepenseType] = useState<TypeDepenseImmeuble>('AUTRES_DEPENSES');
  const [depenseNature, setDepenseNature] = useState('');
  const [depenseDescription, setDepenseDescription] = useState('');
  const [depenseMontant, setDepenseMontant] = useState('');
  
  // Dialog nouvel encaissement
  const [encaissementDialogOpen, setEncaissementDialogOpen] = useState(false);
  const [encaissementLot, setEncaissementLot] = useState('');
  const [encaissementMois, setEncaissementMois] = useState('');
  const [encaissementMontant, setEncaissementMontant] = useState('');
  const [encaissementMode, setEncaissementMode] = useState('VIREMENT');
  
  const isLoading = immeubleLoading || lotsLoading;
  
  // Filter encaissements
  const filteredEncaissements = useMemo(() => {
    return encaissements.filter(e => {
      if (selectedLot !== 'all' && e.lot_id !== selectedLot) return false;
      if (selectedMois !== 'all' && e.mois_concerne !== selectedMois) return false;
      if (dateDebut && new Date(e.date_encaissement) < dateDebut) return false;
      if (dateFin && new Date(e.date_encaissement) > dateFin) return false;
      return true;
    });
  }, [encaissements, selectedLot, selectedMois, dateDebut, dateFin]);
  
  // Filter depenses
  const filteredDepenses = useMemo(() => {
    return depenses.filter(d => {
      if (dateDebut && new Date(d.date) < dateDebut) return false;
      if (dateFin && new Date(d.date) > dateFin) return false;
      return true;
    });
  }, [depenses, dateDebut, dateFin]);
  
  // Calculate totals
  const totalLoyers = filteredEncaissements.reduce((sum, e) => sum + Number(e.montant_encaisse), 0);
  const totalCommissions = filteredEncaissements.reduce((sum, e) => sum + Number(e.commission_capco), 0);
  const totalDepenses = filteredDepenses.reduce((sum, d) => sum + Number(d.montant), 0);
  const netProprietaire = totalLoyers - totalCommissions - totalDepenses;
  
  // Get unique months
  const uniqueMois = [...new Set(encaissements.map(e => e.mois_concerne))].sort().reverse();
  
  const handleGenererRapport = async () => {
    if (!immeuble || !id) return;
    
    try {
      // Prepare data for the report
      const periodeDebut = dateDebut ? format(dateDebut, 'yyyy-MM-dd') : format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
      const periodeFin = dateFin ? format(dateFin, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      // Create rapport in database
      await createRapport.mutateAsync({
        immeuble_id: id,
        periode_debut: periodeDebut,
        periode_fin: periodeFin,
        total_loyers: totalLoyers,
        total_depenses: totalDepenses,
        total_commissions: totalCommissions,
        net_proprietaire: netProprietaire,
        statut: 'GENERE',
        generer_par: user?.id || ''
      });
      
      // Prepare locataires status for PDF
      const locatairesStatus = lots.map(lot => {
        const lotEncaissements = filteredEncaissements.filter(e => e.lot_id === lot.id);
        const totalPaid = lotEncaissements.reduce((sum, e) => sum + Number(e.montant_encaisse), 0);
        const hasPaid = totalPaid >= Number(lot.loyer_mensuel_attendu);
        
        return {
          lot: {
            id: lot.id,
            numero: lot.numero,
            type: (lot as any).type || 'Lot',
            loyerMensuelAttendu: Number(lot.loyer_mensuel_attendu),
            locataire: (lot as any).locataires ? { nom: (lot as any).locataires.nom } : null
          },
          hasPaid,
          paiement: lotEncaissements.length > 0 ? { montantEncaisse: totalPaid } : undefined
        };
      });
      
      // Group expenses by type
      const expensesByType: Record<string, { total: number; items: any[] }> = {
        PLOMBERIE_ASSAINISSEMENT: { total: 0, items: [] },
        ELECTRICITE_ECLAIRAGE: { total: 0, items: [] },
        ENTRETIEN_MAINTENANCE: { total: 0, items: [] },
        SECURITE_GARDIENNAGE_ASSURANCE: { total: 0, items: [] },
        AUTRES_DEPENSES: { total: 0, items: [] }
      };
      
      filteredDepenses.forEach(dep => {
        const type = dep.type_depense as string;
        if (expensesByType[type]) {
          expensesByType[type].total += Number(dep.montant);
          expensesByType[type].items.push({
            id: dep.id,
            nature: dep.nature,
            description: dep.description,
            date: dep.date,
            montant: Number(dep.montant),
            typeDepense: type
          });
        }
      });
      
      // Generate PDF
      await generateRapportPDF({
        rapport: {
          id: crypto.randomUUID(),
          immeubleId: id,
          periodeDebut,
          periodeFin,
          totalLoyers,
          totalDepenses,
          totalCommissions,
          netProprietaire,
          dateGeneration: new Date().toISOString(),
          statut: 'GENERE',
          immeuble: {
            id,
            nom: immeuble.nom,
            adresse: immeuble.adresse,
            tauxCommissionCAPCO: immeuble.taux_commission_capco,
            proprietaire: (immeuble as any).proprietaires ? { nom: (immeuble as any).proprietaires.nom } : undefined
          }
        },
        locatairesStatus,
        expensesByType: expensesByType as any
      });
      
      toast.success('Rapport de gestion généré avec succès');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erreur lors de la génération du rapport');
    }
  };
  
  const clearFilters = () => {
    setSelectedLot('all');
    setSelectedMois('all');
    setDateDebut(undefined);
    setDateFin(undefined);
  };

  const handleSubmitDepense = async () => {
    if (!id) return;
    
    const montant = parseFloat(depenseMontant);
    if (!depenseNature.trim()) {
      toast.error('Veuillez saisir la nature de la dépense');
      return;
    }
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    try {
      await createDepense.mutateAsync({
        justificatif: null,
        immeuble_id: id,
        type_depense: depenseType,
        nature: depenseNature.trim(),
        description: depenseDescription.trim() || null,
        montant: montant,
        date: format(new Date(), 'yyyy-MM-dd'),
        created_by: user?.id || ''
      });
      
      toast.success('Dépense enregistrée avec succès');
      setDepenseDialogOpen(false);
      setDepenseType('AUTRES_DEPENSES');
      setDepenseNature('');
      setDepenseDescription('');
      setDepenseMontant('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSubmitEncaissement = async () => {
    if (!immeuble) return;
    
    const montant = parseFloat(encaissementMontant);
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
    
    const selectedLotData = lots.find(l => l.id === encaissementLot);
    const commission = montant * (immeuble.taux_commission_capco / 100);
    const net = montant - commission;
    
    try {
      await createEncaissement.mutateAsync({
        lot_id: encaissementLot,
        date_encaissement: format(new Date(), 'yyyy-MM-dd'),
        mois_concerne: encaissementMois,
        montant_encaisse: montant,
        mode_paiement: encaissementMode as any,
        commission_capco: commission,
        net_proprietaire: net,
        observation: null,
        created_by: user?.id || ''
      });
      
      toast.success('Encaissement enregistré avec succès');
      
      // Generate quittance or receipt
      if (selectedLotData) {
        const loyerAttendu = Number(selectedLotData.loyer_mensuel_attendu);
        const documentType = shouldGenerateQuittance(montant, loyerAttendu);
        
        generateQuittancePDF({
          type: documentType,
          locataire: {
            nom: (selectedLotData as any).locataires?.nom || 'N/A'
          },
          proprietaire: {
            nom: (immeuble as any).proprietaires?.nom || 'N/A'
          },
          immeuble: {
            nom: immeuble.nom,
            adresse: immeuble.adresse
          },
          lot: {
            numero: selectedLotData.numero,
            type: (selectedLotData as any).type_lot
          },
          periode: encaissementMois,
          loyerMensuel: loyerAttendu,
          montantPaye: montant,
          datePaiement: format(new Date(), 'yyyy-MM-dd'),
          modePaiement: encaissementMode
        });
        
        toast.success(documentType === 'QUITTANCE' 
          ? 'Quittance de loyer générée' 
          : 'Reçu de paiement partiel généré'
        );
      }
      
      setEncaissementDialogOpen(false);
      setEncaissementLot('');
      setEncaissementMois('');
      setEncaissementMontant('');
      setEncaissementMode('VIREMENT');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDownloadQuittance = (enc: any) => {
    const lot = lots.find(l => l.id === enc.lot_id);
    if (!lot || !immeuble) return;
    
    const loyerAttendu = Number(lot.loyer_mensuel_attendu);
    const montantPaye = Number(enc.montant_encaisse);
    const documentType = shouldGenerateQuittance(montantPaye, loyerAttendu);
    
    generateQuittancePDF({
      type: documentType,
      locataire: {
        nom: (lot as any).locataires?.nom || 'N/A'
      },
      proprietaire: {
        nom: (immeuble as any).proprietaires?.nom || 'N/A'
      },
      immeuble: {
        nom: immeuble.nom,
        adresse: immeuble.adresse
      },
      lot: {
        numero: lot.numero,
        type: (lot as any).type_lot
      },
      periode: enc.mois_concerne,
      loyerMensuel: loyerAttendu,
      montantPaye: montantPaye,
      datePaiement: enc.date_encaissement,
      modePaiement: enc.mode_paiement
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!immeuble) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Immeuble non trouvé</h2>
          <Button onClick={() => navigate('/immobilier/immeubles')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  // Generate month options for encaissement
  const monthOptions = [];
  const today = new Date();
  for (let i = -2; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthOptions.push(format(date, 'yyyy-MM'));
  }

  return (
    <div className="min-h-screen">
      <Header 
        title={immeuble.nom}
        subtitle={immeuble.adresse}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/immobilier/immeubles')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleGenererRapport} className="gap-2">
              <FileText className="h-4 w-4" />
              Générer rapport
            </Button>
          </div>
        }
      />

      <div className="p-6 animate-fade-in space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Receipt className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loyers encaissés</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalLoyers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dépenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDepenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-immobilier/10">
                  <Percent className="h-6 w-6 text-immobilier" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commissions CAPCO ({immeuble.taux_commission_capco}%)</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCommissions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net propriétaire</p>
                  <p className="text-2xl font-bold">{formatCurrency(netProprietaire)}</p>
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
              <div className="space-y-2">
                <Label>Lot / Appartement</Label>
                <Select value={selectedLot} onValueChange={setSelectedLot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les lots" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les lots</SelectItem>
                    {lots.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.numero} - {(lot as any).type_lot || 'Lot'} {(lot as any).locataires ? `(${(lot as any).locataires.nom})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Mois</Label>
                <Select value={selectedMois} onValueChange={setSelectedMois}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {uniqueMois.map(mois => (
                      <SelectItem key={mois} value={mois}>
                        {format(new Date(mois + '-01'), 'MMMM yyyy', { locale: fr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date début</Label>
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
              
              <div className="space-y-2">
                <Label>Date fin</Label>
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
              
              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  Effacer filtres
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="paiements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="paiements" className="gap-2">
              <Receipt className="h-4 w-4" />
              Paiements ({filteredEncaissements.length})
            </TabsTrigger>
            <TabsTrigger value="depenses" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Dépenses ({filteredDepenses.length})
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Percent className="h-4 w-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="rapports" className="gap-2">
              <FileText className="h-4 w-4" />
              Rapports ({rapports.length})
            </TabsTrigger>
          </TabsList>

          {/* Paiements Tab */}
          <TabsContent value="paiements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Paiements de loyers</CardTitle>
                <Button size="sm" className="gap-2" onClick={() => setEncaissementDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nouvel encaissement
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Locataire</TableHead>
                      <TableHead>Mois</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Document</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEncaissements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          Aucun paiement trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEncaissements.map(enc => {
                        const lot = lots.find(l => l.id === enc.lot_id);
                        const loyerAttendu = lot ? Number(lot.loyer_mensuel_attendu) : 0;
                        const montantPaye = Number(enc.montant_encaisse);
                        const isFullPayment = montantPaye >= loyerAttendu;
                        
                        return (
                          <TableRow key={enc.id}>
                            <TableCell>{format(new Date(enc.date_encaissement), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{lot?.numero || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>{(lot as any)?.locataires?.nom || '-'}</TableCell>
                            <TableCell>{format(new Date(enc.mois_concerne + '-01'), 'MMM yyyy', { locale: fr })}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{enc.mode_paiement}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(montantPaye)}</TableCell>
                            <TableCell className="text-right text-immobilier">{formatCurrency(Number(enc.commission_capco))}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(Number(enc.net_proprietaire))}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleDownloadQuittance(enc)}
                              >
                                <Download className="h-3 w-3" />
                                {isFullPayment ? 'Quittance' : 'Reçu'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                
                {filteredEncaissements.length > 0 && (
                  <div className="mt-4 pt-4 border-t flex justify-end gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total encaissé</p>
                      <p className="text-lg font-bold">{formatCurrency(totalLoyers)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total commissions</p>
                      <p className="text-lg font-bold text-immobilier">{formatCurrency(totalCommissions)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dépenses Tab */}
          <TabsContent value="depenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dépenses</CardTitle>
                <Button size="sm" className="gap-2" onClick={() => setDepenseDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nouvelle dépense
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Nature</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucune dépense trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDepenses.map(dep => (
                        <TableRow key={dep.id}>
                          <TableCell>{format(new Date(dep.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{typeDepenseLabels[dep.type_depense as TypeDepenseImmeuble] || dep.type_depense}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{dep.nature}</TableCell>
                          <TableCell className="text-muted-foreground">{dep.description || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">
                            -{formatCurrency(Number(dep.montant))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {filteredDepenses.length > 0 && (
                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total dépenses</p>
                      <p className="text-lg font-bold text-destructive">-{formatCurrency(totalDepenses)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Commissions CAPCO encaissées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-immobilier/5 rounded-lg border border-immobilier/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taux de commission appliqué</p>
                      <p className="text-3xl font-bold text-immobilier">{immeuble.taux_commission_capco}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total commissions (période filtrée)</p>
                      <p className="text-3xl font-bold">{formatCurrency(totalCommissions)}</p>
                    </div>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date encaissement</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Mois concerné</TableHead>
                      <TableHead className="text-right">Loyer encaissé</TableHead>
                      <TableHead className="text-right">Taux</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEncaissements.map(enc => {
                      const lot = lots.find(l => l.id === enc.lot_id);
                      return (
                        <TableRow key={enc.id}>
                          <TableCell>{format(new Date(enc.date_encaissement), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lot?.numero || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(enc.mois_concerne + '-01'), 'MMM yyyy', { locale: fr })}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(enc.montant_encaisse))}</TableCell>
                          <TableCell className="text-right">{immeuble.taux_commission_capco}%</TableCell>
                          <TableCell className="text-right font-medium text-immobilier">
                            {formatCurrency(Number(enc.commission_capco))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rapports Tab */}
          <TabsContent value="rapports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Rapports de gestion</CardTitle>
                <Button onClick={handleGenererRapport} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Générer nouveau rapport
                </Button>
              </CardHeader>
              <CardContent>
                {rapports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun rapport généré</p>
                    <p className="text-sm mt-2">Cliquez sur "Générer nouveau rapport" pour créer votre premier rapport de gestion.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rapports.map(rapport => (
                      <div 
                        key={rapport.id} 
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">
                              Rapport {format(new Date(rapport.periode_debut), 'MMMM yyyy', { locale: fr })}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Période: {format(new Date(rapport.periode_debut), 'dd/MM/yyyy')} - {format(new Date(rapport.periode_fin), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Généré le {format(new Date(rapport.date_generation), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                          <Badge className={cn(
                            rapport.statut === 'GENERE' && 'bg-success/10 text-success',
                            rapport.statut === 'ENVOYE' && 'bg-primary/10 text-primary',
                            rapport.statut === 'BROUILLON' && 'bg-muted text-muted-foreground'
                          )}>
                            {rapport.statut}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Loyers</p>
                            <p className="font-semibold text-success">{formatCurrency(Number(rapport.total_loyers))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dépenses</p>
                            <p className="font-semibold text-destructive">-{formatCurrency(Number(rapport.total_depenses))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Commissions</p>
                            <p className="font-semibold text-immobilier">-{formatCurrency(Number(rapport.total_commissions))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Net propriétaire</p>
                            <p className="font-bold">{formatCurrency(Number(rapport.net_proprietaire))}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Télécharger PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Nouvelle Dépense */}
      <Dialog open={depenseDialogOpen} onOpenChange={setDepenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle dépense</DialogTitle>
            <DialogDescription>
              Enregistrez une dépense pour l'immeuble {immeuble.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="depense-type">Type de dépense</Label>
              <Select value={depenseType} onValueChange={(v) => setDepenseType(v as TypeDepenseImmeuble)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeDepenseLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depense-nature">Nature de la dépense</Label>
              <Input
                id="depense-nature"
                placeholder="Ex: Réparation fuite d'eau salle de bain"
                value={depenseNature}
                onChange={(e) => setDepenseNature(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depense-description">Description (optionnel)</Label>
              <Textarea
                id="depense-description"
                placeholder="Détails supplémentaires..."
                value={depenseDescription}
                onChange={(e) => setDepenseDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depense-montant">Montant (FCFA)</Label>
              <Input
                id="depense-montant"
                type="number"
                placeholder="Ex: 50000"
                value={depenseMontant}
                onChange={(e) => setDepenseMontant(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepenseDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitDepense} disabled={createDepense.isPending}>
              {createDepense.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouvel Encaissement */}
      <Dialog open={encaissementDialogOpen} onOpenChange={setEncaissementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel encaissement de loyer</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement de loyer pour l'immeuble {immeuble.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="encaissement-lot">Lot / Appartement</Label>
              <Select value={encaissementLot} onValueChange={setEncaissementLot}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.filter(l => l.statut === 'OCCUPE').map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.numero} - {(lot as any).locataires?.nom || 'N/A'} ({formatCurrency(Number(lot.loyer_mensuel_attendu))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="encaissement-mois">Mois concerné</Label>
              <Select value={encaissementMois} onValueChange={setEncaissementMois}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le mois" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(mois => (
                    <SelectItem key={mois} value={mois}>
                      {format(new Date(mois + '-01'), 'MMMM yyyy', { locale: fr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="encaissement-montant">Montant encaissé (FCFA)</Label>
              <Input
                id="encaissement-montant"
                type="number"
                placeholder="Ex: 150000"
                value={encaissementMontant}
                onChange={(e) => setEncaissementMontant(e.target.value)}
              />
              {encaissementLot && (
                <p className="text-sm text-muted-foreground">
                  Loyer attendu: {formatCurrency(Number(lots.find(l => l.id === encaissementLot)?.loyer_mensuel_attendu || 0))}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="encaissement-mode">Mode de paiement</Label>
              <Select value={encaissementMode} onValueChange={setEncaissementMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIREMENT">Virement bancaire</SelectItem>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                  <SelectItem value="WAVE">Wave</SelectItem>
                  <SelectItem value="OM">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {encaissementLot && encaissementMontant && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <p>Commission CAPCO ({immeuble.taux_commission_capco}%): <strong className="text-immobilier">
                  {formatCurrency((parseFloat(encaissementMontant) || 0) * immeuble.taux_commission_capco / 100)}
                </strong></p>
                <p>Net propriétaire: <strong>
                  {formatCurrency((parseFloat(encaissementMontant) || 0) * (1 - immeuble.taux_commission_capco / 100))}
                </strong></p>
                {(() => {
                  const lot = lots.find(l => l.id === encaissementLot);
                  const loyer = lot ? Number(lot.loyer_mensuel_attendu) : 0;
                  const montant = parseFloat(encaissementMontant) || 0;
                  const isFullPayment = montant >= loyer;
                  return (
                    <p className={cn(isFullPayment ? "text-success" : "text-warning")}>
                      Document généré: <strong>{isFullPayment ? 'Quittance de loyer' : 'Reçu de paiement partiel'}</strong>
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncaissementDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitEncaissement} disabled={createEncaissement.isPending}>
              {createEncaissement.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
