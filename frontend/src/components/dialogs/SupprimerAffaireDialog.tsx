import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Gavel } from 'lucide-react';
import { useDeleteAffaire } from '@/hooks/useAffaires';

interface AffaireData {
    id: string;
    reference: string;
    intitule: string;
}

interface SupprimerAffaireDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    affaire: AffaireData | null;
}

export function SupprimerAffaireDialog({ open, onOpenChange, affaire }: SupprimerAffaireDialogProps) {
    const deleteAffaire = useDeleteAffaire();

    const handleDelete = async () => {
        if (!affaire) return;

        try {
            await deleteAffaire.mutateAsync(affaire.id);
            onOpenChange(false);
        } catch (error) {
            // L'erreur est déjà gérée par le hook
        }
    };

    if (!affaire) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Supprimer l'affaire
                    </DialogTitle>
                    <DialogDescription>
                        Cette action est irréversible. Toutes les données liées à cette affaire (audiences, honoraires, dépenses) seront définitivement supprimées.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                            <Gavel className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-destructive">Affaire à supprimer :</h4>
                            <p className="text-sm font-semibold text-foreground">{affaire.reference}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{affaire.intitule}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleteAffaire.isPending}
                        className="flex-1 sm:flex-none"
                    >
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteAffaire.isPending}
                        className="flex-1 sm:flex-none gap-2"
                    >
                        {deleteAffaire.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <AlertTriangle className="h-4 w-4" />
                        )}
                        Confirmer la suppression
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
