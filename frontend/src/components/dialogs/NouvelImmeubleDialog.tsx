import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateImmeuble, useProprietaires } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface NouvelImmeubleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouvelImmeubleDialog({ open, onOpenChange }: NouvelImmeubleDialogProps) {
  const { data: proprietairesResult, isLoading: isLoadingProprietaires } = useProprietaires({ limit: 100 });
  const proprietaires = proprietairesResult?.data || [];
  const createImmeuble = useCreateImmeuble();

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    proprietaireId: '',
    tauxCommission: '10',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.adresse || !formData.proprietaireId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    createImmeuble.mutate(
      {
        nom: formData.nom,
        adresse: formData.adresse,
        proprietaireId: formData.proprietaireId,
        tauxCommissionCapco: Number(formData.tauxCommission),
        notes: formData.notes
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({ nom: '', adresse: '', proprietaireId: '', tauxCommission: '10', notes: '' });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvel immeuble</DialogTitle>
          <DialogDescription>
            Ajouter un nouvel immeuble en gestion
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
              disabled={createImmeuble.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse *</Label>
            <Input
              id="adresse"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse complète de l'immeuble"
              disabled={createImmeuble.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proprietaire">Propriétaire *</Label>
            <Select
              value={formData.proprietaireId}
              onValueChange={(value) => setFormData({ ...formData, proprietaireId: value })}
              disabled={isLoadingProprietaires || createImmeuble.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le propriétaire" />
              </SelectTrigger>
              <SelectContent>
                {proprietaires.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.nom}
                  </SelectItem>
                ))}
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
              value={formData.tauxCommission}
              onChange={(e) => setFormData({ ...formData, tauxCommission: e.target.value })}
              disabled={createImmeuble.isPending}
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
              disabled={createImmeuble.isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createImmeuble.isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={createImmeuble.isPending}>
              {createImmeuble.isPending ? 'Création...' : "Créer l'immeuble"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}