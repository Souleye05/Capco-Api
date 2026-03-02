import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Building2, MapPin, Percent, FileText, Edit, Loader2 } from 'lucide-react';
import { useProprietaires, useUpdateImmeuble, ImmeubleDB } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface EditImmeubleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  immeuble: ImmeubleDB & { proprietaires?: { nom: string } | null };
}

export function EditImmeubleDialog({ open, onOpenChange, immeuble }: EditImmeubleDialogProps) {
  const { data: proprietairesResult, isLoading: loadingProprietaires } = useProprietaires({ limit: 100 });
  const proprietaires = proprietairesResult?.data || [];
  const updateImmeuble = useUpdateImmeuble();

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    proprietaireId: '',
    tauxCommissionCapco: '',
    notes: ''
  });

  useEffect(() => {
    if (immeuble && open) {
      setFormData({
        nom: immeuble.nom || '',
        adresse: immeuble.adresse || '',
        proprietaireId: immeuble.proprietaireId || immeuble.proprietaire_id || '',
        tauxCommissionCapco: String(immeuble.tauxCommissionCapco || immeuble.taux_commission_capco || 5),
        notes: immeuble.notes || ''
      });
    }
  }, [immeuble, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.adresse || !formData.proprietaireId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await updateImmeuble.mutateAsync({
        id: immeuble.id,
        nom: formData.nom,
        adresse: formData.adresse,
        proprietaireId: formData.proprietaireId,
        tauxCommissionCapco: parseFloat(formData.tauxCommissionCapco) || 5,
        notes: formData.notes || null
      } as any);

      toast.success('Immeuble modifié avec succès');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating immeuble:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
        <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary/60 mb-1">
              <Edit className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Édition Unité</span>
            </div>
            <DialogTitle className="text-xl font-black tracking-tight">Modifier l'immeuble</DialogTitle>
            <DialogDescription className="text-xs font-medium opacity-60">
              Mettre à jour les paramètres de gestion de cet immeuble.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="grid gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="nom" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                Nom de l'immeuble <span className="text-primary">*</span>
              </Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Résidence Les Acacias"
                className="h-11 rounded-xl border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adresse" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                Localisation <span className="text-primary">*</span>
              </Label>
              <div className="relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Adresse précise..."
                  className="h-11 pl-10 rounded-xl border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proprietaire" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                  Propriétaire <span className="text-primary">*</span>
                </Label>
                <SearchableSelect
                  options={proprietaires.map(p => ({ label: p.nom, value: p.id }))}
                  value={formData.proprietaireId}
                  onValueChange={(value) => setFormData({ ...formData, proprietaireId: value })}
                  placeholder="Choisir le propriétaire..."
                  searchPlaceholder="Rechercher par nom..."
                  disabled={loadingProprietaires}
                  className="h-11 rounded-xl bg-muted/20 border-border/50 text-xs font-bold uppercase tracking-wider focus:ring-4 focus:ring-primary/5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tauxCommission" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                  Commission (%)
                </Label>
                <div className="relative group">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="tauxCommission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tauxCommissionCapco}
                    onChange={(e) => setFormData({ ...formData, tauxCommissionCapco: e.target.value })}
                    className="h-11 pl-10 rounded-xl border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                Observations
              </Label>
              <div className="relative group">
                <FileText className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes..."
                  rows={2}
                  className="pl-10 min-h-[80px] rounded-xl border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-muted/50 transition-all"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateImmeuble.isPending}
              className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-xs font-black uppercase tracking-widest"
            >
              {updateImmeuble.isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

