import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useImmeubles, useDepensesImmeubles, useCreateDepenseImmeuble, useUpdateDepenseImmeuble, useDeleteDepenseImmeuble, type DepenseImmeubleDB } from '@/hooks/useImmobilier';
import { useAuth } from '@/contexts/AuthContext';

const TYPE_DEPENSE_LABELS: Record<string, string> = {
  PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
  ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
  ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance',
  SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
  AUTRES_DEPENSES: 'Autres dépenses',
};

const TYPE_DEPENSE_COLORS: Record<string, string> = {
  PLOMBERIE_ASSAINISSEMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ELECTRICITE_ECLAIRAGE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  ENTRETIEN_MAINTENANCE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  SECURITE_GARDIENNAGE_ASSURANCE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  AUTRES_DEPENSES: 'bg-muted text-muted-foreground',
};

export default function DepensesPage() {
  const { user, isAdmin } = useAuth();
  const { data: immeubles = [] } = useImmeubles();
  const { data: depenses = [], isLoading } = useDepensesImmeubles();
  const createDepense = useCreateDepenseImmeuble();
  const updateDepense = useUpdateDepenseImmeuble();
  const deleteDepense = useDeleteDepenseImmeuble();

  const [search, setSearch] = useState('');
  const [filterImmeuble, setFilterImmeuble] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepense, setEditingDepense] = useState<DepenseImmeubleDB | null>(null);
  const [deletingDepense, setDeletingDepense] = useState<DepenseImmeubleDB | null>(null);

  // Form state
  const [form, setForm] = useState({
    immeuble_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    nature: '',
    description: '',
    montant: '',
    type_depense: 'AUTRES_DEPENSES' as DepenseImmeubleDB['type_depense'],
  });

  const immeubleMap = Object.fromEntries(immeubles.map(i => [i.id, i]));

  const filtered = depenses.filter(d => {
    if (filterImmeuble !== 'all' && d.immeuble_id !== filterImmeuble) return false;
    if (filterType !== 'all' && d.type_depense !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      const imm = immeubleMap[d.immeuble_id];
      return d.nature.toLowerCase().includes(s) || (imm?.nom || '').toLowerCase().includes(s);
    }
    return true;
  });

  const totalFiltered = filtered.reduce((sum, d) => sum + Number(d.montant), 0);

  const resetForm = () => {
    setForm({ immeuble_id: '', date: format(new Date(), 'yyyy-MM-dd'), nature: '', description: '', montant: '', type_depense: 'AUTRES_DEPENSES' });
    setEditingDepense(null);
  };

  const openEdit = (d: DepenseImmeubleDB) => {
    setEditingDepense(d);
    setForm({
      immeuble_id: d.immeuble_id,
      date: d.date,
      nature: d.nature,
      description: d.description || '',
      montant: String(d.montant),
      type_depense: d.type_depense,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.immeuble_id || !form.nature || !form.montant) return;

    const payload = {
      immeuble_id: form.immeuble_id,
      date: form.date,
      nature: form.nature,
      description: form.description || null,
      montant: Number(form.montant),
      type_depense: form.type_depense,
    };

    const onSuccess = () => {
      setIsDialogOpen(false);
      resetForm();
    };

    if (editingDepense) {
      updateDepense.mutate({ id: editingDepense.id, ...payload }, { onSuccess });
    } else {
      createDepense.mutate({ ...payload, justificatif: null, created_by: user!.id }, { onSuccess });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dépenses Immeubles</h1>
          <p className="text-sm text-muted-foreground">Suivi des dépenses liées aux immeubles</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle dépense
        </Button>
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total dépenses (filtrées)</p>
              <p className="text-2xl font-bold text-foreground">{totalFiltered.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterImmeuble} onValueChange={setFilterImmeuble}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Immeuble" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les immeubles</SelectItem>
            {immeubles.map(i => (
              <SelectItem key={i.id} value={i.id}>{i.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Immeuble</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune dépense trouvée</TableCell></TableRow>
              ) : (
                filtered.map(d => {
                  const imm = immeubleMap[d.immeuble_id];
                  return (
                    <TableRow key={d.id}>
                      <TableCell>{format(new Date(d.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{imm?.nom || '—'}</TableCell>
                      <TableCell>
                        <div>
                          <span>{d.nature}</span>
                          {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={TYPE_DEPENSE_COLORS[d.type_depense]}>
                          {TYPE_DEPENSE_LABELS[d.type_depense] || d.type_depense}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{Number(d.montant).toLocaleString('fr-FR')} FCFA</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingDepense(d)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDepense ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
            <DialogDescription>{editingDepense ? 'Modifier les informations de la dépense' : 'Enregistrer une dépense liée à un immeuble'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Immeuble *</Label>
              <Select value={form.immeuble_id} onValueChange={v => setForm(f => ({ ...f, immeuble_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un immeuble" /></SelectTrigger>
                <SelectContent>
                  {immeubles.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nom} ({i.reference})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Montant (FCFA) *</Label>
                <Input type="number" min="0" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Type de dépense</Label>
              <Select value={form.type_depense} onValueChange={v => setForm(f => ({ ...f, type_depense: v as DepenseImmeubleDB['type_depense'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nature / Objet *</Label>
              <Input value={form.nature} onChange={e => setForm(f => ({ ...f, nature: e.target.value }))} placeholder="Ex: Réparation fuite d'eau" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails supplémentaires..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={(createDepense.isPending || updateDepense.isPending) || !form.immeuble_id || !form.nature || !form.montant}>
              {(createDepense.isPending || updateDepense.isPending) ? 'Enregistrement...' : editingDepense ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingDepense} onOpenChange={(open) => { if (!open) setDeletingDepense(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer la dépense « {deletingDepense?.nature} » d'un montant de {Number(deletingDepense?.montant || 0).toLocaleString('fr-FR')} FCFA. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingDepense) {
                  deleteDepense.mutate(deletingDepense.id, { onSuccess: () => setDeletingDepense(null) });
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
