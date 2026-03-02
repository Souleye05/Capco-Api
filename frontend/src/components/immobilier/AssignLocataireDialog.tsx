import React, { useState } from 'react';
import { Loader2, Users, Calendar, DollarSign, Building2, Hash, CreditCard, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAssignLocataireToLot } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface AssignLocataireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotId: string;
  lotNumero: string;
  locataires: Array<{ id: string; nom: string }>;
  onSuccess?: () => void;
}

export function AssignLocataireDialog({
  open,
  onOpenChange,
  lotId,
  lotNumero,
  locataires,
  onSuccess,
}: AssignLocataireDialogProps) {
  const assignLocataire = useAssignLocataireToLot();
  const [formData, setFormData] = useState({
    locataireId: '',
    montantLoyer: '',
    dateDebutBail: '',
    dateFinBail: '',
    jourPaiementPrevu: '5',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.locataireId) {
      toast.error('Veuillez sélectionner un locataire');
      return;
    }

    try {
      const payload = {
        locataireId: formData.locataireId,
        ...(formData.montantLoyer && { montantLoyer: parseFloat(formData.montantLoyer) }),
        ...(formData.dateDebutBail && { dateDebutBail: formData.dateDebutBail }),
        ...(formData.dateFinBail && { dateFinBail: formData.dateFinBail }),
        ...(formData.jourPaiementPrevu && { jourPaiementPrevu: parseInt(formData.jourPaiementPrevu) }),
      };

      await assignLocataire.mutateAsync({ lotId, data: payload });

      onOpenChange(false);
      onSuccess?.();
      toast.success('Locataire assigné avec succès');

      // Reset form
      setFormData({
        locataireId: '',
        montantLoyer: '',
        dateDebutBail: '',
        dateFinBail: '',
        jourPaiementPrevu: '5',
      });
    } catch (error) {
      // Error handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
        <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary/60 mb-1">
              <UserPlus className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Affectation</span>
            </div>
            <DialogTitle className="text-xl font-black tracking-tight text-foreground">Assigner un locataire</DialogTitle>
            <DialogDescription className="text-xs font-medium opacity-60">
              Assignez un locataire au lot <span className="font-bold text-primary">{lotNumero}</span> et créez automatiquement le bail.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Locataire titulaire <span className="text-primary">*</span></Label>
            <div className="relative group">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
              <SearchableSelect
                options={locataires.map(loc => ({ label: loc.nom, value: loc.id }))}
                value={formData.locataireId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, locataireId: value }))}
                placeholder="Rechercher un locataire..."
                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Loyer mensuel (FCFA)</Label>
            <div className="relative group">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="number"
                placeholder="Ex: 500000"
                value={formData.montantLoyer}
                onChange={(e) => setFormData(prev => ({ ...prev, montantLoyer: e.target.value }))}
                className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all font-black text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date d'entrée</Label>
              <div className="relative group">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="date"
                  value={formData.dateDebutBail}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateDebutBail: e.target.value }))}
                  className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date de sortie</Label>
              <div className="relative group">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="date"
                  value={formData.dateFinBail}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateFinBail: e.target.value }))}
                  className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Jour de paiement (échéance)</Label>
            <div className="relative group">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
              <SearchableSelect
                value={formData.jourPaiementPrevu}
                onValueChange={(value) => setFormData(prev => ({ ...prev, jourPaiementPrevu: value }))}
                options={Array.from({ length: 28 }, (_, i) => ({ label: (i + 1).toString(), value: (i + 1).toString() }))}
                placeholder="Choisir un jour..."
                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
              />
            </div>
          </div>

          <div className="p-0 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={assignLocataire.isPending}
              className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={assignLocataire.isPending}
              className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest"
            >
              {assignLocataire.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Assigner'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}