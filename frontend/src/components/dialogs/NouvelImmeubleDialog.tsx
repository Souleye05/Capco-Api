import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockProprietaires } from '@/data/mockData';
import { toast } from 'sonner';

interface NouvelImmeubleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouvelImmeubleDialog({ open, onOpenChange }: NouvelImmeubleDialogProps) {
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

    toast.success('Immeuble créé avec succès');
    onOpenChange(false);
    setFormData({ nom: '', adresse: '', proprietaireId: '', tauxCommission: '10', notes: '' });
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
              value={formData.proprietaireId}
              onValueChange={(value) => setFormData({ ...formData, proprietaireId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le propriétaire" />
              </SelectTrigger>
              <SelectContent>
                {mockProprietaires.map((prop) => (
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
            <Button type="submit">Créer l'immeuble</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}