import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Calendar, Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { useAffaires } from '@/hooks/useAffaires';
import { useCreateAudience } from '@/hooks/useAudiences';
import { useJuridictionsActives } from '@/hooks/useJuridictions';
import { isWeekend, getDayName, getWeekendAlternatives } from '@/lib/date-validation';
import { parseDateString, getStartOfDay, isBefore } from '@/lib/date-utils';
import { LIST_CHAMBRES } from '@/lib/constants';
import { AffaireSelector } from '@/components/contentieux/AffaireSelector';

// Types d'audience alignés avec le backend (TypeAudience enum)
const TYPES_AUDIENCE = [
  { value: 'MISE_EN_ETAT', label: 'Mise en état' },
  { value: 'PLAIDOIRIE', label: 'Plaidoirie' },
  { value: 'REFERE', label: 'Référé' },
  { value: 'EVOCATION', label: 'Évocation' },
  { value: 'CONCILIATION', label: 'Conciliation' },
  { value: 'MEDIATION', label: 'Médiation' },
  { value: 'AUTRE', label: 'Autre' },
] as const;

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
    type: 'MISE_EN_ETAT' as string,
    juridiction: '',
    chambre: '',
    ville: '',
    notesPreparation: ''
  });

  const [showWeekendWarning, setShowWeekendWarning] = useState(false);
  const [weekendAlternatives, setWeekendAlternatives] = useState<any>(null);

  useEffect(() => {
    if (open && preselectedAffaireId) {
      setFormData(prev => ({ ...prev, affaireId: preselectedAffaireId }));
    }
  }, [open, preselectedAffaireId]);

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
        type: formData.type as any,
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Nouvelle audience</DialogTitle>
              <DialogDescription className="text-xs">
                Programmer une nouvelle audience pour une affaire
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* ── Affaire ── */}
            <div className="space-y-1.5">
              <Label htmlFor="affaire" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Affaire <span className="text-destructive">*</span>
              </Label>
              <AffaireSelector
                affaires={affaires}
                value={formData.affaireId}
                onValueChange={(v) => updateField('affaireId', v)}
                disabled={!!preselectedAffaireId || affairesLoading}
                isLoading={affairesLoading}
              />
            </div>

            {/* ── Type d'audience ── */}
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Type d'audience <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(v) => updateField('type', v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_AUDIENCE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Date et Heure ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  className="h-10"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
                {formData.date && (() => {
                  const selectedDate = parseDateString(formData.date);
                  const today = getStartOfDay(new Date());
                  return isBefore(selectedDate, today);
                })() && !showWeekendWarning && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                      ⚠️ Date passée : le statut sera automatique.
                    </p>
                  )}

                {showWeekendWarning && weekendAlternatives && (
                  <Alert className="border-red-200 bg-red-50 py-2 px-3">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <p className="font-medium text-[11px] mb-1.5">
                        ❌ Week-end ({getDayName(formData.date)})
                      </p>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px] border-red-200 bg-white"
                          onClick={() => handleAlternativeDateSelect(weekendAlternatives.previousFriday.isoString)}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Ven. {weekendAlternatives.previousFriday.formatted}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px] border-red-200 bg-white"
                          onClick={() => handleAlternativeDateSelect(weekendAlternatives.nextMonday.isoString)}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Lun. {weekendAlternatives.nextMonday.formatted}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heure" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Heure
                </Label>
                <Input
                  id="heure"
                  type="time"
                  className="h-10"
                  value={formData.heure}
                  onChange={(e) => updateField('heure', e.target.value)}
                />
              </div>
            </div>

            {/* ── Juridiction ── */}
            <div className="space-y-1.5">
              <Label htmlFor="juridiction" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Juridiction <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.juridiction}
                onValueChange={(v) => updateField('juridiction', v)}
                disabled={juridictionsLoading}
              >
                <SelectTrigger className="h-10">
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

            {/* ── Chambre et Ville ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="chambre" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Chambre
                </Label>
                <Select
                  value={formData.chambre}
                  onValueChange={(v) => updateField('chambre', v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Sélectionner la chambre" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIST_CHAMBRES.map((chambre) => (
                      <SelectItem key={chambre} value={chambre}>
                        {chambre}
                      </SelectItem>
                    ))}
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ville" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ville
                </Label>
                <Input
                  id="ville"
                  className="h-10"
                  value={formData.ville}
                  onChange={(e) => updateField('ville', e.target.value)}
                  placeholder="Ex: Dakar"
                />
              </div>
            </div>

            {/* ── Notes de préparation ── */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes de préparation
              </Label>
              <Textarea
                id="notes"
                value={formData.notesPreparation}
                onChange={(e) => updateField('notesPreparation', e.target.value)}
                placeholder="Points à préparer, observations..."
                className="min-h-[70px] max-h-[120px] resize-y"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
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
              className="bg-primary hover:bg-primary/90"
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