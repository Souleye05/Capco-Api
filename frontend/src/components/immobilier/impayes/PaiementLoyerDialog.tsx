import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { formatCurrency } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';
import { type LoyerAttendu } from '@/hooks/useImpayesPage';
import { useCreateEncaissementLoyer } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface PaiementLoyerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loyer: LoyerAttendu | null;
}

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

    const commission = parseFloat(montant) * (loyer.tauxCommission / 100);
    const net = parseFloat(montant) - commission;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-[32px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Enregistrer le paiement</DialogTitle>
                    <DialogDescription className="font-medium">
                        Enregistrement du loyer pour le lot <span className="text-foreground font-black">{loyer.lotNumero}</span> ({loyer.immeubleNom})
                        <br />
                        Période : <span className="text-primary font-bold uppercase">{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(loyer.mois + '-01'))}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Date de réception</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-bold h-12 rounded-xl border-border/50">
                                    <Calendar className="mr-3 h-4 w-4 text-primary" />
                                    {format(date, 'dd MMMM yyyy')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
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

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Montant encaissé (FCFA)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={montant}
                                onChange={(e) => setMontant(e.target.value)}
                                className="h-12 rounded-xl border-border/50 font-black text-lg pl-4 pr-12 focus:ring-primary/20"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground opacity-50">FCFA</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-bold">
                            Montant contractuel : {formatCurrency(loyer.montantAttendu)}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Mode de paiement</Label>
                        <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                            <SelectTrigger className="h-12 rounded-xl border-border/50 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="VIREMENT" className="font-bold">Virement bancaire</SelectItem>
                                <SelectItem value="CHEQUE" className="font-bold">Chèque</SelectItem>
                                <SelectItem value="CASH" className="font-bold">Espèces</SelectItem>
                                <SelectItem value="WAVE" className="font-bold">Wave</SelectItem>
                                <SelectItem value="OM" className="font-bold">Orange Money</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {montant && !isNaN(parseFloat(montant)) && (
                        <div className="bg-muted/50 p-5 rounded-2xl space-y-3 border border-border/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground">Commission CAPCO ({loyer.tauxCommission}%)</span>
                                <span className="font-black text-immobilier">{formatCurrency(commission)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                <span className="text-xs font-bold text-muted-foreground">Net propriétaire</span>
                                <span className="font-black text-primary text-lg">{formatCurrency(net)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createEncaissement.isPending}
                        className="rounded-xl font-black px-8 bg-primary shadow-lg shadow-primary/20"
                    >
                        {createEncaissement.isPending ? 'Enregistrement...' : 'Confirmer le règlement'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
