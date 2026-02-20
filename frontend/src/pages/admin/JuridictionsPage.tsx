import { useState } from 'react';
import { Plus, Search, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  useJuridictions, 
  useCreateJuridiction, 
  useUpdateJuridiction, 
  useDeleteJuridiction,
  type CreateJuridictionData,
  type Juridiction
} from '@/hooks/useJuridictions';

const TYPES_JURIDICTION = [
  'Tribunal de Grande Instance',
  'Tribunal de Commerce',
  'Tribunal du Travail',
  'Cour d\'Appel',
  'Tribunal Administratif',
  'Autre'
];

export default function JuridictionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedJuridiction, setSelectedJuridiction] = useState<Juridiction | null>(null);

  const { data: juridictionsData, isLoading } = useJuridictions({ 
    page, 
    limit: 10, 
    search: search || undefined 
  });
  
  const createMutation = useCreateJuridiction();
  const updateMutation = useUpdateJuridiction();
  const deleteMutation = useDeleteJuridiction();

  const [formData, setFormData] = useState<CreateJuridictionData>({
    nom: '',
    type: '',
    ville: '',
    adresse: '',
    telephone: '',
    email: '',
    actif: true,
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      type: '',
      ville: '',
      adresse: '',
      telephone: '',
      email: '',
      actif: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.nom || !formData.type || !formData.ville) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setCreateOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (juridiction: Juridiction) => {
    setSelectedJuridiction(juridiction);
    setFormData({
      nom: juridiction.nom,
      type: juridiction.type,
      ville: juridiction.ville,
      adresse: juridiction.adresse || '',
      telephone: juridiction.telephone || '',
      email: juridiction.email || '',
      actif: juridiction.actif,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedJuridiction) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedJuridiction.id,
        data: formData,
      });
      setEditOpen(false);
      setSelectedJuridiction(null);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette juridiction ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const juridictions = juridictionsData?.data || [];
  const meta = juridictionsData?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestion des Juridictions"
        description="Administrez les juridictions de votre système"
        action={{
          label: 'Nouvelle juridiction',
          onClick: () => setCreateOpen(true),
          icon: <Plus className="h-4 w-4" />
        }}
      />

      {/* Barre de recherche */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une juridiction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </Card>

      {/* Tableau des juridictions */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : juridictions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucune juridiction trouvée
                </TableCell>
              </TableRow>
            ) : (
              juridictions.map((juridiction) => (
                <TableRow key={juridiction.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{juridiction.nom}</span>
                    </div>
                  </TableCell>
                  <TableCell>{juridiction.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{juridiction.ville}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {juridiction.telephone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{juridiction.telephone}</span>
                        </div>
                      )}
                      {juridiction.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{juridiction.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={juridiction.actif ? 'default' : 'secondary'}>
                      {juridiction.actif ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(juridiction)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(juridiction.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="flex items-center px-4">
            Page {page} sur {meta.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialog de création */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle juridiction</DialogTitle>
            <DialogDescription>
              Créer une nouvelle juridiction dans le système
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Tribunal de Commerce de Dakar"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Sélectionner un type</option>
                {TYPES_JURIDICTION.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ville">Ville *</Label>
              <Input
                id="ville"
                value={formData.ville}
                onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                placeholder="Ex: Dakar"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                placeholder="Adresse complète"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                  placeholder="+221 XX XXX XX XX"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@juridiction.sn"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
              />
              <Label htmlFor="actif">Juridiction active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la juridiction</DialogTitle>
            <DialogDescription>
              Modifier les informations de la juridiction
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Même formulaire que pour la création */}
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom *</Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
              <select
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Sélectionner un type</option>
                {TYPES_JURIDICTION.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-ville">Ville *</Label>
              <Input
                id="edit-ville"
                value={formData.ville}
                onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-adresse">Adresse</Label>
              <Input
                id="edit-adresse"
                value={formData.adresse}
                onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telephone">Téléphone</Label>
                <Input
                  id="edit-telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
              />
              <Label htmlFor="edit-actif">Juridiction active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}