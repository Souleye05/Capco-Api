import React, { useState } from 'react';
import { Loader2, Users, Calendar, DollarSign } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <DialogContent className="sm:max-w-[500px] rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Assigner un locataire</DialogTitle>
          <DialogDescription className="font-medium font-display">
            Assignez un locataire au lot <span className="font-bold text-primary">{lotNumero}</span> et créez automatiquement le bail.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="h-3 w-3" />
              Locataire *
            </Label>
            <Select
              value={formData.locataireId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, locataireId: value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
                <SelectValue placeholder="Sélectionner un locataire" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {locataires.map((locataire) => (
                  <SelectItem key={locataire.id} value={locataire.id} className="font-bold">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {locataire.nom}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              Montant du loyer (FCFA)
            </Label>
            <Input
              type="number"
              placeholder="Ex: 500000"
              value={formData.montantLoyer}
              onChange={(e) => setFormData(prev => ({ ...prev, montantLoyer: e.target.value }))}
              className="h-11 rounded-xl border-border/50 font-black text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Date de début
              </Label>
              <Input
                type="date"
                value={formData.dateDebutBail}
                onChange={(e) => setFormData(prev => ({ ...prev, dateDebutBail: e.target.value }))}
                className="h-11 rounded-xl border-border/50 font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Date de fin
              </Label>
              <Input
                type="date"
                value={formData.dateFinBail}
                onChange={(e) => setFormData(prev => ({ ...prev, dateFinBail: e.target.value }))}
                className="h-11 rounded-xl border-border/50 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Jour de paiement prévu</Label>
            <Select
              value={formData.jourPaiementPrevu}
              onValueChange={(value) => setFormData(prev => ({ ...prev, jourPaiementPrevu: value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()} className="font-bold">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              disabled={assignLocataire.isPending}
              className="rounded-xl font-bold"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={assignLocataire.isPending}
              className="rounded-xl font-black px-8 bg-primary"
            >
              {assignLocataire.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assigner le locataire
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}