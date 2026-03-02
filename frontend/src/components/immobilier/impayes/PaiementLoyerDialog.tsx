import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, CreditCard, DollarSign, Wallet, Loader2, Info, CheckCircle2 } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';
import { type LoyerAttendu } from '@/hooks/useImpayesPage';
import { useCreateEncaissementLoyer } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface PaiementLoyerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loyer: LoyerAttendu | null;
}

const MODES = [
    { value: "VIREMENT", label: "Virement bancaire" },
    { value: "CHEQUE", label: "Chèque" },
    { value: "CASH", label: "Espèces" },
    { value: "WAVE", label: "Wave" },
    { value: "OM", label: "Orange Money" }
];

export function PaiementLoyerDialog({ open, onOpenChange, loyer }: PaiementLoyerDialogProps) {
    const createEncaissement = useCreateEncaissementLoyer();
    const [montant, setMontant] = useState('');
    const [mode, setMode] = useState<'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM'>('VIREMENT');
    const [date, setDate] = useState<Date>(new Date());

    useEffect(() => {
        if (loyer) {
            setMontant(loyer.montantAttendu.toString());
            setMode('VIREMENT');
            setDate(new Date());
        }
    }, [loyer, open]);

    const handleSubmit = async () => {
        if (!loyer) return;

        const val = parseFloat(montant);
        if (isNaN(val) || val <= 0) {
            toast.error('Veuillez saisir un montant valide');
            return;
        }

        try {
            await createEncaissement.mutateAsync({
                lotId: loyer.lotId,
                dateEncaissement: format(date, 'yyyy-MM-dd'),
                moisConcerne: loyer.mois,
                montantEncaisse: val,
                modePaiement: mode,
            });

            onOpenChange(false);
            toast.success('Paiement enregistré avec succès');
        } catch (error) { }
    };

    if (!loyer) return null;

    const currentMontant = parseFloat(montant) || 0;
    const commission = currentMontant * (loyer.tauxCommission / 100);
    const net = currentMontant - commission;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Règlement de loyer</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Enregistrer le paiement</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Enregistrement du loyer pour le lot <span className="text-foreground font-black">{loyer.lotNumero}</span> ({loyer.immeubleNom}).
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Période concernée</p>
                            <p className="text-sm font-bold capitalize">
                                {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(loyer.mois + '-01'))}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date de réception</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-bold h-11 rounded-xl border-border/40 bg-muted/20 hover:bg-muted/30 transition-all pl-3.5">
                                    <Calendar className="mr-3 h-4 w-4 text-primary" />
                                    {format(date, 'dd MMMM yyyy')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-border/40 shadow-2xl rounded-2xl overflow-hidden" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Mode de règlement</Label>
                        <div className="relative group">
                            <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
                            <SearchableSelect
                                value={mode}
                                onValueChange={(v) => setMode(v as any)}
                                options={MODES}
                                placeholder="Choisir le mode..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Montant encaissé (FCFA)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="number"
                                value={montant}
                                onChange={(e) => setMontant(e.target.value)}
                                className="h-12 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all font-black text-xl shadow-none"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/20">
                                <span className="text-[10px] font-black text-muted-foreground tracking-tighter opacity-60">FCFA</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-1 mt-1 font-bold text-[10px] text-muted-foreground/80">
                            <Info className="h-3 w-3" />
                            <span>Montant contractuel : {formatCurrency(loyer.montantAttendu)}</span>
                        </div>
                    </div>

                    {currentMontant > 0 && (
                        <div className="bg-muted/10 p-5 rounded-[1.5rem] space-y-3 border border-border/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-5">
                                <CreditCard className="h-12 w-12" />
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Commission CAPCO ({loyer.tauxCommission}%)</span>
                                <span className="font-black text-warning tracking-tight">{formatCurrency(commission)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-border/10 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Net à reverser</span>
                                <span className="font-black text-primary text-xl tracking-tight">{formatCurrency(net)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all font-display">
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={createEncaissement.isPending} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest font-display">
                        {createEncaissement.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Confirmer le règlement'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
