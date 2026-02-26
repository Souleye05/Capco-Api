import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
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
import { useCreateEncaissementLoyer } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface NouvelEncaissementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    immeubles: any[];
    lots: any[];
}

export function NouvelEncaissementDialog({ open, onOpenChange, immeubles, lots }: NouvelEncaissementDialogProps) {
    const createEncaissement = useCreateEncaissementLoyer();

    const [immeubleId, setImmeubleId] = useState('');
    const [lotId, setLotId] = useState('');
    const [mois, setMois] = useState('');
    const [montant, setMontant] = useState('');
    const [mode, setMode] = useState<'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM'>('VIREMENT');

    useEffect(() => {
        if (!open) {
            setImmeubleId('');
            setLotId('');
            setMois('');
            setMontant('');
            setMode('VIREMENT');
        }
    }, [open]);

    const lotsForImmeuble = immeubleId
        ? lots.filter(l => l.immeubleId === immeubleId && l.statut === 'OCCUPE')
        : [];

    const handleSubmit = async () => {
        if (!lotId || !mois || !montant) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        const amount = parseFloat(montant);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Montant invalide');
            return;
        }

        try {
            await createEncaissement.mutateAsync({
                lotId,
                dateEncaissement: format(new Date(), 'yyyy-MM-dd'),
                moisConcerne: mois,
                montantEncaisse: amount,
                modePaiement: mode,
            });
            onOpenChange(false);
        } catch (error) { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-[32px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Nouvel encaissement</DialogTitle>
                    <DialogDescription className="font-medium">
                        Enregistrez un paiement manuel de loyer reçu hors processus automatisé.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Sélection de l'immeuble</Label>
                        <Select value={immeubleId} onValueChange={(v) => { setImmeubleId(v); setLotId(''); }}>
                            <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
                                <SelectValue placeholder="Choisir l'immeuble" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {immeubles.map(imm => (
                                    <SelectItem key={imm.id} value={imm.id} className="font-bold">{imm.nom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Lot concerné (actifs)</Label>
                        <Select value={lotId} onValueChange={setLotId} disabled={!immeubleId}>
                            <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
                                <SelectValue placeholder="Choisir le lot" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {lotsForImmeuble.map(lot => (
                                    <SelectItem key={lot.id} value={lot.id} className="font-bold">
                                        {lot.numero} - {lot.locataireNom || 'Sans nom'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Période (Mois)</Label>
                            <Input
                                type="month"
                                value={mois}
                                onChange={(e) => setMois(e.target.value)}
                                className="h-11 rounded-xl border-border/50 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Mode de paiement</Label>
                            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                                <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {['CASH', 'VIREMENT', 'CHEQUE', 'WAVE', 'OM'].map(m => (
                                        <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Montant encaissé (FCFA)</Label>
                        <Input
                            type="number"
                            placeholder="Ex: 150000"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            className="h-12 rounded-xl border-border/50 font-black text-xl pl-4 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Annuler</Button>
                    <Button onClick={handleSubmit} disabled={createEncaissement.isPending} className="rounded-xl font-black px-8 bg-primary shadow-lg shadow-primary/20">
                        {createEncaissement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Enregistrer le paiement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
