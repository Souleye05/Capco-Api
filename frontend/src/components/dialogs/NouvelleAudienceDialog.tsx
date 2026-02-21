import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAffaires } from '@/hooks/useAffaires';
import { useCreateAudience } from '@/hooks/useAudiences';
import { useJuridictionsActives } from '@/hooks/useJuridictions';
import { isWeekend, getDayName, getWeekendAlternatives, formatDateWithDay } from '@/lib/date-validation';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NouvelleAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAffaireId?: string;
}

export function NouvelleAudienceDialog({ open, onOpenChange, preselectedAffaireId }: NouvelleAudienceDialogProps) {
  const { data: affairesResponse, isLoading: affairesLoading } = useAffaires();
  const { data: juridictions = [], isLoading: juridictionsLoading } = useJuridictionsActives();

  const affaires = affairesResponse?.data || [];
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

  const [showWeekendWarning, setShowWeekendWarning] = useState(false);
  const [weekendAlternatives, setWeekendAlternatives] = useState<any>(null);

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
    setShowWeekendWarning(false);
    setWeekendAlternatives(null);
  };

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date });

    if (date && isWeekend(date)) {
      setShowWeekendWarning(true);
      setWeekendAlternatives(getWeekendAlternatives(date));
    } else {
      setShowWeekendWarning(false);
      setWeekendAlternatives(null);
    }
  };

  const handleAlternativeDateSelect = (alternativeDate: string) => {
    setFormData({ ...formData, date: alternativeDate });
    setShowWeekendWarning(false);
    setWeekendAlternatives(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.affaireId || !formData.date || !formData.juridiction) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérification finale du week-end - le backend bloquera maintenant
    if (isWeekend(formData.date)) {
      const dayName = getDayName(formData.date);
      toast.error(`Impossible de programmer une audience un ${dayName}. Veuillez choisir un jour ouvrable.`);
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

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[65vh] pr-4 py-4">
            <div className="space-y-4">
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
                    {createAudience.isPending && (
                      <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                    {affaires
                      .filter(a => a.statut === 'ACTIVE')
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                  {formData.date && new Date(formData.date) < new Date() && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                      ⚠️ Date passée : le statut sera automatique.
                    </p>
                  )}

                  {/* Alerte week-end - compact version already in file from previous tool call */}
                  {/* I will re-include the compact version here as I'm replacing the whole block */}
                  {showWeekendWarning && weekendAlternatives && (
                    <Alert className="border-red-200 bg-red-50 mt-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <div className="space-y-2">
                          <p className="font-medium text-xs">
                            ❌ Week-end ({getDayName(formData.date)})
                          </p>
                          <div className="flex flex-col gap-1.5 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="justify-start text-left h-auto py-1 px-2 border-red-200 bg-white"
                              onClick={() => handleAlternativeDateSelect(weekendAlternatives.previousFriday.isoString)}
                            >
                              <Calendar className="h-3 w-3 mr-2" />
                              <span className="text-[10px]">Ven. {weekendAlternatives.previousFriday.formatted}</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="justify-start text-left h-auto py-1 px-2 border-red-200 bg-white"
                              onClick={() => handleAlternativeDateSelect(weekendAlternatives.nextMonday.isoString)}
                            >
                              <Calendar className="h-3 w-3 mr-2" />
                              <span className="text-[10px]">Lun. {weekendAlternatives.nextMonday.formatted}</span>
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
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
                  disabled={juridictionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={juridictionsLoading ? "Chargement..." : "Sélectionner la juridiction"} />
                  </SelectTrigger>
                  <SelectContent>
                    {juridictions.map((juridiction) => (
                      <SelectItem key={juridiction.id} value={juridiction.nom}>
                        {juridiction.nom}
                      </SelectItem>
                    ))}
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
                  placeholder="Points à préparer..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t">
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
              disabled={createAudience.isPending || affairesLoading || juridictionsLoading || showWeekendWarning}
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