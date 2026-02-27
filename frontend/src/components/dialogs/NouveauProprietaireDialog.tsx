import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProprietaire } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface NouveauProprietaireDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NouveauProprietaireDialog({ open, onOpenChange }: NouveauProprietaireDialogProps) {
    const { mutate, isPending } = useCreateProprietaire();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const nom = data.get('nom') as string;

        if (!nom?.trim()) {
            toast.error('Le nom est obligatoire');
            return;
        }

        mutate({
            nom: nom.trim(),
            telephone: data.get('telephone') as string,
            email: data.get('email') as string,
            adresse: data.get('adresse') as string,
        }, {
            onSuccess: () => onOpenChange(false)
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nouveau propriétaire</DialogTitle>
                    <DialogDescription>Ajouter un nouveau propriétaire</DialogDescription>
                </DialogHeader>

                {/* Le key={String(open)} force la réinitialisation du DOM du formulaire à chaque ouverture */}
                <form key={String(open)} onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nom">Nom ou Raison Sociale *</Label>
                        <Input id="nom" name="nom" placeholder="Nom complet ou raison sociale" disabled={isPending} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input id="telephone" name="telephone" placeholder="Numéro de téléphone" disabled={isPending} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="Adresse email" disabled={isPending} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adresse">Adresse</Label>
                        <Textarea id="adresse" name="adresse" placeholder="Adresse complète" rows={3} disabled={isPending} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Création...' : "Créer le propriétaire"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
