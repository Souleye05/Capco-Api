import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  FileText,
  Banknote,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NouveauDossierDialog } from '@/components/dialogs/NouveauDossierDialog';
import { 
  useDossiersRecouvrement, 
  useCreateActionRecouvrement,
  useCreatePaiementRecouvrement,
  DossierRecouvrementDB 
} from '@/hooks/useDossiersRecouvrement';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

type TypeAction = 'APPEL_TELEPHONIQUE' | 'COURRIER' | 'LETTRE_RELANCE' | 'MISE_EN_DEMEURE' | 'COMMANDEMENT_PAYER' | 'ASSIGNATION' | 'REQUETE' | 'AUDIENCE_PROCEDURE' | 'AUTRE';

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

export default function DossiersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  
  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [nouveauDossierOpen, setNouveauDossierOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierRecouvrementDB | null>(null);
  
  // Form states for action
  const [actionType, setActionType] = useState<TypeAction>('APPEL_TELEPHONIQUE');
  const [actionResume, setActionResume] = useState('');
  const [actionProchaineEtape, setActionProchaineEtape] = useState('');
  const [actionEcheance, setActionEcheance] = useState('');
  
  // Form states for payment
  const [paiementMontant, setPaiementMontant] = useState('');
  const [paiementMode, setPaiementMode] = useState<'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM'>('CASH');
  const [paiementReference, setPaiementReference] = useState('');
  const [paiementCommentaire, setPaiementCommentaire] = useState('');

  const { data: dossiers = [], isLoading } = useDossiersRecouvrement();
  const createAction = useCreateActionRecouvrement();
  const createPaiement = useCreatePaiementRecouvrement();

  const filteredDossiers = dossiers.filter(dossier => {
    const matchesSearch = 
      dossier.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.creancier_nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.debiteur_nom.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatut = statutFilter === 'all' || dossier.statut === statutFilter;
    
    return matchesSearch && matchesStatut;
  });

  // Calculate totals
  const totalARecouvrer = filteredDossiers.reduce((sum, d) => sum + Number(d.total_a_recouvrer), 0);

  const handleOpenActionDialog = (dossier: DossierRecouvrementDB) => {
    setSelectedDossier(dossier);
    setActionType('APPEL_TELEPHONIQUE');
    setActionResume('');
    setActionProchaineEtape('');
    setActionEcheance('');
    setActionDialogOpen(true);
  };

  const handleOpenPaiementDialog = (dossier: DossierRecouvrementDB) => {
    setSelectedDossier(dossier);
    setPaiementMontant('');
    setPaiementMode('CASH');
    setPaiementReference('');
    setPaiementCommentaire('');
    setPaiementDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    if (!actionResume.trim() || !selectedDossier || !user) {
      toast.error('Veuillez saisir un résumé de l\'action');
      return;
    }
    
    await createAction.mutateAsync({
      dossier_id: selectedDossier.id,
      date: new Date().toISOString().split('T')[0],
      type_action: actionType,
      resume: actionResume,
      prochaine_etape: actionProchaineEtape || null,
      echeance_prochaine_etape: actionEcheance || null,
      piece_jointe: null,
      created_by: user.id
    });
    
    setActionDialogOpen(false);
  };

  const handleSubmitPaiement = async () => {
    const montant = parseFloat(paiementMontant);
    if (isNaN(montant) || montant <= 0 || !selectedDossier || !user) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    await createPaiement.mutateAsync({
      dossier_id: selectedDossier.id,
      date: new Date().toISOString().split('T')[0],
      montant,
      mode: paiementMode,
      reference: paiementReference || null,
      commentaire: paiementCommentaire || null,
      created_by: user.id
    });
    
    setPaiementDialogOpen(false);
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Dossiers Recouvrement" 
        subtitle={`${dossiers.length} dossiers`}
        actions={
          <Button className="gap-2" onClick={() => setNouveauDossierOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau dossier
          </Button>
        }
      />

      <NouveauDossierDialog 
        open={nouveauDossierOpen} 
        onOpenChange={setNouveauDossierOpen} 
      />

      <div className="p-6 animate-fade-in">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total à recouvrer</p>
                <p className="text-2xl font-display font-semibold text-foreground">
                  {formatCurrency(totalARecouvrer)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers en cours</p>
                <p className="text-2xl font-display font-semibold text-success">
                  {dossiers.filter(d => d.statut === 'EN_COURS').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <Banknote className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers clôturés</p>
                <p className="text-2xl font-display font-semibold text-muted-foreground">
                  {dossiers.filter(d => d.statut === 'CLOTURE').length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="EN_COURS">En cours</SelectItem>
              <SelectItem value="CLOTURE">Clôturé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredDossiers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun dossier trouvé</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => setNouveauDossierOpen(true)}
            >
              Créer un nouveau dossier
            </Button>
          </div>
        )}

        {/* Dossiers list */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredDossiers.map((dossier) => {
              return (
                <div 
                  key={dossier.id} 
                  className="bg-card rounded-lg border p-6 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/recouvrement/dossiers/${dossier.id}`)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-medium text-primary">
                          {dossier.reference}
                        </span>
                        <Badge className={cn(
                          dossier.statut === 'EN_COURS' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {dossier.statut === 'EN_COURS' ? 'En cours' : 'Clôturé'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Créancier</p>
                          <p className="font-medium">{dossier.creancier_nom}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Débiteur</p>
                          <p className="font-medium">{dossier.debiteur_nom}</p>
                          {dossier.debiteur_telephone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" /> {dossier.debiteur_telephone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="lg:w-64 space-y-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">À recouvrer</p>
                        <p className="text-2xl font-display font-semibold">
                          {formatCurrency(Number(dossier.total_a_recouvrer))}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenActionDialog(dossier);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Action
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPaiementDialog(dossier);
                          }}
                        >
                          <Banknote className="h-4 w-4 mr-1" />
                          Paiement
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog for adding action */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle action - {selectedDossier?.reference}</DialogTitle>
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
            <DialogTitle>Nouveau paiement - {selectedDossier?.reference}</DialogTitle>
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
    </div>
  );
}
