import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateResultatAudience } from '@/hooks/useAudiences';

interface AudienceInfo {
  reference: string;
  intitule: string;
  date: string;
  juridiction: string;
}

interface ResultatAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audienceId?: string;
  audienceInfo?: AudienceInfo;
  mode: 'create' | 'edit';
}

export function ResultatAudienceDialog({ 
  open, 
  onOpenChange, 
  audienceId, 
  audienceInfo,
  mode 
}: ResultatAudienceDialogProps) {
  const createResultat = useCreateResultatAudience();
  
  const [formData, setFormData] = useState({
    type: 'RENVOI' as const,
    nouvelleDate: '',
    motifRenvoi: '',
    motifRadiation: '',
    texteDelibere: ''
  });

  const resetForm = () => {
    setFormData({
      type: 'RENVOI',
      nouvelleDate: '',
      motifRenvoi: '',
      motifRadiation: '',
      texteDelibere: ''
    });
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audienceId) {
      toast.error('ID d\'audience manquant');
      return;
    }

    // Validation selon le type
    if (formData.type === 'RENVOI' && !formData.nouvelleDate) {
      toast.error('La nouvelle date est obligatoire pour un renvoi');
      return;
    }

    if (formData.type === 'RADIATION' && !formData.motifRadiation) {
      toast.error('Le motif de radiation est obligatoire');
      return;
    }

    if (formData.type === 'DELIBERE' && !formData.texteDelibere) {
      toast.error('Le texte du délibéré est obligatoire');
      return;
    }

    try {
      await createResultat.mutateAsync({
        audienceId,
        data: {
          type: formData.type,
          nouvelleDate: formData.nouvelleDate || undefined,
          motifRenvoi: formData.motifRenvoi || undefined,
          motifRadiation: formData.motifRadiation || undefined,
          texteDelibere: formData.texteDelibere || undefined,
        }
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  if (!audienceInfo) return null;

  const audienceDate = new Date(audienceInfo.date);
  const formattedDate = audienceDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Saisir le résultat de l'audience</DialogTitle>
          <DialogDescription>
            Enregistrer le résultat de l'audience pour régulariser le dossier
          </DialogDescription>
        </DialogHeader>

        {/* Informations de l'audience */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Informations de l'audience</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p><span className="font-medium">Affaire :</span> {audienceInfo.reference}</p>
            <p><span className="font-medium">Date :</span> {formattedDate}</p>
            <p className="sm:col-span-2"><span className="font-medium">Intitulé :</span> {audienceInfo.intitule}</p>
            <p className="sm:col-span-2"><span className="font-medium">Juridiction :</span> {audienceInfo.juridiction}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de résultat */}
          <div className="space-y-2">
            <Label htmlFor="type">Type de résultat *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type de résultat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RENVOI">Renvoi</SelectItem>
                <SelectItem value="RADIATION">Radiation</SelectItem>
                <SelectItem value="DELIBERE">Délibéré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Champs conditionnels selon le type */}
          {formData.type === 'RENVOI' && (
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
                  placeholder="Préciser le motif du renvoi..."
                  rows={3}
                />
              </div>
            </>
          )}

          {formData.type === 'RADIATION' && (
            <div className="space-y-2">
              <Label htmlFor="motifRadiation">Motif de radiation *</Label>
              <Textarea
                id="motifRadiation"
                value={formData.motifRadiation}
                onChange={(e) => setFormData({ ...formData, motifRadiation: e.target.value })}
                placeholder="Préciser le motif de radiation..."
                rows={3}
              />
            </div>
          )}

          {formData.type === 'DELIBERE' && (
            <div className="space-y-2">
              <Label htmlFor="texteDelibere">Texte du délibéré *</Label>
              <Textarea
                id="texteDelibere"
                value={formData.texteDelibere}
                onChange={(e) => setFormData({ ...formData, texteDelibere: e.target.value })}
                placeholder="Saisir le texte du délibéré..."
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createResultat.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createResultat.isPending}
            >
              {createResultat.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer le résultat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}