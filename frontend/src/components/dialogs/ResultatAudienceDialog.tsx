import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateResultatAudience, useUpdateResultatAudience, useResultatAudience } from '@/hooks/useResultatsAudiences';
import type { TypeResultatAudience } from '@/types/api';

interface ResultatAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audienceId: string | undefined;
  audienceInfo?: {
    reference: string;
    intitule: string;
    date: string;
    juridiction: string;
  };
  mode?: 'create' | 'edit';
}

export function ResultatAudienceDialog({ 
  open, 
  onOpenChange, 
  audienceId, 
  audienceInfo,
  mode = 'create' 
}: ResultatAudienceDialogProps) {
  // Safety check: don't render if audienceId is invalid
  if (!audienceId) {
    return null;
  }

  const { data: existingResultat, isLoading: loadingResultat } = useResultatAudience(mode === 'edit' ? audienceId : undefined);
  const createResultat = useCreateResultatAudience();
  const updateResultat = useUpdateResultatAudience();
  
  const [formData, setFormData] = useState({
    type: '' as TypeResultatAudience | '',
    nouvelleDate: '',
    motifRenvoi: '',
    motifRadiation: '',
    texteDelibere: ''
  });

  // Charger les données existantes en mode édition
  useEffect(() => {
    if (mode === 'edit' && existingResultat) {
      setFormData({
        type: existingResultat.type,
        nouvelleDate: existingResultat.nouvelleDate ? existingResultat.nouvelleDate.split('T')[0] : '',
        motifRenvoi: existingResultat.motifRenvoi || '',
        motifRadiation: existingResultat.motifRadiation || '',
        texteDelibere: existingResultat.texteDelibere || ''
      });
    }
  }, [mode, existingResultat]);

  const resetForm = () => {
    setFormData({
      type: '',
      nouvelleDate: '',
      motifRenvoi: '',
      motifRadiation: '',
      texteDelibere: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type) {
      toast.error('Veuillez sélectionner un type de résultat');
      return;
    }

    // Validation selon le type
    if (formData.type === 'RENVOI' && !formData.nouvelleDate) {
      toast.error('Veuillez indiquer la nouvelle date pour un renvoi');
      return;
    }

    if (formData.type === 'RENVOI' && !formData.motifRenvoi) {
      toast.error('Veuillez indiquer le motif du renvoi');
      return;
    }

    if (formData.type === 'RADIATION' && !formData.motifRadiation) {
      toast.error('Veuillez indiquer le motif de la radiation');
      return;
    }

    if (formData.type === 'DELIBERE' && !formData.texteDelibere) {
      toast.error('Veuillez saisir le texte du délibéré');
      return;
    }

    try {
      const data = {
        type: formData.type,
        ...(formData.nouvelleDate && { nouvelleDate: formData.nouvelleDate }),
        ...(formData.motifRenvoi && { motifRenvoi: formData.motifRenvoi }),
        ...(formData.motifRadiation && { motifRadiation: formData.motifRadiation }),
        ...(formData.texteDelibere && { texteDelibere: formData.texteDelibere }),
      };

      if (mode === 'create') {
        await createResultat.mutateAsync({ audienceId, data });
      } else {
        await updateResultat.mutateAsync({ audienceId, data });
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const isLoading = createResultat.isPending || updateResultat.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Enregistrer le résultat' : 'Modifier le résultat'}
          </DialogTitle>
          <DialogDescription>
            Saisissez les informations du résultat d'audience.
          </DialogDescription>
          {audienceInfo && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div><strong>Affaire :</strong> {audienceInfo.reference} - {audienceInfo.intitule}</div>
                <div><strong>Date :</strong> {new Date(audienceInfo.date).toLocaleDateString('fr-FR')}</div>
                <div><strong>Juridiction :</strong> {audienceInfo.juridiction}</div>
              </div>
            </div>
          )}
        </DialogHeader>

        {loadingResultat && mode === 'edit' ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Type de résultat */}
            <div className="space-y-2">
              <Label htmlFor="type">Type de résultat *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TypeResultatAudience) => {
                  setFormData({ 
                    ...formData, 
                    type: value,
                    // Reset des champs selon le type
                    nouvelleDate: value === 'RENVOI' ? formData.nouvelleDate : '',
                    motifRenvoi: value === 'RENVOI' ? formData.motifRenvoi : '',
                    motifRadiation: value === 'RADIATION' ? formData.motifRadiation : '',
                    texteDelibere: value === 'DELIBERE' ? formData.texteDelibere : ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type de résultat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RENVOI">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Renvoi à une date ultérieure
                    </div>
                  </SelectItem>
                  <SelectItem value="RADIATION">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Radiation
                    </div>
                  </SelectItem>
                  <SelectItem value="DELIBERE">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Délibéré
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champs conditionnels selon le type */}
            {formData.type === 'RENVOI' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nouvelleDate">Nouvelle date *</Label>
                  <Input
                    id="nouvelleDate"
                    type="date"
                    value={formData.nouvelleDate}
                    onChange={(e) => setFormData({ ...formData, nouvelleDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motifRenvoi">Motif du renvoi *</Label>
                  <Textarea
                    id="motifRenvoi"
                    value={formData.motifRenvoi}
                    onChange={(e) => setFormData({ ...formData, motifRenvoi: e.target.value })}
                    placeholder="Indiquez le motif du renvoi..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {formData.type === 'RADIATION' && (
              <div className="space-y-2">
                <Label htmlFor="motifRadiation">Motif de la radiation *</Label>
                <Textarea
                  id="motifRadiation"
                  value={formData.motifRadiation}
                  onChange={(e) => setFormData({ ...formData, motifRadiation: e.target.value })}
                  placeholder="Indiquez le motif de la radiation..."
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
                  placeholder="Saisissez le texte du délibéré..."
                  rows={5}
                />
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === 'create' ? 'Enregistrer' : 'Mettre à jour'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}