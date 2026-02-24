import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateAffaire, AffaireDB } from '@/hooks/useAffaires';

interface PartieForm {
  nom: string;
  role: 'DEMANDEUR' | 'DEFENDEUR';
  telephone?: string;
  adresse?: string;
}

interface HonoraireForm {
  montantFacture: string;
  montantEncaisse: string;
  dateFacturation: string;
  notes: string;
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
    nature: 'CIVILE' as string,
    observations: ''
  });

  const [demandeurs, setDemandeurs] = useState<PartieForm[]>([
    { nom: '', role: 'DEMANDEUR' as const }
  ]);

  const [defendeurs, setDefendeurs] = useState<PartieForm[]>([
    { nom: '', role: 'DEFENDEUR' as const }
  ]);

  const [showHonoraire, setShowHonoraire] = useState(false);
  const [honoraireForm, setHonoraireForm] = useState<HonoraireForm>({
    montantFacture: '',
    montantEncaisse: '',
    dateFacturation: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({ intitule: '', nature: 'CIVILE', observations: '' });
    setDemandeurs([{ nom: '', role: 'DEMANDEUR' }]);
    setDefendeurs([{ nom: '', role: 'DEFENDEUR' }]);
    setShowHonoraire(false);
    setHonoraireForm({ montantFacture: '', montantEncaisse: '', dateFacturation: '', notes: '' });
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

    // Validation honoraire si activé
    if (showHonoraire) {
      const montant = parseFloat(honoraireForm.montantFacture);
      if (isNaN(montant) || montant <= 0) {
        toast.error('Veuillez saisir un montant facturé valide');
        return;
      }
    }

    try {
      const payload: any = {
        intitule: formData.intitule.trim(),
        nature: formData.nature as any,
        demandeurs: validDemandeurs.map(d => ({ ...d, role: 'DEMANDEUR' as const })),
        defendeurs: validDefendeurs.map(d => ({ ...d, role: 'DEFENDEUR' as const })),
        observations: formData.observations.trim() || undefined,
      };

      // Ajouter l'honoraire si activé
      if (showHonoraire && honoraireForm.montantFacture) {
        payload.honoraire = {
          montantFacture: parseFloat(honoraireForm.montantFacture),
          montantEncaisse: honoraireForm.montantEncaisse ? parseFloat(honoraireForm.montantEncaisse) : undefined,
          dateFacturation: honoraireForm.dateFacturation || undefined,
          notes: honoraireForm.notes.trim() || undefined,
        };
      }

      const result = await createAffaire.mutateAsync(payload);

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
          {/* Intitulé & Nature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="intitule">Intitulé de l'affaire *</Label>
              <Input
                id="intitule"
                value={formData.intitule}
                onChange={(e) => setFormData({ ...formData, intitule: e.target.value })}
                placeholder="Ex: SARL Durand c/ SCI Les Oliviers - Expulsion"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nature">Nature de l'affaire</Label>
              <Select
                value={formData.nature}
                onValueChange={(value) => setFormData({ ...formData, nature: value })}
              >
                <SelectTrigger id="nature">
                  <SelectValue placeholder="Sélectionner la nature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIVILE">Civile</SelectItem>
                  <SelectItem value="COMMERCIALE">Commerciale</SelectItem>
                  <SelectItem value="PENALE">Pénale</SelectItem>
                  <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                  <SelectItem value="SOCIALE">Sociale</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          {/* Honoraire initial */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Honoraire initial
              </Label>
              <Button
                type="button"
                variant={showHonoraire ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHonoraire(!showHonoraire)}
                className="gap-1"
              >
                {showHonoraire ? 'Retirer' : 'Ajouter un honoraire'}
              </Button>
            </div>

            {showHonoraire && (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="honoraire-montant-facture">Montant facturé (FCFA) *</Label>
                    <Input
                      id="honoraire-montant-facture"
                      type="number"
                      min="0"
                      step="1000"
                      value={honoraireForm.montantFacture}
                      onChange={(e) => setHonoraireForm({ ...honoraireForm, montantFacture: e.target.value })}
                      placeholder="Ex: 500000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="honoraire-montant-encaisse">Montant encaissé (FCFA)</Label>
                    <Input
                      id="honoraire-montant-encaisse"
                      type="number"
                      min="0"
                      step="1000"
                      value={honoraireForm.montantEncaisse}
                      onChange={(e) => setHonoraireForm({ ...honoraireForm, montantEncaisse: e.target.value })}
                      placeholder="Ex: 200000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="honoraire-date">Date de facturation</Label>
                    <Input
                      id="honoraire-date"
                      type="date"
                      value={honoraireForm.dateFacturation}
                      onChange={(e) => setHonoraireForm({ ...honoraireForm, dateFacturation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="honoraire-notes">Notes</Label>
                    <Input
                      id="honoraire-notes"
                      value={honoraireForm.notes}
                      onChange={(e) => setHonoraireForm({ ...honoraireForm, notes: e.target.value })}
                      placeholder="Notes sur l'honoraire"
                    />
                  </div>
                </div>
              </div>
            )}
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