import { useState, useEffect } from 'react';
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
import { useCreateLot } from '@/hooks/useImmobilier';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { toast } from 'sonner';

interface NouvelLotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    immeubles: any[];
}

export function NouvelLotDialog({ open, onOpenChange, immeubles }: NouvelLotDialogProps) {
    const { user } = useNestJSAuth();
    const createLot = useCreateLot();

    const [immeubleId, setImmeubleId] = useState('');
    const [numero, setNumero] = useState('');
    const [type, setType] = useState<string>('AUTRE');
    const [etage, setEtage] = useState('');
    const [loyer, setLoyer] = useState('');

    useEffect(() => {
        if (!open) {
            setImmeubleId('');
            setNumero('');
            setType('AUTRE');
            setEtage('');
            setLoyer('');
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!immeubleId || !numero.trim() || !loyer) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        const amount = parseFloat(loyer);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Loyer invalide');
            return;
        }

        try {
            await createLot.mutateAsync({
                immeubleId,
                numero,
                type: type as any,
                etage: etage || null,
                loyerMensuelAttendu: amount,
                statut: 'LIBRE',
                locataireId: null,
                createdBy: user?.id
            });
            onOpenChange(false);
        } catch (error) { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Nouveau lot</DialogTitle>
                    <DialogDescription className="font-medium font-display">
                        Ajoutez un nouvel appartement ou commerce à votre parc immobilier.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Immeuble de destination</Label>
                        <Select value={immeubleId} onValueChange={setImmeubleId}>
                            <SelectTrigger className="h-12 rounded-xl border-border/50 font-bold bg-muted/20">
                                <SelectValue placeholder="Sélectionner l'immeuble" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {immeubles.map(imm => (
                                    <SelectItem key={imm.id} value={imm.id} className="font-bold">{imm.nom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Référence / N°</Label>
                            <Input
                                placeholder="Ex: A01"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                className="h-12 rounded-xl border-border/50 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Étage</Label>
                            <Input
                                placeholder="Ex: RDC"
                                value={etage}
                                onChange={(e) => setEtage(e.target.value)}
                                className="h-12 rounded-xl border-border/50 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Type de bien</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="h-12 rounded-xl border-border/50 font-bold bg-muted/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'].map(t => (
                                    <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Loyer mensuel HC (FCFA)</Label>
                        <Input
                            type="number"
                            placeholder="Ex: 150000"
                            value={loyer}
                            onChange={(e) => setLoyer(e.target.value)}
                            className="h-12 rounded-xl border-border/50 font-black text-lg"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Annuler</Button>
                    <Button onClick={handleSubmit} disabled={createLot.isPending} className="rounded-xl font-black px-8 bg-primary">
                        {createLot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Créer le lot
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
