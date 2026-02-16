import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAffaires } from '@/data/mockData';
import { toast } from 'sonner';

interface NouvelleAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouvelleAudienceDialog({ open, onOpenChange }: NouvelleAudienceDialogProps) {
  const [formData, setFormData] = useState({
    affaireId: '',
    date: '',
    heure: '',
    objet: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.affaireId || !formData.date || !formData.objet) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    toast.success('Audience créée avec succès');
    onOpenChange(false);
    setFormData({ affaireId: '', date: '', heure: '', objet: '', notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle audience</DialogTitle>
          <DialogDescription>
            Programmer une nouvelle audience pour une affaire
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="affaire">Affaire *</Label>
            <Select
              value={formData.affaireId}
              onValueChange={(value) => setFormData({ ...formData, affaireId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une affaire" />
              </SelectTrigger>
              <SelectContent>
                {mockAffaires.filter(a => a.statut === 'ACTIVE').map((affaire) => (
                  <SelectItem key={affaire.id} value={affaire.id}>
                    {affaire.reference} - {affaire.intitule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objet">Objet de l'audience *</Label>
            <Select
              value={formData.objet}
              onValueChange={(value) => setFormData({ ...formData, objet: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'objet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MISE_EN_ETAT">Mise en état</SelectItem>
                <SelectItem value="PLAIDOIRIE">Plaidoirie</SelectItem>
                <SelectItem value="REFERE">Référé</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heure">Heure</Label>
              <Input
                id="heure"
                type="time"
                value={formData.heure}
                onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes de préparation</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Points à préparer, documents à apporter..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer l'audience</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}