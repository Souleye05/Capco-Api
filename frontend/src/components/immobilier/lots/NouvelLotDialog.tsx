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
import { toast } from 'sonner';

interface NouvelLotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    immeubles: any[];
}

export function NouvelLotDialog({ open, onOpenChange, immeubles }: NouvelLotDialogProps) {
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
                etage: etage || undefined,
                loyerMensuelAttendu: amount,
                statut: 'LIBRE',
                locataireId: undefined
            });
            onOpenChange(false);
        } catch (error) { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px]">
                <DialogHeader>
                    <DialogTitle>Nouveau lot</DialogTitle>
                    <DialogDescription>
                        Créez un nouveau lot ou appartement à gérer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs tracking-widest">Immeuble de destination</Label>
                        <Select value={immeubleId} onValueChange={setImmeubleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'immeuble" />
                            </SelectTrigger>
                            <SelectContent>
                                {immeubles.map(imm => (
                                    <SelectItem key={imm.id} value={imm.id} className="font-bold">{imm.nom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Numéro du lot</Label>
                            <Input
                                placeholder="Ex: A01, B02..."
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}

                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Étage (optionnel)</Label>
                            <Input
                                placeholder="Ex: RDC, 1er étage..."
                                value={etage}
                                onChange={(e) => setEtage(e.target.value)}

                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Type de Lot</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'].map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Loyer mensuel attendu (FCFA)</Label>
                        <Input
                            type="number"
                            placeholder="Ex: 150000"
                            value={loyer}
                            onChange={(e) => setLoyer(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={createLot.isPending}>
                        {createLot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin"  />}
                        Créer le lot
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
