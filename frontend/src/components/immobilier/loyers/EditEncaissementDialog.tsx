import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, CreditCard, Calendar, Wallet, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';

interface EditEncaissementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    encaissement: any;
    onUpdate: (id: string, data: any) => Promise<any>;
}

export function EditEncaissementDialog({ open, onOpenChange, encaissement, onUpdate }: EditEncaissementDialogProps) {
    const [mois, setMois] = useState('');
    const [montant, setMontant] = useState('');
    const [mode, setMode] = useState('');
    const [observation, setObservation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && encaissement) {
            setMois(encaissement.moisConcerne || '');
            setMontant(encaissement.montantEncaisse?.toString() || '');
            setMode(encaissement.modePaiement || 'VIREMENT');
            setObservation(encaissement.observation || '');
        }
    }, [open, encaissement]);

    const handleSubmit = async () => {
        if (!mois || !montant) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const amount = parseFloat(montant);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Montant invalide');
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(encaissement.id, {
                moisConcerne: mois,
                montantEncaisse: amount,
                modePaiement: mode,
                observation: observation
            });
            onOpenChange(false);
            toast.success('Paiement mis à jour avec succès');
        } catch (error) {
            // Error is handled by the hook/toast
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!encaissement) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <Wallet className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Finances</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight">Modifier l'encaissement</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60 italic">
                            {encaissement.immeubleNom} - Lot {encaissement.lotNumero}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Période (Mois)</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                                <Input
                                    type="month"
                                    value={mois}
                                    onChange={(e) => setMois(e.target.value)}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Mode de paiement</Label>
                            <div className="relative group">
                                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <SearchableSelect
                                    value={mode}
                                    onValueChange={(v) => setMode(v)}
                                    options={['CASH', 'VIREMENT', 'CHEQUE', 'WAVE', 'OM'].map(m => ({ label: m, value: m }))}
                                    placeholder="Choisir..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Montant (FCFA)</Label>
                        <Input
                            type="number"
                            placeholder="Ex: 150000"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            className="h-12 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all font-black text-xl pl-4 shadow-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Observation</Label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                            <textarea
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                placeholder="Détails du paiement..."
                                className="w-full min-h-[80px] pt-3 pl-10 pr-4 rounded-xl border border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium resize-none outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-muted transition-all">
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Enregistrer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
