import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Banknote,
  Calendar,
  Eye,
  FileText
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Card, CardContent } from '@/components/ui/card';
import { 
  usePaiementsRecouvrement, 
  useDossiersRecouvrement,
  useCreatePaiementRecouvrement 
} from '@/hooks/useDossiersRecouvrement';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const modeLabels: Record<string, string> = {
  CASH: 'Espèces',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  WAVE: 'Wave',
  OM: 'Orange Money'
};

export default function PaiementsPage() {
  const navigate = useNavigate();
  const { user } = useNestJSAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDossier, setSelectedDossier] = useState<string>('all');
  
  // Dialog nouveau paiement
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [paiementDossier, setPaiementDossier] = useState('');
  const [paiementMontant, setPaiementMontant] = useState('');
  const [paiementMode, setPaiementMode] = useState<'VIREMENT' | 'CASH' | 'CHEQUE' | 'WAVE' | 'OM'>('VIREMENT');
  const [paiementReference, setPaiementReference] = useState('');
  const [paiementCommentaire, setPaiementCommentaire] = useState('');

  const { data: paiements = [], isLoading: loadingPaiements } = usePaiementsRecouvrement();
  const { data: dossiers = [], isLoading: loadingDossiers } = useDossiersRecouvrement();
  const createPaiement = useCreatePaiementRecouvrement();

  const filteredPaiements = paiements.filter(paiement => {
    const matchesSearch = 
      paiement.dossiers_recouvrement?.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paiement.dossiers_recouvrement?.debiteur_nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paiement.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDossier = selectedDossier === 'all' || paiement.dossier_id === selectedDossier;
    
    return matchesSearch && matchesDossier;
  });

  const totalPaiements = filteredPaiements.reduce((sum, p) => sum + p.montant, 0);

  const handleSubmitPaiement = async () => {
    if (!paiementDossier || !user) {
      toast.error('Veuillez sélectionner un dossier');
      return;
    }
    const montant = parseFloat(paiementMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }
    
    try {
      await createPaiement.mutateAsync({
        dossier_id: paiementDossier,
        montant,
        mode: paiementMode,
        reference: paiementReference || null,
        commentaire: paiementCommentaire || null,
        date: new Date().toISOString().split('T')[0],
        created_by: user.id,
      });
      
      setPaiementDialogOpen(false);
      setPaiementDossier('');
      setPaiementMontant('');
      setPaiementMode('VIREMENT');
      setPaiementReference('');
      setPaiementCommentaire('');
    } catch (error) {
      // Error handled by hook
    }
  };

  if (loadingPaiements || loadingDossiers) {
    return (
      <div className="min-h-screen">
        <Header title="Paiements Recouvrement" subtitle="Chargement..." />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Paiements Recouvrement" 
        subtitle={`${paiements.length} paiements enregistrés`}
        actions={
          <Button className="gap-2" onClick={() => setPaiementDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau paiement
          </Button>
        }
      />

      <div className="p-6 animate-fade-in space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Banknote className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total encaissé</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalPaiements)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre de paiements</p>
                  <p className="text-2xl font-bold">{filteredPaiements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-info/10">
                  <Calendar className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dernier paiement</p>
                  <p className="text-2xl font-bold">
                    {filteredPaiements.length > 0 
                      ? format(new Date(filteredPaiements[0].date), 'dd/MM/yyyy')
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un paiement, dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedDossier} onValueChange={setSelectedDossier}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Tous les dossiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les dossiers</SelectItem>
              {dossiers.map(dossier => (
                <SelectItem key={dossier.id} value={dossier.id}>
                  {dossier.reference} - {dossier.debiteur_nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Dossier</TableHead>
                <TableHead>Débiteur</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPaiements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun paiement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredPaiements.map(paiement => (
                  <TableRow key={paiement.id}>
                    <TableCell>
                      {format(new Date(paiement.date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <span 
                        className="font-mono text-sm text-primary cursor-pointer hover:underline"
                        onClick={() => navigate(`/recouvrement/dossiers/${paiement.dossier_id}`)}
                      >
                        {paiement.dossiers_recouvrement?.reference}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {paiement.dossiers_recouvrement?.debiteur_nom}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{modeLabels[paiement.mode]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paiement.reference || '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatCurrency(paiement.montant)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/recouvrement/dossiers/${paiement.dossier_id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {filteredPaiements.length > 0 && (
            <div className="p-4 border-t bg-muted/30 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total affiché</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totalPaiements)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Nouveau Paiement */}
      <Dialog open={paiementDialogOpen} onOpenChange={setPaiementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
            <DialogDescription>
              Enregistrez un paiement reçu sur un dossier de recouvrement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paiement-dossier">Dossier</Label>
              <Select value={paiementDossier} onValueChange={setPaiementDossier}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un dossier" />
                </SelectTrigger>
                <SelectContent>
                  {dossiers.map(dossier => (
                    <SelectItem key={dossier.id} value={dossier.id}>
                      {dossier.reference} - {dossier.debiteur_nom} ({formatCurrency(dossier.total_a_recouvrer)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paiement-montant">Montant (FCFA)</Label>
              <Input
                id="paiement-montant"
                type="number"
                placeholder="Ex: 500000"
                value={paiementMontant}
                onChange={(e) => setPaiementMontant(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paiement-mode">Mode de paiement</Label>
              <Select value={paiementMode} onValueChange={(v) => setPaiementMode(v as typeof paiementMode)}>
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
              <Label htmlFor="paiement-reference">Référence (optionnel)</Label>
              <Input
                id="paiement-reference"
                placeholder="Ex: REC-2026-001"
                value={paiementReference}
                onChange={(e) => setPaiementReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paiement-commentaire">Commentaire (optionnel)</Label>
              <Textarea
                id="paiement-commentaire"
                placeholder="Informations complémentaires..."
                value={paiementCommentaire}
                onChange={(e) => setPaiementCommentaire(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaiementDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitPaiement} disabled={createPaiement.isPending}>
              {createPaiement.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}