import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  Banknote,
  Scale,
  Plus,
  AlertTriangle,
  TrendingUp,
  User,
  Download,
  Loader2,
  Receipt,
  Percent
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { TypeAction, TypeDepenseDossier } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useDossierRecouvrement,
  useActionsRecouvrement,
  usePaiementsRecouvrement,
  useCreateActionRecouvrement,
  useCreatePaiementRecouvrement,
  ActionRecouvrementWithDossierDB,
  PaiementRecouvrementDB
} from '@/hooks/useDossiersRecouvrement';
import {
  useHonorairesRecouvrement,
  useDepensesDossier,
  useCreateDepenseDossier,
  useUpdateHonorairesRecouvrement
} from '@/hooks/useHonorairesDepenses';
import { generateRapportActionsPDF } from '@/utils/generateRapportActionsPDF';

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const typeActionLabels: Record<TypeAction, string> = {
  APPEL_TELEPHONIQUE: 'Appel téléphonique',
  COURRIER: 'Courrier',
  LETTRE_RELANCE: 'Lettre de relance',
  MISE_EN_DEMEURE: 'Mise en demeure',
  COMMANDEMENT_PAYER: 'Commandement de payer',
  ASSIGNATION: 'Assignation',
  REQUETE: 'Requête',
  AUDIENCE_PROCEDURE: 'Audience / Procédure',
  AUTRE: 'Autre'
};

const typeActionIcons: Record<TypeAction, React.ReactNode> = {
  APPEL_TELEPHONIQUE: <Phone className="h-4 w-4" />,
  COURRIER: <Mail className="h-4 w-4" />,
  LETTRE_RELANCE: <FileText className="h-4 w-4" />,
  MISE_EN_DEMEURE: <AlertTriangle className="h-4 w-4" />,
  COMMANDEMENT_PAYER: <FileText className="h-4 w-4" />,
  ASSIGNATION: <Scale className="h-4 w-4" />,
  REQUETE: <FileText className="h-4 w-4" />,
  AUDIENCE_PROCEDURE: <Scale className="h-4 w-4" />,
  AUTRE: <FileText className="h-4 w-4" />
};

const typeActionColors: Record<TypeAction, string> = {
  APPEL_TELEPHONIQUE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  COURRIER: 'bg-muted text-muted-foreground border-muted',
  LETTRE_RELANCE: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  MISE_EN_DEMEURE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  COMMANDEMENT_PAYER: 'bg-destructive/10 text-destructive border-destructive/20',
  ASSIGNATION: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  REQUETE: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
  AUDIENCE_PROCEDURE: 'bg-primary/10 text-primary border-primary/20',
  AUTRE: 'bg-muted text-muted-foreground border-muted'
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

export default function DossierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch dossier from database
  const { data: dossier, isLoading: isLoadingDossier } = useDossierRecouvrement(id || '');
  
  // Fetch actions from database
  const { data: actionsData = [] } = useActionsRecouvrement(id);
  
  // Fetch payments from database
  const { data: paiementsData = [] } = usePaiementsRecouvrement(id);
  
  // Fetch honoraires from database
  const { data: honoraires } = useHonorairesRecouvrement(id);
  
  // Fetch depenses from database
  const { data: depensesData = [] } = useDepensesDossier(id);
  
  // Mutations
  const createAction = useCreateActionRecouvrement();
  const createPaiement = useCreatePaiementRecouvrement();
  const createDepense = useCreateDepenseDossier();
  const updateHonoraires = useUpdateHonorairesRecouvrement();
  
  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [paiementHonDialogOpen, setPaiementHonDialogOpen] = useState(false);
  
  // Form states
  const [actionType, setActionType] = useState<TypeAction>('APPEL_TELEPHONIQUE');
  const [actionResume, setActionResume] = useState('');
  const [actionProchaineEtape, setActionProchaineEtape] = useState('');
  const [actionEcheance, setActionEcheance] = useState('');
  
  const [paiementMontant, setPaiementMontant] = useState('');
  const [paiementMode, setPaiementMode] = useState<'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM'>('VIREMENT');
  const [paiementReference, setPaiementReference] = useState('');
  const [paiementCommentaire, setPaiementCommentaire] = useState('');
  
  // Depense form states
  const [depenseType, setDepenseType] = useState<TypeDepenseDossier>('FRAIS_HUISSIER');
  const [depenseNature, setDepenseNature] = useState('');
  const [depenseMontant, setDepenseMontant] = useState('');
  
  // Paiement honoraires form states
  const [paiementHonMontant, setPaiementHonMontant] = useState('');
  
  // Calculate totals from real data
  const totalEncaisse = paiementsData.reduce((sum, p) => sum + p.montant, 0);
  const soldeRestant = dossier ? Number(dossier.total_a_recouvrer) - totalEncaisse : 0;
  const progress = dossier ? (totalEncaisse / Number(dossier.total_a_recouvrer)) * 100 : 0;
  const totalDepenses = depensesData.reduce((sum, d) => sum + Number(d.montant), 0);
  
  // Honoraires calculations
  const honorairesPrevu = honoraires ? Number(honoraires.montant_prevu) : 0;
  const honorairesPaye = honoraires ? Number(honoraires.montant_paye) : 0;
  const honorairesRestant = honorairesPrevu - honorairesPaye;

  // Loading state
  if (isLoadingDossier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Dossier non trouvé</h2>
          <Button onClick={() => navigate('/recouvrement/dossiers')}>
            Retour aux dossiers
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmitAction = async () => {
    if (!actionResume.trim() || !user) {
      toast.error('Veuillez saisir un résumé de l\'action');
      return;
    }
    
    await createAction.mutateAsync({
      dossier_id: dossier.id,
      date: new Date().toISOString().split('T')[0],
      type_action: actionType,
      resume: actionResume,
      prochaine_etape: actionProchaineEtape || null,
      echeance_prochaine_etape: actionEcheance || null,
      piece_jointe: null,
      created_by: user.id
    });
    
    setActionDialogOpen(false);
    setActionResume('');
    setActionProchaineEtape('');
    setActionEcheance('');
  };

  const handleSubmitPaiement = async () => {
    const montant = parseFloat(paiementMontant);
    if (isNaN(montant) || montant <= 0 || !user) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    await createPaiement.mutateAsync({
      dossier_id: dossier.id,
      date: new Date().toISOString().split('T')[0],
      montant,
      mode: paiementMode,
      reference: paiementReference || null,
      commentaire: paiementCommentaire || null,
      created_by: user.id
    });
    
    setPaiementDialogOpen(false);
    setPaiementMontant('');
    setPaiementReference('');
    setPaiementCommentaire('');
  };
  
  const handleSubmitDepense = async () => {
    const montant = parseFloat(depenseMontant);
    if (isNaN(montant) || montant <= 0 || !depenseNature.trim() || !user) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    await createDepense.mutateAsync({
      dossier_id: dossier.id,
      date: new Date().toISOString().split('T')[0],
      type_depense: depenseType,
      nature: depenseNature,
      montant,
      justificatif: null,
      created_by: user.id
    });
    
    setDepenseDialogOpen(false);
    setDepenseNature('');
    setDepenseMontant('');
  };
  
  const handleSubmitPaiementHonoraires = async () => {
    const montant = parseFloat(paiementHonMontant);
    if (isNaN(montant) || montant <= 0 || !honoraires) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    const newMontantPaye = Number(honoraires.montant_paye) + montant;
    await updateHonoraires.mutateAsync({
      id: honoraires.id,
      montant_paye: newMontantPaye
    });
    
    setPaiementHonDialogOpen(false);
    setPaiementHonMontant('');
  };
  
  const handleGenerateRapport = async () => {
    try {
      await generateRapportActionsPDF({
        dossier,
        actions: actionsData,
        paiements: paiementsData,
        honoraires,
        depenses: depensesData,
        totalEncaisse,
        soldeRestant
      });
      toast.success('Rapport PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
    }
  };

  // Combine actions and payments into a single timeline
  const timeline = [
    ...actionsData.map(a => ({ 
      type: 'action' as const, 
      date: new Date(a.date), 
      data: a 
    })),
    ...paiementsData.map(p => ({ 
      type: 'paiement' as const, 
      date: new Date(p.date), 
      data: p 
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen">
      <Header 
        title={
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/recouvrement/dossiers')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <span className="font-mono text-primary">{dossier.reference}</span>
              <Badge className={cn(
                "ml-3",
                dossier.statut === 'EN_COURS' 
                  ? 'bg-success/10 text-success' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {dossier.statut === 'EN_COURS' ? 'En cours' : 'Clôturé'}
              </Badge>
            </div>
          </div>
        }
        subtitle={`Créé le ${formatDate(dossier.created_at)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Action
            </Button>
            <Button variant="outline" onClick={() => setPaiementDialogOpen(true)}>
              <Banknote className="h-4 w-4 mr-2" />
              Paiement
            </Button>
            <Button variant="secondary" onClick={handleGenerateRapport}>
              <Download className="h-4 w-4 mr-2" />
              Rapport PDF
            </Button>
          </div>
        }
      />

      <div className="p-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-success" />
                    Créancier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">{dossier.creancier_nom}</p>
                  {dossier.creancier_telephone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                      <Phone className="h-3 w-3" /> {dossier.creancier_telephone}
                    </p>
                  )}
                  {dossier.creancier_email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" /> {dossier.creancier_email}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-destructive" />
                    Débiteur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">{dossier.debiteur_nom}</p>
                  {dossier.debiteur_telephone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                      <Phone className="h-3 w-3" /> {dossier.debiteur_telephone}
                    </p>
                  )}
                  {dossier.debiteur_email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" /> {dossier.debiteur_email}
                    </p>
                  )}
                  {dossier.debiteur_adresse && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3" /> {dossier.debiteur_adresse}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="chronologie" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chronologie">Chronologie</TabsTrigger>
                <TabsTrigger value="actions">Actions ({actionsData.length})</TabsTrigger>
                <TabsTrigger value="paiements">Paiements ({paiementsData.length})</TabsTrigger>
                <TabsTrigger value="depenses">Dépenses ({depensesData.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="chronologie" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historique des événements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timeline.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun événement enregistré
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {timeline.map((item, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                item.type === 'action' 
                                  ? typeActionColors[(item.data as ActionRecouvrementWithDossierDB).type_action]
                                  : 'bg-success/10 text-success'
                              )}>
                                {item.type === 'action' 
                                  ? typeActionIcons[(item.data as ActionRecouvrementWithDossierDB).type_action]
                                  : <Banknote className="h-4 w-4" />
                                }
                              </div>
                              {idx < timeline.length - 1 && (
                                <div className="w-px h-full bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {item.type === 'action' 
                                    ? typeActionLabels[(item.data as ActionRecouvrementWithDossierDB).type_action]
                                    : 'Paiement reçu'
                                  }
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(item.date.toISOString())}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.type === 'action' 
                                  ? (item.data as ActionRecouvrementWithDossierDB).resume
                                  : `${formatCurrency((item.data as PaiementRecouvrementDB).montant)} - ${(item.data as PaiementRecouvrementDB).mode}`
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Actions de recouvrement</CardTitle>
                    <Button size="sm" onClick={() => setActionDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {actionsData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune action enregistrée
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {actionsData.map((action) => (
                          <div key={action.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={typeActionColors[action.type_action]}>
                                  {typeActionLabels[action.type_action]}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(action.date)}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-sm">{action.resume}</p>
                            {action.prochaine_etape && (
                              <div className="mt-2 p-2 bg-muted rounded text-sm">
                                <span className="font-medium">Prochaine étape:</span> {action.prochaine_etape}
                                {action.echeance_prochaine_etape && (
                                  <span className="text-muted-foreground ml-2">
                                    (avant le {formatDate(action.echeance_prochaine_etape)})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="paiements" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Paiements reçus</CardTitle>
                    <Button size="sm" onClick={() => setPaiementDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {paiementsData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun paiement enregistré
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {paiementsData.map((paiement) => (
                          <div key={paiement.id} className="border rounded-lg p-4 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{paiement.mode}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(paiement.date)}
                                </span>
                              </div>
                              {paiement.commentaire && (
                                <p className="text-sm text-muted-foreground mt-1">{paiement.commentaire}</p>
                              )}
                            </div>
                            <span className="text-lg font-semibold text-success">
                              +{formatCurrency(paiement.montant)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="depenses" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Dépenses engagées</CardTitle>
                    <Button size="sm" onClick={() => setDepenseDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {depensesData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune dépense enregistrée
                      </p>
                    ) : (
                      <>
                        <div className="space-y-3 mb-4">
                          {depensesData.map((depense) => (
                            <div key={depense.id} className="border rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                                    {typeDepenseLabels[depense.type_depense]}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDate(depense.date)}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{depense.nature}</p>
                              </div>
                              <span className="text-lg font-semibold text-orange-600">
                                -{formatCurrency(Number(depense.montant))}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center pt-4">
                          <span className="font-medium">Total dépenses</span>
                          <span className="text-lg font-bold text-orange-600">{formatCurrency(totalDepenses)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Summary */}
          <div className="space-y-6">
            {/* Progress card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Recouvrement</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Montant principal</span>
                    <span className="font-medium">{formatCurrency(Number(dossier.montant_principal))}</span>
                  </div>
                  {dossier.penalites_interets && Number(dossier.penalites_interets) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pénalités/Intérêts</span>
                      <span className="font-medium">{formatCurrency(Number(dossier.penalites_interets))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total à recouvrer</span>
                    <span className="font-semibold">{formatCurrency(Number(dossier.total_a_recouvrer))}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span className="text-sm">Total encaissé</span>
                    <span className="font-semibold">{formatCurrency(totalEncaisse)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span className="text-sm">Solde restant</span>
                    <span className="font-semibold">{formatCurrency(soldeRestant)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Honoraires card */}
            {honoraires && (
              <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Receipt className="h-4 w-4" />
                    Honoraires CAPCO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Honoraires prévus</span>
                    <span className="font-medium">{formatCurrency(honorairesPrevu)}</span>
                  </div>
                  {honoraires.pourcentage && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Percent className="h-3 w-3" /> Pourcentage
                      </span>
                      <span className="font-medium">{honoraires.pourcentage}%</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-success">
                    <span className="text-sm">Encaissé</span>
                    <span className="font-semibold">{formatCurrency(honorairesPaye)}</span>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span className="text-sm">Reste à payer</span>
                    <span className="font-semibold">{formatCurrency(honorairesRestant)}</span>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                    onClick={() => setPaiementHonDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Paiement honoraires
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {dossier.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{dossier.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog for adding action */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle action - {dossier.reference}</DialogTitle>
            <DialogDescription>
              Enregistrer une nouvelle action pour ce dossier de recouvrement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="actionType">Type d'action *</Label>
              <Select value={actionType} onValueChange={(value) => setActionType(value as TypeAction)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeActionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="resume">Résumé de l'action *</Label>
              <Textarea 
                id="resume"
                placeholder="Décrivez l'action effectuée..."
                value={actionResume}
                onChange={(e) => setActionResume(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="prochaineEtape">Prochaine étape (optionnel)</Label>
              <Input 
                id="prochaineEtape"
                placeholder="Ex: Relancer par courrier si pas de réponse"
                value={actionProchaineEtape}
                onChange={(e) => setActionProchaineEtape(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="echeance">Échéance prochaine étape (optionnel)</Label>
              <Input 
                id="echeance"
                type="date"
                value={actionEcheance}
                onChange={(e) => setActionEcheance(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitAction} disabled={createAction.isPending}>
              {createAction.isPending ? 'Enregistrement...' : 'Enregistrer l\'action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding payment */}
      <Dialog open={paiementDialogOpen} onOpenChange={setPaiementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouveau paiement - {dossier.reference}</DialogTitle>
            <DialogDescription>
              Enregistrer un paiement reçu pour ce dossier.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="montant">Montant encaissé (FCFA) *</Label>
              <Input 
                id="montant"
                type="number"
                placeholder="Ex: 500000"
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="mode">Mode de paiement *</Label>
              <Select value={paiementMode} onValueChange={(value) => setPaiementMode(value as 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="VIREMENT">Virement</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                  <SelectItem value="WAVE">Wave</SelectItem>
                  <SelectItem value="OM">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reference">Référence (optionnel)</Label>
              <Input 
                id="reference"
                placeholder="Ex: Numéro de chèque, référence virement..."
                value={paiementReference}
                onChange={(e) => setPaiementReference(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
              <Textarea 
                id="commentaire"
                placeholder="Notes supplémentaires..."
                value={paiementCommentaire}
                onChange={(e) => setPaiementCommentaire(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaiementDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitPaiement} disabled={createPaiement.isPending}>
              {createPaiement.isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding expense */}
      <Dialog open={depenseDialogOpen} onOpenChange={setDepenseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle dépense - {dossier.reference}</DialogTitle>
            <DialogDescription>
              Enregistrer une dépense engagée pour ce dossier.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="depenseType">Type de dépense *</Label>
              <Select value={depenseType} onValueChange={(value) => setDepenseType(value as TypeDepenseDossier)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeDepenseLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="depenseNature">Nature de la dépense *</Label>
              <Input 
                id="depenseNature"
                placeholder="Ex: Frais de signification huissier"
                value={depenseNature}
                onChange={(e) => setDepenseNature(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="depenseMontant">Montant (FCFA) *</Label>
              <Input 
                id="depenseMontant"
                type="number"
                placeholder="Ex: 50000"
                value={depenseMontant}
                onChange={(e) => setDepenseMontant(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepenseDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitDepense} disabled={createDepense.isPending}>
              {createDepense.isPending ? 'Enregistrement...' : 'Enregistrer la dépense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding honoraires payment */}
      <Dialog open={paiementHonDialogOpen} onOpenChange={setPaiementHonDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Paiement honoraires</DialogTitle>
            <DialogDescription>
              Enregistrer un paiement d'honoraires reçu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="p-3 bg-purple-100 rounded-lg text-center">
              <p className="text-sm text-purple-600">Reste à payer</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(honorairesRestant)}</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="paiementHonMontant">Montant reçu (FCFA) *</Label>
              <Input 
                id="paiementHonMontant"
                type="number"
                placeholder="Ex: 500000"
                value={paiementHonMontant}
                onChange={(e) => setPaiementHonMontant(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaiementHonDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitPaiementHonoraires} disabled={updateHonoraires.isPending}>
              {updateHonoraires.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
