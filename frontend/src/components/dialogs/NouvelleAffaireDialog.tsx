import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface NouvelleAffaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouvelleAffaireDialog({ open, onOpenChange }: NouvelleAffaireDialogProps) {
  const [formData, setFormData] = useState({
    intitule: '',
    demandeur: '',
    defendeur: '',
    juridiction: '',
    chambre: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.intitule || !formData.demandeur || !formData.defendeur || !formData.juridiction) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    toast.success('Affaire créée avec succès');
    onOpenChange(false);
    setFormData({ intitule: '', demandeur: '', defendeur: '', juridiction: '', chambre: '', notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Nouvelle affaire contentieuse</DialogTitle>
          <DialogDescription>
            Créer une nouvelle affaire au contentieux
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="intitule">Intitulé de l'affaire *</Label>
            <Input
              id="intitule"
              value={formData.intitule}
              onChange={(e) => setFormData({ ...formData, intitule: e.target.value })}
              placeholder="Ex: SARL Durand c/ SCI Les Oliviers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demandeur">Demandeur *</Label>
              <Input
                id="demandeur"
                value={formData.demandeur}
                onChange={(e) => setFormData({ ...formData, demandeur: e.target.value })}
                placeholder="Nom du demandeur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defendeur">Défendeur *</Label>
              <Input
                id="defendeur"
                value={formData.defendeur}
                onChange={(e) => setFormData({ ...formData, defendeur: e.target.value })}
                placeholder="Nom du défendeur"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="juridiction">Juridiction *</Label>
              <Select
                value={formData.juridiction}
                onValueChange={(value) => setFormData({ ...formData, juridiction: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tribunal de Commerce">Tribunal de Commerce</SelectItem>
                  <SelectItem value="Tribunal Judiciaire">Tribunal Judiciaire</SelectItem>
                  <SelectItem value="Tribunal Administratif">Tribunal Administratif</SelectItem>
                  <SelectItem value="Cour d'Appel">Cour d'Appel</SelectItem>
                  <SelectItem value="Conseil de Prud'hommes">Conseil de Prud'hommes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chambre">Chambre</Label>
              <Input
                id="chambre"
                value={formData.chambre}
                onChange={(e) => setFormData({ ...formData, chambre: e.target.value })}
                placeholder="Ex: 3ème Chambre"
              />
            </div>
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
            <Button type="submit">Créer l'affaire</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}