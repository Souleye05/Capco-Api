import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useProprietaires, useUpdateImmeuble, ImmeubleDB } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface EditImmeubleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  immeuble: ImmeubleDB & { proprietaires?: { nom: string } | null };
}

export function EditImmeubleDialog({ open, onOpenChange, immeuble }: EditImmeubleDialogProps) {
  const { data: proprietaires = [], isLoading: loadingProprietaires } = useProprietaires();
  const updateImmeuble = useUpdateImmeuble();
  
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    proprietaire_id: '',
    taux_commission_capco: '',
    notes: ''
  });

  useEffect(() => {
    if (immeuble && open) {
      setFormData({
        nom: immeuble.nom || '',
        adresse: immeuble.adresse || '',
        proprietaire_id: immeuble.proprietaire_id || '',
        taux_commission_capco: String(immeuble.taux_commission_capco || 5),
        notes: immeuble.notes || ''
      });
    }
  }, [immeuble, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.adresse || !formData.proprietaire_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await updateImmeuble.mutateAsync({
        id: immeuble.id,
        nom: formData.nom,
        adresse: formData.adresse,
        proprietaire_id: formData.proprietaire_id,
        taux_commission_capco: parseFloat(formData.taux_commission_capco) || 5,
        notes: formData.notes || null
      });
      
      toast.success('Immeuble modifié avec succès');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating immeuble:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier l'immeuble</DialogTitle>
          <DialogDescription>
            Modifier les informations de l'immeuble
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom de l'immeuble *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Résidence Les Acacias"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse *</Label>
            <Input
              id="adresse"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse complète de l'immeuble"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proprietaire">Propriétaire *</Label>
            <Select
              value={formData.proprietaire_id}
              onValueChange={(value) => setFormData({ ...formData, proprietaire_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le propriétaire" />
              </SelectTrigger>
              <SelectContent>
                {loadingProprietaires ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  proprietaires.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.nom}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tauxCommission">Taux de commission CAPCO (%)</Label>
            <Input
              id="tauxCommission"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.taux_commission_capco}
              onChange={(e) => setFormData({ ...formData, taux_commission_capco: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateImmeuble.isPending}>
              {updateImmeuble.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
