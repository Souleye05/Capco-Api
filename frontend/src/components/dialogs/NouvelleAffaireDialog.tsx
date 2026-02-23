import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateAffaire, AffaireDB } from '@/hooks/useAffaires';

interface PartieForm {
  nom: string;
  role: 'DEMANDEUR' | 'DEFENDEUR';
  adresse?: string;
  telephone?: string;
  email?: string;
}

interface NouvelleAffaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (affaire: AffaireDB) => void;
}

export function NouvelleAffaireDialog({ open, onOpenChange, onSuccess }: NouvelleAffaireDialogProps) {
  const createAffaire = useCreateAffaire();

  const [formData, setFormData] = useState({
    intitule: '',
    observations: ''
  });

  // ... rest of state stays same ...
  const [demandeurs, setDemandeurs] = useState<PartieForm[]>([
    { nom: '', role: 'DEMANDEUR' as const }
  ]);

  const [defendeurs, setDefendeurs] = useState<PartieForm[]>([
    { nom: '', role: 'DEFENDEUR' as const }
  ]);

  const resetForm = () => {
    setFormData({ intitule: '', observations: '' });
    setDemandeurs([{ nom: '', role: 'DEMANDEUR' }]);
    setDefendeurs([{ nom: '', role: 'DEFENDEUR' }]);
  };

  const addPartie = (type: 'demandeur' | 'defendeur') => {
    if (type === 'demandeur') {
      setDemandeurs([...demandeurs, { nom: '', role: 'DEMANDEUR' }]);
    } else {
      setDefendeurs([...defendeurs, { nom: '', role: 'DEFENDEUR' }]);
    }
  };

  const removePartie = (type: 'demandeur' | 'defendeur', index: number) => {
    if (type === 'demandeur' && demandeurs.length > 1) {
      setDemandeurs(demandeurs.filter((_, i) => i !== index));
    } else if (type === 'defendeur' && defendeurs.length > 1) {
      setDefendeurs(defendeurs.filter((_, i) => i !== index));
    }
  };

  const updatePartie = (type: 'demandeur' | 'defendeur', index: number, field: keyof PartieForm, value: string) => {
    if (type === 'demandeur') {
      const updated = [...demandeurs];
      updated[index] = { ...updated[index], [field]: value };
      setDemandeurs(updated);
    } else {
      const updated = [...defendeurs];
      updated[index] = { ...updated[index], [field]: value };
      setDefendeurs(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.intitule.trim()) {
      toast.error('Veuillez saisir l\'intitulé de l\'affaire');
      return;
    }

    const validDemandeurs = demandeurs.filter(d => d.nom.trim());
    const validDefendeurs = defendeurs.filter(d => d.nom.trim());

    if (validDemandeurs.length === 0) {
      toast.error('Veuillez saisir au moins un demandeur');
      return;
    }

    if (validDefendeurs.length === 0) {
      toast.error('Veuillez saisir au moins un défendeur');
      return;
    }

    try {
      const result = await createAffaire.mutateAsync({
        intitule: formData.intitule.trim(),
        demandeurs: validDemandeurs.map(d => ({ ...d, role: 'DEMANDEUR' as const })),
        defendeurs: validDefendeurs.map(d => ({ ...d, role: 'DEFENDEUR' as const })),
        observations: formData.observations.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle affaire contentieuse</DialogTitle>
          <DialogDescription>
            Créer une nouvelle affaire au contentieux avec les parties concernées
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Intitulé */}
          <div className="space-y-2">
            <Label htmlFor="intitule">Intitulé de l'affaire *</Label>
            <Input
              id="intitule"
              value={formData.intitule}
              onChange={(e) => setFormData({ ...formData, intitule: e.target.value })}
              placeholder="Ex: SARL Durand c/ SCI Les Oliviers - Expulsion"
            />
          </div>

          {/* Demandeurs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Demandeurs *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPartie('demandeur')}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </Button>
            </div>

            {demandeurs.map((demandeur, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Demandeur {index + 1}
                  </span>
                  {demandeurs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePartie('demandeur', index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`demandeur-nom-${index}`}>Nom *</Label>
                    <Input
                      id={`demandeur-nom-${index}`}
                      value={demandeur.nom}
                      onChange={(e) => updatePartie('demandeur', index, 'nom', e.target.value)}
                      placeholder="Nom du demandeur"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`demandeur-telephone-${index}`}>Téléphone</Label>
                    <Input
                      id={`demandeur-telephone-${index}`}
                      value={demandeur.telephone || ''}
                      onChange={(e) => updatePartie('demandeur', index, 'telephone', e.target.value)}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`demandeur-email-${index}`}>Email</Label>
                    <Input
                      id={`demandeur-email-${index}`}
                      type="email"
                      value={demandeur.email || ''}
                      onChange={(e) => updatePartie('demandeur', index, 'email', e.target.value)}
                      placeholder="Adresse email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`demandeur-adresse-${index}`}>Adresse</Label>
                    <Input
                      id={`demandeur-adresse-${index}`}
                      value={demandeur.adresse || ''}
                      onChange={(e) => updatePartie('demandeur', index, 'adresse', e.target.value)}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Défendeurs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Défendeurs *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPartie('defendeur')}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </Button>
            </div>

            {defendeurs.map((defendeur, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Défendeur {index + 1}
                  </span>
                  {defendeurs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePartie('defendeur', index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`defendeur-nom-${index}`}>Nom *</Label>
                    <Input
                      id={`defendeur-nom-${index}`}
                      value={defendeur.nom}
                      onChange={(e) => updatePartie('defendeur', index, 'nom', e.target.value)}
                      placeholder="Nom du défendeur"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`defendeur-telephone-${index}`}>Téléphone</Label>
                    <Input
                      id={`defendeur-telephone-${index}`}
                      value={defendeur.telephone || ''}
                      onChange={(e) => updatePartie('defendeur', index, 'telephone', e.target.value)}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`defendeur-email-${index}`}>Email</Label>
                    <Input
                      id={`defendeur-email-${index}`}
                      type="email"
                      value={defendeur.email || ''}
                      onChange={(e) => updatePartie('defendeur', index, 'email', e.target.value)}
                      placeholder="Adresse email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`defendeur-adresse-${index}`}>Adresse</Label>
                    <Input
                      id={`defendeur-adresse-${index}`}
                      value={defendeur.adresse || ''}
                      onChange={(e) => updatePartie('defendeur', index, 'adresse', e.target.value)}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Informations complémentaires sur l'affaire..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAffaire.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createAffaire.isPending}
            >
              {createAffaire.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer l'affaire
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}