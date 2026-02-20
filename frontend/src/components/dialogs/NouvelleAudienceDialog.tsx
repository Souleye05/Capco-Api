import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAffaires } from '@/hooks/useAffaires';
import { useCreateAudience } from '@/hooks/useAudiences';

interface NouvelleAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAffaireId?: string;
}

export function NouvelleAudienceDialog({ open, onOpenChange, preselectedAffaireId }: NouvelleAudienceDialogProps) {
  const { data: affaires = [], isLoading: affairesLoading } = useAffaires();
  const createAudience = useCreateAudience();
  
  const [formData, setFormData] = useState({
    affaireId: preselectedAffaireId || '',
    date: '',
    heure: '',
    type: 'MISE_EN_ETAT' as const,
    juridiction: '',
    chambre: '',
    ville: '',
    notesPreparation: ''
  });

  const resetForm = () => {
    setFormData({
      affaireId: preselectedAffaireId || '',
      date: '',
      heure: '',
      type: 'MISE_EN_ETAT',
      juridiction: '',
      chambre: '',
      ville: '',
      notesPreparation: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.affaireId || !formData.date || !formData.juridiction) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createAudience.mutateAsync({
        affaireId: formData.affaireId,
        date: formData.date,
        heure: formData.heure || undefined,
        type: formData.type,
        juridiction: formData.juridiction,
        chambre: formData.chambre || undefined,
        ville: formData.ville || undefined,
        notesPreparation: formData.notesPreparation || undefined,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nouvelle audience</DialogTitle>
          <DialogDescription>
            Programmer une nouvelle audience pour une affaire
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Affaire */}
          <div className="space-y-2">
            <Label htmlFor="affaire">Affaire *</Label>
            <Select
              value={formData.affaireId}
              onValueChange={(value) => setFormData({ ...formData, affaireId: value })}
              disabled={!!preselectedAffaireId || affairesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={affairesLoading ? "Chargement..." : "Sélectionner une affaire"} />
              </SelectTrigger>
              <SelectContent>
                {affaires
                  .filter(a => a.statut === 'ACTIVE' || a.statut === 'EN_COURS')
                  .map((affaire) => (
                    <SelectItem key={affaire.id} value={affaire.id}>
                      {affaire.reference} - {affaire.intitule}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type d'audience */}
          <div className="space-y-2">
            <Label htmlFor="type">Type d'audience *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MISE_EN_ETAT">Mise en état</SelectItem>
                <SelectItem value="PLAIDOIRIE">Plaidoirie</SelectItem>
                <SelectItem value="REFERE">Référé</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date et heure */}
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

          {/* Juridiction */}
          <div className="space-y-2">
            <Label htmlFor="juridiction">Juridiction *</Label>
            <Select
              value={formData.juridiction}
              onValueChange={(value) => setFormData({ ...formData, juridiction: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la juridiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tribunal de Commerce de Dakar">Tribunal de Commerce de Dakar</SelectItem>
                <SelectItem value="Tribunal de Grande Instance de Dakar">Tribunal de Grande Instance de Dakar</SelectItem>
                <SelectItem value="Tribunal du Travail de Dakar">Tribunal du Travail de Dakar</SelectItem>
                <SelectItem value="Cour d'Appel de Dakar">Cour d'Appel de Dakar</SelectItem>
                <SelectItem value="Tribunal Régional de Thiès">Tribunal Régional de Thiès</SelectItem>
                <SelectItem value="Tribunal Régional de Saint-Louis">Tribunal Régional de Saint-Louis</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chambre et ville */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chambre">Chambre</Label>
              <Input
                id="chambre"
                value={formData.chambre}
                onChange={(e) => setFormData({ ...formData, chambre: e.target.value })}
                placeholder="Ex: 3ème Chambre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                placeholder="Ex: Dakar"
              />
            </div>
          </div>

          {/* Notes de préparation */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes de préparation</Label>
            <Textarea
              id="notes"
              value={formData.notesPreparation}
              onChange={(e) => setFormData({ ...formData, notesPreparation: e.target.value })}
              placeholder="Points à préparer, documents à apporter, stratégie..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createAudience.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createAudience.isPending || affairesLoading}
            >
              {createAudience.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'audience
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}