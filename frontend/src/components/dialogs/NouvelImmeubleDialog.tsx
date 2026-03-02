import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCreateImmeuble, useProprietaires } from '@/hooks/useImmobilier';
import { toast } from 'sonner';
import { Building2, MapPin, Percent, User, FileText } from 'lucide-react';

interface NouvelImmeubleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouvelImmeubleDialog({ open, onOpenChange }: NouvelImmeubleDialogProps) {
  const { data: proprietairesResult, isLoading: isLoadingProprietaires } = useProprietaires({ limit: 100 });
  const proprietaires = proprietairesResult?.data || [];
  const createImmeuble = useCreateImmeuble();

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    proprietaireId: '',
    tauxCommission: '10',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.adresse || !formData.proprietaireId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    createImmeuble.mutate(
      {
        nom: formData.nom,
        adresse: formData.adresse,
        proprietaireId: formData.proprietaireId,
        tauxCommissionCapco: Number(formData.tauxCommission),
        notes: formData.notes
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({ nom: '', adresse: '', proprietaireId: '', tauxCommission: '10', notes: '' });
          toast.success('Immeuble créé avec succès');
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
        <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary/60 mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Patrimoine</span>
            </div>
            <DialogTitle className="text-xl font-black tracking-tight">Nouvel immeuble</DialogTitle>
            <DialogDescription className="text-xs font-medium opacity-60">
              Référencer une nouvelle unité dans le parc immobilier.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nom" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                Nom de l'immeuble <span className="text-primary">*</span>
              </Label>
              <div className="relative group">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Résidence Les Acacias"
                  disabled={createImmeuble.isPending}
                  className="h-10 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adresse" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                Localisation <span className="text-primary">*</span>
              </Label>
              <div className="relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Adresse précise..."
                  disabled={createImmeuble.isPending}
                  className="h-10 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proprietaire" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                  Propriétaire <span className="text-primary">*</span>
                </Label>
                <SearchableSelect
                  id="proprietaire"
                  options={proprietaires.map(p => ({ label: p.nom, value: p.id }))}
                  value={formData.proprietaireId}
                  onValueChange={(value) => setFormData({ ...formData, proprietaireId: value })}
                  placeholder="Choisir le propriétaire..."
                  searchPlaceholder="Rechercher par nom..."
                  disabled={isLoadingProprietaires || createImmeuble.isPending}
                  className="h-10 rounded-xl bg-muted/20 border-border/40 text-xs font-bold uppercase tracking-wider focus:ring-4 focus:ring-primary/5"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tauxCommission" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                  Commission (%)
                </Label>
                <div className="relative group">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="tauxCommission"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tauxCommission}
                    onChange={(e) => setFormData({ ...formData, tauxCommission: e.target.value })}
                    disabled={createImmeuble.isPending}
                    className="h-10 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                Observations
              </Label>
              <div className="relative group">
                <FileText className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes internes..."
                  rows={2}
                  disabled={createImmeuble.isPending}
                  className="pl-10 min-h-[80px] rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium resize-none shadow-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={createImmeuble.isPending}
              className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-muted transition-all"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createImmeuble.isPending}
              className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest"
            >
              {createImmeuble.isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : "Valider"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}