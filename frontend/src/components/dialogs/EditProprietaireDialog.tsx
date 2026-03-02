import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProprietaire, Proprietaire } from '@/hooks/useImmobilier';
import { toast } from 'sonner';
import { Edit3, Phone, Mail, MapPin, Sparkles, Loader2 } from 'lucide-react';

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

            toast.success('Informations mises à jour');
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating proprietaire:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <Edit3 className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Édition Profil</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Modifier le propriétaire</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Mettez à jour les coordonnées de ce partenaire.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                    <div className="grid gap-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="nom" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                Nom ou Raison Sociale <span className="text-primary">*</span>
                            </Label>
                            <Input
                                id="nom"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                placeholder="Nom complet ou raison sociale"
                                disabled={updateProprietaire.isPending}
                                className="h-11 rounded-xl border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="telephone" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                    Téléphone
                                </Label>
                                <div className="relative group">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="telephone"
                                        value={formData.telephone}
                                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                        placeholder="+221 ..."
                                        disabled={updateProprietaire.isPending}
                                        className="h-11 pl-10 rounded-xl border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                    Email
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@exemple.com"
                                        disabled={updateProprietaire.isPending}
                                        className="h-11 pl-10 rounded-xl border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="adresse" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">
                                Adresse complète
                            </Label>
                            <div className="relative group">
                                <MapPin className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Textarea
                                    id="adresse"
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                    placeholder="Adresse complète"
                                    rows={2}
                                    disabled={updateProprietaire.isPending}
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
                            disabled={updateProprietaire.isPending}
                            className="rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-muted/50"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateProprietaire.isPending}
                            className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-xs font-black uppercase tracking-widest"
                        >
                            {updateProprietaire.isPending ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            ) : "Mettre à jour"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

