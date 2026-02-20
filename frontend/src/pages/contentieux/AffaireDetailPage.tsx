import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Scale,
  Users,
  Building2,
  AlertTriangle,
  Banknote,
  Plus,
  Receipt,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ResultatAudienceDialog } from '@/components/dialogs/ResultatAudienceDialog';
import { NouvelleAudienceDialog } from '@/components/dialogs/NouvelleAudienceDialog';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { TypeResultat, TypeDepenseDossier } from '@/types';
import { useAffaire } from '@/hooks/useAffaires';
import { useAudiencesByAffaire, AudienceDB } from '@/hooks/useAudiences';
import { 
  useHonorairesContentieux, 
  useCreateHonorairesContentieux,
  useUpdateHonorairesContentieux,
  useDepensesAffaire,
  useCreateDepenseAffaire,
  usePaiementsHonorairesContentieux,
  useCreatePaiementHonorairesContentieux
} from '@/hooks/useHonorairesDepenses';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';

// Utility function to safely format dates
const safeFormatDate = (date: string | Date | null | undefined, formatStr: string, options?: { locale?: any }): string => {
  if (!date) return 'Date non disponible';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Date non disponible';
    return format(dateObj, formatStr, options);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Date non disponible';
  }
};

const typeDepenseLabels: Record<TypeDepenseDossier, string> = {
  FRAIS_HUISSIER: 'Frais d\'huissier',
  FRAIS_GREFFE: 'Frais de greffe',
  TIMBRES_FISCAUX: 'Timbres fiscaux',
  FRAIS_COURRIER: 'Frais de courrier',
  FRAIS_DEPLACEMENT: 'Frais de déplacement',
  FRAIS_EXPERTISE: 'Frais d\'expertise',
  AUTRES: 'Autres frais'
};

const statutLabels = {
  ACTIVE: { label: 'Active', color: 'bg-success/10 text-success' },
  CLOTUREE: { label: 'Clôturée', color: 'bg-muted text-muted-foreground' },
  RADIEE: { label: 'Radiée', color: 'bg-destructive/10 text-destructive' }
};

const objetLabels: Record<string, string> = {
  MISE_EN_ETAT: 'Mise en état',
  PLAIDOIRIE: 'Plaidoirie',
  REFERE: 'Référé',
  AUTRE: 'Autre'
};

const resultatLabels: Record<TypeResultat, { label: string; icon: React.ElementType; color: string }> = {
  RENVOI: { label: 'Renvoi', icon: RefreshCw, color: 'text-info' },
  RADIATION: { label: 'Radiation', icon: XCircle, color: 'text-destructive' },
  DELIBERE: { label: 'Délibéré', icon: CheckCircle2, color: 'text-success' }
};

const modePaiementLabels: Record<string, string> = {
  VIREMENT: 'Virement',
  CASH: 'Espèces',
  CHEQUE: 'Chèque',
  WAVE: 'Wave',
  OM: 'Orange Money'
};

export default function AffaireDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useNestJSAuth();
  
  // Fetch data from database
  const { data: affaire, isLoading: loadingAffaire } = useAffaire(id || '');
  const { data: audiences = [], isLoading: loadingAudiences } = useAudiencesByAffaire(id || '');
  const { data: honoraires, isLoading: loadingHonoraires } = useHonorairesContentieux(id);
  const { data: depenses = [], isLoading: loadingDepenses } = useDepensesAffaire(id);
  const { data: paiementsHonoraires = [] } = usePaiementsHonorairesContentieux(honoraires?.id);
  
  // Mutations
  const createHonoraires = useCreateHonorairesContentieux();
  const updateHonoraires = useUpdateHonorairesContentieux();
  const createDepense = useCreateDepenseAffaire();
  const createPaiement = useCreatePaiementHonorairesContentieux();
  
  const [showResultatDialog, setShowResultatDialog] = useState(false);
  const [showNouvelleAudienceDialog, setShowNouvelleAudienceDialog] = useState(false);
  const [showCompteRenduDialog, setShowCompteRenduDialog] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<AudienceDB | null>(null);
  
  // États pour les honoraires
  const [honorairesDialogOpen, setHonorairesDialogOpen] = useState(false);
  const [paiementHonorairesDialogOpen, setPaiementHonorairesDialogOpen] = useState(false);
  const [honorairesMontant, setHonorairesMontant] = useState('');
  const [paiementMontant, setPaiementMontant] = useState('');
  const [paiementMode, setPaiementMode] = useState('VIREMENT');
  const [paiementNotes, setPaiementNotes] = useState('');

  // États pour les dépenses
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [depenseType, setDepenseType] = useState<TypeDepenseDossier>('FRAIS_HUISSIER');
  const [depenseNature, setDepenseNature] = useState('');
  const [depenseMontant, setDepenseMontant] = useState('');
  const [depenseDescription, setDepenseDescription] = useState('');

  const totalDepenses = useMemo(() => 
    depenses.reduce((sum, d) => sum + Number(d.montant), 0), 
    [depenses]
  );

  const audiencesChronologiques = useMemo(() => {
    return [...audiences].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [audiences]);

  const audiencesNonRenseignees = audiences.filter(a => a.statut === 'PASSEE_NON_RENSEIGNEE');
  const prochainesAudiences = audiences.filter(a => a.statut === 'A_VENIR');
  
  // Calculs des honoraires
  const montantPrevu = honoraires?.montant_facture || 0;
  const totalPaiements = paiementsHonoraires.reduce((sum, p) => sum + Number(p.montant), 0);
  const soldeRestant = montantPrevu - totalPaiements;
  const pourcentageEncaisse = montantPrevu > 0 ? (totalPaiements / montantPrevu) * 100 : 0;

  const isLoading = loadingAffaire || loadingAudiences || loadingHonoraires || loadingDepenses;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affaire) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Affaire non trouvée</h3>
            <p className="text-muted-foreground text-sm mb-4">
              L'affaire demandée n'existe pas ou a été supprimée.
            </p>
            <Button onClick={() => navigate('/contentieux/affaires')}>
              Retour aux affaires
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaisirResultat = (audience: AudienceDB) => {
    setSelectedAudience(audience);
    setShowResultatDialog(true);
  };

  const handleGenerateCompteRendu = () => {
    setShowCompteRenduDialog(true);
  };

  const handleDownloadCompteRendu = () => {
    toast.success('Compte rendu téléchargé');
    setShowCompteRenduDialog(false);
  };

  const handleSubmitHonoraires = async () => {
    if (!user || !id) return;
    
    const montant = parseFloat(honorairesMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    try {
      if (honoraires?.id) {
        await updateHonoraires.mutateAsync({
          id: honoraires.id,
          montant_facture: montant
        });
      } else {
        await createHonoraires.mutateAsync({
          affaire_id: id,
          montant_facture: montant,
          montant_encaisse: 0,
          date_facturation: null,
          notes: null,
          created_by: user.id
        });
      }
      setHonorairesDialogOpen(false);
      setHonorairesMontant('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSubmitPaiementHonoraires = async () => {
    if (!user || !honoraires?.id) {
      toast.error('Veuillez d\'abord définir le montant des honoraires');
      return;
    }
    
    const montant = parseFloat(paiementMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    try {
      await createPaiement.mutateAsync({
        honoraires_id: honoraires.id,
        date: new Date().toISOString().split('T')[0],
        montant,
        mode_paiement: paiementMode as any,
        notes: paiementNotes || null,
        created_by: user.id
      });
      
      // Update total encaissé
      await updateHonoraires.mutateAsync({
        id: honoraires.id,
        montant_encaisse: totalPaiements + montant
      });
      
      setPaiementHonorairesDialogOpen(false);
      setPaiementMontant('');
      setPaiementMode('VIREMENT');
      setPaiementNotes('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSubmitDepense = async () => {
    if (!user || !id) return;
    
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
        affaire_id: id,
        date: new Date().toISOString().split('T')[0],
        type_depense: depenseType,
        nature: depenseNature,
        montant,
        description: depenseDescription || null,
        justificatif: null,
        created_by: user.id
      });
      
      setDepenseDialogOpen(false);
      setDepenseType('FRAIS_HUISSIER');
      setDepenseNature('');
      setDepenseMontant('');
      setDepenseDescription('');
    } catch (error) {
      // Error handled in hook
    }
  };

  // Parse demandeurs/defendeurs from JSONB
  const demandeurs = Array.isArray(affaire.demandeurs) ? affaire.demandeurs : [];
  const defendeurs = Array.isArray(affaire.defendeurs) ? affaire.defendeurs : [];

  return (
    <div className="min-h-screen">
      <Header 
        title={affaire.reference}
        subtitle={affaire.intitule}
        breadcrumbs={[
          { label: 'Contentieux', href: '/contentieux/affaires' },
          { label: 'Affaires', href: '/contentieux/affaires' },
          { label: affaire.reference },
        ]}
        actions={
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={handleGenerateCompteRendu}>
              <FileText className="h-4 w-4 mr-1.5" />
              Compte rendu
            </Button>
            <Button size="sm" onClick={() => setShowNouvelleAudienceDialog(true)}>
              <Calendar className="h-4 w-4 mr-1.5" />
              Nouvelle audience
            </Button>
          </div>
        }
      />

      <ResultatAudienceDialog
        open={showResultatDialog}
        onOpenChange={setShowResultatDialog}
        audience={selectedAudience}
      />

      <NouvelleAudienceDialog
        open={showNouvelleAudienceDialog}
        onOpenChange={setShowNouvelleAudienceDialog}
      />

      <div className="p-6 lg:p-8 animate-fade-in space-y-6">
        {/* Alert for non-renseignées */}
        {audiencesNonRenseignees.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">
                {audiencesNonRenseignees.length} audience(s) passée(s) non renseignée(s)
              </span>
            </div>
          </div>
        )}

        {/* Affaire Info Card */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-contentieux" />
                  Informations de l'affaire
                </CardTitle>
                <Badge className={statutLabels[affaire.statut].color}>
                  {statutLabels[affaire.statut].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Juridiction</h4>
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {affaire.juridiction}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Chambre</h4>
                  <p>{affaire.chambre}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Demandeur(s)
                  </h4>
                  <ul className="space-y-1">
                    {demandeurs.length > 0 ? (
                      demandeurs.map((p: any, idx: number) => (
                        <li key={idx} className="text-sm">{p.nom || p}</li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">Aucun demandeur</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Défendeur(s)
                  </h4>
                  <ul className="space-y-1">
                    {defendeurs.length > 0 ? (
                      defendeurs.map((p: any, idx: number) => (
                        <li key={idx} className="text-sm">{p.nom || p}</li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">Aucun défendeur</li>
                    )}
                  </ul>
                </div>
              </div>

              {affaire.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded">{affaire.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total audiences</span>
                <span className="font-semibold">{audiences.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">À venir</span>
                <span className="font-semibold text-info">{prochainesAudiences.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Non renseignées</span>
                <span className="font-semibold text-destructive">{audiencesNonRenseignees.length}</span>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Créée le</span>
                <p className="font-medium">
                  {safeFormatDate(affaire.createdAt, 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Honoraires */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-success" />
                Honoraires CAPCO
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setHonorairesDialogOpen(true)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {honoraires ? 'Modifier montant' : 'Définir honoraires'}
                </Button>
                <Button size="sm" onClick={() => setPaiementHonorairesDialogOpen(true)} disabled={!honoraires}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer paiement
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!honoraires ? (
              <div className="py-8 text-center text-muted-foreground">
                <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun honoraire défini pour cette affaire</p>
                <Button variant="outline" className="mt-4" onClick={() => setHonorairesDialogOpen(true)}>
                  Définir les honoraires
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-4 mb-6">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Honoraires prévus</p>
                    <p className="text-2xl font-bold">{formatCurrency(montantPrevu)}</p>
                  </div>
                  <div className="p-4 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Encaissé</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(totalPaiements)}</p>
                  </div>
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Solde restant</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(soldeRestant)}</p>
                  </div>
                  <div className="p-4 bg-info/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Progression</p>
                    <p className="text-2xl font-bold text-info">{pourcentageEncaisse.toFixed(0)}%</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-success h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(pourcentageEncaisse, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {paiementsHonoraires.length > 0 && (
                  <>
                    <h4 className="font-medium mb-3">Historique des paiements</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium">Date</th>
                            <th className="text-left px-4 py-3 font-medium">Montant</th>
                            <th className="text-left px-4 py-3 font-medium">Mode</th>
                            <th className="text-left px-4 py-3 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paiementsHonoraires.map((paiement, idx) => (
                            <tr key={paiement.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                              <td className="px-4 py-3">
                                {safeFormatDate(paiement.date, 'dd/MM/yyyy')}
                              </td>
                              <td className="px-4 py-3 font-medium text-success">
                                {formatCurrency(Number(paiement.montant))}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline">
                                  {modePaiementLabels[paiement.mode_paiement] || paiement.mode_paiement}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {paiement.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Section Dépenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-destructive" />
                Dépenses de l'affaire
              </CardTitle>
              <Button size="sm" onClick={() => setDepenseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle dépense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total des dépenses</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDepenses)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Nombre de dépenses</p>
                <p className="text-2xl font-bold">{depenses.length}</p>
              </div>
            </div>

            {depenses.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium">Nature</th>
                      <th className="text-right px-4 py-3 font-medium">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depenses.map((depense, idx) => (
                      <tr key={depense.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                        <td className="px-4 py-3">
                          {safeFormatDate(depense.date, 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {typeDepenseLabels[depense.type_depense as TypeDepenseDossier] || depense.type_depense}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {depense.nature}
                          {depense.description && (
                            <p className="text-xs text-muted-foreground">{depense.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-destructive">
                          {formatCurrency(Number(depense.montant))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-semibold">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-destructive">
                        {formatCurrency(totalDepenses)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune dépense enregistrée</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline des audiences */}
        <Card>
          <CardHeader>
            <CardTitle>Chronologie des audiences</CardTitle>
          </CardHeader>
          <CardContent>
            {audiencesChronologiques.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-semibold mb-2">Aucune audience</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Aucune audience n'a été enregistrée pour cette affaire.
                </p>
                <Button onClick={() => setShowNouvelleAudienceDialog(true)}>
                  Planifier une audience
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-6">
                  {audiencesChronologiques.map((audience) => {
                    const isUrgent = audience.statut === 'PASSEE_NON_RENSEIGNEE';
                    const isUpcoming = audience.statut === 'A_VENIR';
                    const hasResultat = audience.statut === 'RENSEIGNEE';
                    
                    return (
                      <div key={audience.id} className="relative pl-14">
                        {/* Timeline dot */}
                        <div className={cn(
                          'absolute left-4 w-4 h-4 rounded-full border-2 bg-background',
                          isUrgent && 'border-destructive bg-destructive',
                          isUpcoming && 'border-info bg-info',
                          hasResultat && 'border-success bg-success',
                          !isUrgent && !isUpcoming && !hasResultat && 'border-muted-foreground'
                        )} />
                        
                        <Card className={cn(
                          'transition-all hover:shadow-md',
                          isUrgent && 'border-destructive/50 bg-destructive/5'
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge variant={isUpcoming ? 'default' : isUrgent ? 'destructive' : 'secondary'}>
                                    {isUpcoming ? 'À venir' : isUrgent ? 'Non renseignée' : 'Passée'}
                                  </Badge>
                                  <span className="module-badge module-badge-contentieux">
                                    {objetLabels[audience.objet] || audience.objet}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1 font-medium text-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {safeFormatDate(audience.date, 'EEEE dd MMMM yyyy', { locale: fr })}
                                  </span>
                                  {audience.heure && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {audience.heure}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {affaire.juridiction}
                                  </span>
                                </div>
                                
                                {audience.notes_preparation && (
                                  <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                    <span className="font-medium">Notes:</span> {audience.notes_preparation}
                                  </p>
                                )}
                              </div>
                              
                              {isUrgent && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleSaisirResultat(audience)}
                                >
                                  Saisir résultat
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compte Rendu Dialog */}
      <Dialog open={showCompteRenduDialog} onOpenChange={setShowCompteRenduDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compte rendu de l'affaire</DialogTitle>
            <DialogDescription>
              Aperçu du compte rendu avec l'historique complet des audiences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h2 className="text-2xl font-bold">CABINET CAPCO</h2>
              <p className="text-muted-foreground">Compte rendu de procédure</p>
            </div>
            
            {/* Affaire info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Référence</h3>
                <p className="font-medium text-lg">{affaire.reference}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Intitulé</h3>
                <p className="font-medium">{affaire.intitule}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Juridiction</h3>
                <p>{affaire.juridiction} - {affaire.chambre}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Statut</h3>
                <Badge className={statutLabels[affaire.statut].color}>
                  {statutLabels[affaire.statut].label}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            {/* Parties */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Demandeur(s)</h3>
                <ul className="list-disc list-inside">
                  {demandeurs.map((p: any, idx: number) => <li key={idx}>{p.nom || p}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Défendeur(s)</h3>
                <ul className="list-disc list-inside">
                  {defendeurs.map((p: any, idx: number) => <li key={idx}>{p.nom || p}</li>)}
                </ul>
              </div>
            </div>
            
            <Separator />
            
            {/* Historique des audiences */}
            <div>
              <h3 className="font-semibold mb-4">Historique des audiences ({audiences.length})</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Objet</th>
                      <th className="text-left px-4 py-3 font-medium">Statut</th>
                      <th className="text-left px-4 py-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audiencesChronologiques.map((audience, idx) => (
                      <tr key={audience.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                        <td className="px-4 py-3">
                          {safeFormatDate(audience.date, 'dd/MM/yyyy')}
                          {audience.heure && <span className="text-muted-foreground"> - {audience.heure}</span>}
                        </td>
                        <td className="px-4 py-3">{objetLabels[audience.objet] || audience.objet}</td>
                        <td className="px-4 py-3">
                          {audience.statut === 'A_VENIR' ? (
                            <span className="text-info">À venir</span>
                          ) : audience.statut === 'PASSEE_NON_RENSEIGNEE' ? (
                            <span className="text-destructive">Non renseignée</span>
                          ) : (
                            <span className="text-success">Renseignée</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {audience.notes_preparation || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <Separator />
            
            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Rapport généré le {safeFormatDate(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
              <p>Cabinet CAPCO - Contentieux</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompteRenduDialog(false)}>Fermer</Button>
            <Button onClick={handleDownloadCompteRendu} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Honoraires */}
      <Dialog open={honorairesDialogOpen} onOpenChange={setHonorairesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{honoraires ? 'Modifier le montant des honoraires' : 'Définir les honoraires'}</DialogTitle>
            <DialogDescription>
              {honoraires 
                ? 'Modifiez le montant total des honoraires prévus pour cette affaire'
                : 'Définissez le montant des honoraires à facturer pour cette affaire'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="honoraires-montant">Montant des honoraires (FCFA)</Label>
              <Input
                id="honoraires-montant"
                type="number"
                placeholder="Ex: 500000"
                value={honorairesMontant}
                onChange={(e) => setHonorairesMontant(e.target.value)}
              />
            </div>
            {honoraires && (
              <p className="text-sm text-muted-foreground">
                Montant actuel: {formatCurrency(montantPrevu)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHonorairesDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitHonoraires} disabled={createHonoraires.isPending || updateHonoraires.isPending}>
              {(createHonoraires.isPending || updateHonoraires.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Enregistrer Paiement */}
      <Dialog open={paiementHonorairesDialogOpen} onOpenChange={setPaiementHonorairesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement d'honoraires reçu du client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paiement-montant">Montant (FCFA)</Label>
              <Input
                id="paiement-montant"
                type="number"
                placeholder="Ex: 100000"
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paiement-mode">Mode de paiement</Label>
              <Select value={paiementMode} onValueChange={setPaiementMode}>
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
            <div className="space-y-2">
              <Label htmlFor="paiement-notes">Notes (optionnel)</Label>
              <Textarea
                id="paiement-notes"
                placeholder="Référence du paiement, observations..."
                value={paiementNotes}
                onChange={(e) => setPaiementNotes(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p>Solde restant après ce paiement: <strong className="text-success">
                {formatCurrency(Math.max(0, soldeRestant - (parseFloat(paiementMontant) || 0)))}
              </strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaiementHonorairesDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitPaiementHonoraires} disabled={createPaiement.isPending}>
              {createPaiement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouvelle Dépense */}
      <Dialog open={depenseDialogOpen} onOpenChange={setDepenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle dépense</DialogTitle>
            <DialogDescription>
              Enregistrez une dépense effectuée pour cette affaire
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="depense-type">Type de dépense</Label>
              <Select value={depenseType} onValueChange={(v) => setDepenseType(v as TypeDepenseDossier)}>
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
              <Label htmlFor="depense-nature">Nature *</Label>
              <Input
                id="depense-nature"
                placeholder="Ex: Signification assignation"
                value={depenseNature}
                onChange={(e) => setDepenseNature(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depense-montant">Montant (FCFA) *</Label>
              <Input
                id="depense-montant"
                type="number"
                placeholder="Ex: 25000"
                value={depenseMontant}
                onChange={(e) => setDepenseMontant(e.target.value)}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepenseDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitDepense} disabled={createDepense.isPending}>
              {createDepense.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
