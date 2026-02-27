import React from 'react';
import { Loader2, AlertTriangle, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLibererLot } from '@/hooks/useImmobilier';

interface LibererLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotId: string;
  lotNumero: string;
  locataireNom?: string;
  onSuccess?: () => void;
}

export function LibererLotDialog({
  open,
  onOpenChange,
  lotId,
  lotNumero,
  locataireNom,
  onSuccess,
}: LibererLotDialogProps) {
  const libererLot = useLibererLot();

  const handleConfirm = async () => {
    try {
      await libererLot.mutateAsync(lotId);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Libérer le lot
          </DialogTitle>
          <DialogDescription className="font-medium font-display">
            Cette action va libérer le lot <span className="font-bold text-primary">{lotNumero}</span> et désactiver le bail actuel.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Home className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold">Lot {lotNumero}</div>
                {locataireNom && (
                  <div className="text-sm text-muted-foreground">
                    Actuellement occupé par <span className="font-medium">{locataireNom}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <div className="font-bold text-warning mb-1">Attention</div>
                <div className="text-muted-foreground">
                  Le bail actuel sera automatiquement désactivé et le statut du lot passera à "LIBRE".
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={libererLot.isPending}
            className="rounded-xl font-bold"
          >
            Annuler
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm} 
            disabled={libererLot.isPending}
            className="rounded-xl font-black px-8"
          >
            {libererLot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Libérer le lot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}