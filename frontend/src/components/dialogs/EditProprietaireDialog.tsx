import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProprietaire, Proprietaire } from '@/hooks/useImmobilier';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditProprietaireDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proprietaire: Proprietaire;
}

export function EditProprietaireDialog({ open, onOpenChange, proprietaire }: EditProprietaireDialogProps) {
    const updateProprietaire = useUpdateProprietaire();

    const [formData, setFormData] = useState({
        nom: '',
        telephone: '',
        email: '',
        adresse: ''
    });

    useEffect(() => {
        if (proprietaire && open) {
            setFormData({
                nom: proprietaire.nom || '',
                telephone: proprietaire.telephone || '',
                email: proprietaire.email || '',
                adresse: proprietaire.adresse || ''
            });
        }
    }, [proprietaire, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nom) {
            toast.error('Le nom est obligatoire');
            return;
        }

        try {
            await updateProprietaire.mutateAsync({
                id: proprietaire.id,
                nom: formData.nom,
                telephone: formData.telephone,
                email: formData.email,
                adresse: formData.adresse,
            });

            onOpenChange(false);
        } catch (error) {
            console.error('Error updating proprietaire:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Modifier le propriétaire</DialogTitle>
                    <DialogDescription>
                        Modifier les informations du propriétaire
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nom">Nom ou Raison Sociale *</Label>
                        <Input
                            id="nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            placeholder="Nom complet ou raison sociale"
                            disabled={updateProprietaire.isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                            id="telephone"
                            value={formData.telephone}
                            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            placeholder="Numéro de téléphone"
                            disabled={updateProprietaire.isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Adresse email"
                            disabled={updateProprietaire.isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="adresse">Adresse</Label>
                        <Textarea
                            id="adresse"
                            value={formData.adresse}
                            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                            placeholder="Adresse complète"
                            rows={3}
                            disabled={updateProprietaire.isPending}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateProprietaire.isPending}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={updateProprietaire.isPending}>
                            {updateProprietaire.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
