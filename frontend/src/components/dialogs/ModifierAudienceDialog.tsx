import { useState, useEffect } from 'react';
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
import { useUpdateAudience } from '@/hooks/useAudiences';
import { useJuridictionsActives } from '@/hooks/useJuridictions';
import { isWeekend, getDayName, getWeekendAlternatives } from '@/lib/date-validation';

interface AudienceData {
  id: string;
  affaireId: string;
  date: string;
  heure?: string;
  type: string;
  juridiction: string;
  chambre?: string;
  ville?: string;
  statut: string;
  notesPreparation?: string;
  estPreparee: boolean;
  rappelEnrolement: boolean;
}

interface ModifierAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: AudienceData | null;
}

export function ModifierAudienceDialog({ open, onOpenChange, audience }: ModifierAudienceDialogProps) {
  const { data: affairesResponse, isLoading: affairesLoading } = useAffaires();
  const { data: juridictions = [], isLoading: juridictionsLoading } = useJuridictionsActives();
  
  const affaires = affairesResponse?.data || [];
  const updateAudience = useUpdateAudience();
  
  const [formData, setFormData] = useState({
    affaireId: '',
    date: '',
    heure: '',
    type: 'MISE_EN_ETAT' as const,
    juridiction: '',
    chambre: '',
    ville: '',
    statut: 'A_VENIR' as const,
    notesPreparation: '',
    estPreparee: false,
    rappelEnrolement: false,
  });

  const [showWeekendWarning, setShowWeekendWarning] = useState(false);
  const [weekendAlternatives, setWeekendAlternatives] = useState<any>(null);

  // Initialiser le formulaire avec les données de l'audience
  useEffect(() => {
    if (audience && open) {
      const audienceDate = new Date(audience.date);
      const formattedDate = audienceDate.toISOString().split('T')[0];
      
      setFormData({
        affaireId: audience.affaireId,
        date: formattedDate,
        heure: audience.heure || '',
        type: audience.type as any,
        juridiction: audience.juridiction,
        chambre: audience.chambre || '',
        ville: audience.ville || '',
        statut: audience.statut as any,
        notesPreparation: audience.notesPreparation || '',
        estPreparee: audience.estPreparee,
        rappelEnrolement: audience.rappelEnrolement,
      });

      // Vérifier si la date actuelle est un week-end
      if (isWeekend(formattedDate)) {
        setShowWeekendWarning(true);
        setWeekendAlternatives(getWeekendAlternatives(formattedDate));
      } else {
        setShowWeekendWarning(false);
        setWeekendAlternatives(null);
      }
    }
  }, [audience, open]);

  const resetForm = () => {
    setFormData({
      affaireId: '',
      date: '',
      heure: '',
      type: 'MISE_EN_ETAT',
      juridiction: '',
      chambre: '',
      ville: '',
      statut: 'A_VENIR',
      notesPreparation: '',
      estPreparee: false,
      rappelEnrolement: false,
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
    
    if (!audience || !formData.affaireId || !formData.date || !formData.juridiction) {
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
      await updateAudience.mutateAsync({
        id: audience.id,
        data: {
          affaireId: formData.affaireId,
          date: formData.date,
          heure: formData.heure || undefined,
          type: formData.type,
          juridiction: formData.juridiction,
          chambre: formData.chambre || undefined,
          ville: formData.ville || undefined,
          statut: formData.statut,
          notesPreparation: formData.notesPreparation || undefined,
          estPreparee: formData.estPreparee,
          rappelEnrolement: formData.rappelEnrolement,
        }
      });

      onOpenChange(false);
      resetForm();
      toast.success('Audience modifiée avec succès');
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  if (!audience) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier l'audience</DialogTitle>
          <DialogDescription>
            Modifier les informations de l'audience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Affaire */}
          <div className="space-y-2">
            <Label htmlFor="affaire">Affaire *</Label>
            <Select
              value={formData.affaireId}
              onValueChange={(value) => setFormData({ ...formData, affaireId: value })}
              disabled={affairesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={affairesLoading ? "Chargement..." : "Sélectionner une affaire"} />
              </SelectTrigger>
              <SelectContent>
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

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="statut">Statut</Label>
            <Select
              value={formData.statut}
              onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A_VENIR">À venir</SelectItem>
                <SelectItem value="PASSEE_NON_RENSEIGNEE">Passée non renseignée</SelectItem>
                <SelectItem value="RENSEIGNEE">Renseignée</SelectItem>
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
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {formData.date && new Date(formData.date) < new Date() && (
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Date passée : le statut sera automatiquement défini sur "Passée non renseignée"
                </p>
              )}
              
              {/* Alerte week-end */}
              {showWeekendWarning && weekendAlternatives && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <p className="font-medium">
                        ❌ Cette date correspond à un {getDayName(formData.date)}
                      </p>
                      <p className="text-sm">
                        Les audiences ne peuvent pas être programmées le week-end. Veuillez choisir une date alternative :
                      </p>
                      <div className="flex flex-col gap-2 mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2"
                          onClick={() => handleAlternativeDateSelect(weekendAlternatives.previousFriday.isoString)}
                        >
                          <Calendar className="h-3 w-3 mr-2" />
                          <div>
                            <div className="font-medium">Vendredi précédent</div>
                            <div className="text-xs text-muted-foreground">
                              {weekendAlternatives.previousFriday.formatted}
                            </div>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-2"
                          onClick={() => handleAlternativeDateSelect(weekendAlternatives.nextMonday.isoString)}
                        >
                          <Calendar className="h-3 w-3 mr-2" />
                          <div>
                            <div className="font-medium">Lundi suivant</div>
                            <div className="text-xs text-muted-foreground">
                              {weekendAlternatives.nextMonday.formatted}
                            </div>
                          </div>
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
              placeholder="Points à préparer, documents à apporter, stratégie..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={updateAudience.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={updateAudience.isPending || affairesLoading || juridictionsLoading || showWeekendWarning}
            >
              {updateAudience.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Modifier l'audience
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}