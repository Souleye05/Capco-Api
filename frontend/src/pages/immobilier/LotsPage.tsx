import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Home,
  Building2,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useLots, useImmeubles, useCreateLot, useUpdateLot, useLocataires, LotDB } from '@/hooks/useImmobilier';
import { useAuth } from '@/contexts/AuthContext';

export default function LotsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: lots = [], isLoading: lotsLoading } = useLots();
  const { data: immeubles = [], isLoading: immeublesLoading } = useImmeubles();
  const { data: locataires = [] } = useLocataires();
  const createLot = useCreateLot();
  const updateLot = useUpdateLot();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImmeuble, setSelectedImmeuble] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  
  // Dialog nouveau lot
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [lotImmeuble, setLotImmeuble] = useState('');
  const [lotNumero, setLotNumero] = useState('');
  const [lotType, setLotType] = useState<'STUDIO' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'MAGASIN' | 'BUREAU' | 'AUTRE'>('AUTRE');
  const [lotEtage, setLotEtage] = useState('');
  const [lotLoyer, setLotLoyer] = useState('');

  // Dialog modifier lot
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<LotDB | null>(null);
  const [editStatut, setEditStatut] = useState<'OCCUPE' | 'LIBRE'>('LIBRE');
  const [editLocataire, setEditLocataire] = useState<string>('none');
  const [editLoyer, setEditLoyer] = useState('');
  const [editNumero, setEditNumero] = useState('');
  const [editType, setEditType] = useState<string>('AUTRE');
  const [editEtage, setEditEtage] = useState('');

  const isLoading = lotsLoading || immeublesLoading;

  // Enrichir les lots avec les données des immeubles
  const enrichedLots = lots.map(lot => {
    const immeuble = immeubles.find(i => i.id === lot.immeuble_id);
    return {
      ...lot,
      immeuble
    };
  });

  const filteredLots = enrichedLots.filter(lot => {
    const matchesSearch = 
      lot.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.immeuble?.nom.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesImmeuble = selectedImmeuble === 'all' || lot.immeuble_id === selectedImmeuble;
    const matchesStatut = selectedStatut === 'all' || lot.statut === selectedStatut;
    
    return matchesSearch && matchesImmeuble && matchesStatut;
  });

  const lotsOccupes = lots.filter(l => l.statut === 'OCCUPE').length;
  const lotsLibres = lots.filter(l => l.statut === 'LIBRE').length;

  const handleSubmitLot = async () => {
    if (!lotImmeuble) {
      toast.error('Veuillez sélectionner un immeuble');
      return;
    }
    if (!lotNumero.trim()) {
      toast.error('Veuillez saisir le numéro du lot');
      return;
    }
    const loyer = parseFloat(lotLoyer);
    if (isNaN(loyer) || loyer <= 0) {
      toast.error('Veuillez saisir un loyer valide');
      return;
    }
    
    try {
      await createLot.mutateAsync({
        immeuble_id: lotImmeuble,
        numero: lotNumero,
        type: lotType,
        etage: lotEtage || null,
        loyer_mensuel_attendu: loyer,
        statut: 'LIBRE',
        locataire_id: null,
        created_by: user?.id
      });
      
      setLotDialogOpen(false);
      setLotImmeuble('');
      setLotNumero('');
      setLotType('AUTRE');
      setLotEtage('');
      setLotLoyer('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const openEditDialog = (lot: LotDB) => {
    setEditingLot(lot);
    setEditStatut(lot.statut as 'OCCUPE' | 'LIBRE');
    setEditLocataire(lot.locataire_id || 'none');
    setEditLoyer(String(lot.loyer_mensuel_attendu));
    setEditNumero(lot.numero);
    setEditType(lot.type || 'AUTRE');
    setEditEtage(lot.etage || '');
    setEditDialogOpen(true);
  };

  const handleUpdateLot = async () => {
    if (!editingLot) return;
    
    const loyer = parseFloat(editLoyer);
    if (isNaN(loyer) || loyer <= 0) {
      toast.error('Veuillez saisir un loyer valide');
      return;
    }
    
    try {
      await updateLot.mutateAsync({
        id: editingLot.id,
        numero: editNumero,
        type: editType as 'STUDIO' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'MAGASIN' | 'BUREAU' | 'AUTRE',
        etage: editEtage || null,
        loyer_mensuel_attendu: loyer,
        statut: editStatut,
        locataire_id: editStatut === 'LIBRE' ? null : (editLocataire === 'none' ? null : editLocataire)
      });
      
      setEditDialogOpen(false);
      setEditingLot(null);
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
        title="Lots / Appartements" 
        subtitle={`${lots.length} lots gérés • ${lotsOccupes} occupés • ${lotsLibres} libres`}
        actions={
          <Button className="gap-2" onClick={() => setLotDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau lot
          </Button>
        }
      />

      <div className="p-6 animate-fade-in space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un lot, locataire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedImmeuble} onValueChange={setSelectedImmeuble}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les immeubles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les immeubles</SelectItem>
              {immeubles.map(imm => (
                <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedStatut} onValueChange={setSelectedStatut}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="OCCUPE">Occupés</SelectItem>
              <SelectItem value="LIBRE">Libres</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Immeuble</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Étage</TableHead>
                <TableHead className="text-right">Loyer mensuel</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun lot trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredLots.map(lot => (
                  <TableRow key={lot.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {lot.numero}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-2 hover:text-primary cursor-pointer"
                        onClick={() => navigate(`/immobilier/immeubles/${lot.immeuble_id}`)}
                      >
                        <Building2 className="h-4 w-4" />
                        {lot.immeuble?.nom}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lot.type}</Badge>
                    </TableCell>
                    <TableCell>{lot.etage || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(lot.loyer_mensuel_attendu)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        lot.statut === 'OCCUPE' && 'bg-success/10 text-success',
                        lot.statut === 'LIBRE' && 'bg-warning/10 text-warning'
                      )}>
                        {lot.statut === 'OCCUPE' && <Check className="h-3 w-3 mr-1" />}
                        {lot.statut === 'LIBRE' && <X className="h-3 w-3 mr-1" />}
                        {lot.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => navigate(`/immobilier/immeubles/${lot.immeuble_id}`)}
                          >
                            <Eye className="h-4 w-4" /> Voir immeuble
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => openEditDialog(lot)}
                          >
                            <Edit className="h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog Nouveau Lot */}
      <Dialog open={lotDialogOpen} onOpenChange={setLotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau lot</DialogTitle>
            <DialogDescription>
              Créez un nouveau lot ou appartement à gérer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lot-immeuble">Immeuble</Label>
              <Select value={lotImmeuble} onValueChange={setLotImmeuble}>
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
                <Label htmlFor="lot-numero">Numéro du lot</Label>
                <Input
                  id="lot-numero"
                  placeholder="Ex: A01, B12..."
                  value={lotNumero}
                  onChange={(e) => setLotNumero(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lot-etage">Étage (optionnel)</Label>
                <Input
                  id="lot-etage"
                  placeholder="Ex: RDC, 1er, 2ème..."
                  value={lotEtage}
                  onChange={(e) => setLotEtage(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lot-type">Type de lot</Label>
              <Select value={lotType} onValueChange={(v) => setLotType(v as typeof lotType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDIO">Studio</SelectItem>
                  <SelectItem value="F1">F1</SelectItem>
                  <SelectItem value="F2">F2</SelectItem>
                  <SelectItem value="F3">F3</SelectItem>
                  <SelectItem value="F4">F4</SelectItem>
                  <SelectItem value="F5">F5</SelectItem>
                  <SelectItem value="MAGASIN">Magasin</SelectItem>
                  <SelectItem value="BUREAU">Bureau</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lot-loyer">Loyer mensuel attendu (FCFA)</Label>
              <Input
                id="lot-loyer"
                type="number"
                placeholder="Ex: 150000"
                value={lotLoyer}
                onChange={(e) => setLotLoyer(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLotDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmitLot} disabled={createLot.isPending}>
              {createLot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le lot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Lot */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le lot</DialogTitle>
            <DialogDescription>
              Modifiez les informations du lot {editingLot?.numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numéro du lot</Label>
                <Input
                  value={editNumero}
                  onChange={(e) => setEditNumero(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Étage</Label>
                <Input
                  value={editEtage}
                  onChange={(e) => setEditEtage(e.target.value)}
                  placeholder="Ex: RDC, 1er..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Type de lot</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDIO">Studio</SelectItem>
                  <SelectItem value="F1">F1</SelectItem>
                  <SelectItem value="F2">F2</SelectItem>
                  <SelectItem value="F3">F3</SelectItem>
                  <SelectItem value="F4">F4</SelectItem>
                  <SelectItem value="F5">F5</SelectItem>
                  <SelectItem value="MAGASIN">Magasin</SelectItem>
                  <SelectItem value="BUREAU">Bureau</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Loyer mensuel (FCFA)</Label>
              <Input
                type="number"
                value={editLoyer}
                onChange={(e) => setEditLoyer(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={editStatut} onValueChange={(v) => setEditStatut(v as 'OCCUPE' | 'LIBRE')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OCCUPE">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      Occupé
                    </div>
                  </SelectItem>
                  <SelectItem value="LIBRE">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-warning" />
                      Libre
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editStatut === 'OCCUPE' && (
              <div className="space-y-2">
                <Label>Locataire</Label>
                <Select value={editLocataire} onValueChange={setEditLocataire}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un locataire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun locataire sélectionné</SelectItem>
                    {locataires.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {loc.nom}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {locataires.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun locataire disponible. Vous pouvez en créer via l'import Excel.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateLot} disabled={updateLot.isPending}>
              {updateLot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
