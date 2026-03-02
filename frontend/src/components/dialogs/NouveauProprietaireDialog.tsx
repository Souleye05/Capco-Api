import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProprietaire } from '@/hooks/useImmobilier';
import { toast } from 'sonner';
import { UserPlus, Phone, Mail, MapPin, Sparkles } from 'lucide-react';

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
            onSuccess: () => {
                toast.success('Propriétaire ajouté avec succès');
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <UserPlus className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Administration</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Ajouter un propriétaire</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Complétez les informations pour référencer ce partenaire.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form key={String(open)} onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="nom" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                                Nom ou Raison Sociale <span className="text-primary">*</span>
                            </Label>
                            <div className="relative group">
                                <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="nom"
                                    name="nom"
                                    placeholder="ex: Jean Dupont ou SCI Horizon"
                                    disabled={isPending}
                                    className="h-10 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="telephone" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                                    Téléphone
                                </Label>
                                <div className="relative group">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="telephone"
                                        name="telephone"
                                        placeholder="+221 ..."
                                        disabled={isPending}
                                        className="h-10 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                                    Email
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="contact@exemple.com"
                                        disabled={isPending}
                                        className="h-10 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="adresse" className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">
                                Adresse détaillée
                            </Label>
                            <div className="relative group">
                                <MapPin className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Textarea
                                    id="adresse"
                                    name="adresse"
                                    placeholder="Siège social ou domicile..."
                                    rows={2}
                                    disabled={isPending}
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
                            disabled={isPending}
                            className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-muted transition-all"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest"
                        >
                            {isPending ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            ) : "Valider"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

