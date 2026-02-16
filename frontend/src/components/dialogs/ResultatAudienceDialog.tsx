import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AudienceDB } from '@/hooks/useAudiences';
import { toast } from 'sonner';

interface ResultatAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience?: AudienceDB | null;
}

export function ResultatAudienceDialog({ open, onOpenChange, audience }: ResultatAudienceDialogProps) {
  const [formData, setFormData] = useState({
    typeResultat: '',
    nouvelleDate: '',
    motifRenvoi: '',
    motifRadiation: '',
    texteDelibere: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.typeResultat) {
      toast.error('Veuillez sélectionner le type de résultat');
      return;
    }

    if (formData.typeResultat === 'RENVOI' && !formData.nouvelleDate) {
      toast.error('Veuillez indiquer la nouvelle date pour le renvoi');
      return;
    }

    toast.success('Résultat de l\'audience enregistré');
    onOpenChange(false);
    setFormData({ typeResultat: '', nouvelleDate: '', motifRenvoi: '', motifRadiation: '', texteDelibere: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Saisir le résultat de l'audience</DialogTitle>
          <DialogDescription>
            {audience?.affaires?.reference} - {new Date(audience?.date || '').toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="typeResultat">Type de résultat *</Label>
            <Select
              value={formData.typeResultat}
              onValueChange={(value) => setFormData({ ...formData, typeResultat: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le résultat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RENVOI">Renvoi</SelectItem>
                <SelectItem value="RADIATION">Radiation</SelectItem>
                <SelectItem value="DELIBERE">Délibéré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.typeResultat === 'RENVOI' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nouvelleDate">Nouvelle date d'audience *</Label>
                <Input
                  id="nouvelleDate"
                  type="date"
                  value={formData.nouvelleDate}
                  onChange={(e) => setFormData({ ...formData, nouvelleDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motifRenvoi">Motif du renvoi</Label>
                <Textarea
                  id="motifRenvoi"
                  value={formData.motifRenvoi}
                  onChange={(e) => setFormData({ ...formData, motifRenvoi: e.target.value })}
                  placeholder="Raison du renvoi..."
                  rows={2}
                />
              </div>
            </>
          )}

          {formData.typeResultat === 'RADIATION' && (
            <div className="space-y-2">
              <Label htmlFor="motifRadiation">Motif de la radiation</Label>
              <Textarea
                id="motifRadiation"
                value={formData.motifRadiation}
                onChange={(e) => setFormData({ ...formData, motifRadiation: e.target.value })}
                placeholder="Raison de la radiation..."
                rows={2}
              />
            </div>
          )}

          {formData.typeResultat === 'DELIBERE' && (
            <div className="space-y-2">
              <Label htmlFor="texteDelibere">Texte du délibéré</Label>
              <Textarea
                id="texteDelibere"
                value={formData.texteDelibere}
                onChange={(e) => setFormData({ ...formData, texteDelibere: e.target.value })}
                placeholder="Contenu du délibéré..."
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer le résultat</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}