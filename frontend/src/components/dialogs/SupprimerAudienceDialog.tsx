import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useDeleteAudience } from '@/hooks/useAudiences';

interface AudienceData {
  id: string;
  date: string;
  juridiction: string;
  affaire?: {
    reference: string;
    intitule: string;
  };
}

interface SupprimerAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: AudienceData | null;
}

export function SupprimerAudienceDialog({ open, onOpenChange, audience }: SupprimerAudienceDialogProps) {
  const deleteAudience = useDeleteAudience();

  const handleDelete = async () => {
    if (!audience) return;

    try {
      await deleteAudience.mutateAsync(audience.id);
      onOpenChange(false);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  if (!audience) return null;

  const audienceDate = new Date(audience.date);
  const formattedDate = audienceDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Supprimer l'audience
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. L'audience sera définitivement supprimée.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Audience à supprimer :</h4>
            <div className="space-y-1 text-sm text-red-800">
              <p><span className="font-medium">Affaire :</span> {audience.affaire?.reference} - {audience.affaire?.intitule}</p>
              <p><span className="font-medium">Date :</span> {formattedDate}</p>
              <p><span className="font-medium">Juridiction :</span> {audience.juridiction}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={deleteAudience.isPending}
          >
            Annuler
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteAudience.isPending}
          >
            {deleteAudience.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}