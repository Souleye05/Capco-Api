import { useState, useEffect } from 'react';
import { Loader2, Check, X, Users } from 'lucide-react';
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
import { useUpdateLot } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface EditLotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lot: any;
    locataires: any[];
}

export function EditLotDialog({ open, onOpenChange, lot, locataires }: EditLotDialogProps) {
    const updateLot = useUpdateLot();

    const [numero, setNumero] = useState('');
    const [type, setType] = useState('');
    const [etage, setEtage] = useState('');
    const [loyer, setLoyer] = useState('');
    const [statut, setStatut] = useState<'OCCUPE' | 'LIBRE'>('LIBRE');
    const [locataireId, setLocataireId] = useState<string>('none');

    useEffect(() => {
        if (lot) {
            setNumero(lot.numero);
            setType(lot.type || 'AUTRE');
            setEtage(lot.etage || '');
            setLoyer(String(lot.loyerMensuelAttendu));
            setStatut(lot.statut);
            setLocataireId(lot.locataireId || 'none');
        }
    }, [lot, open]);

    const handleSubmit = async () => {
        if (!lot) return;
        const amount = parseFloat(loyer);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Loyer invalide');
            return;
        }

        try {
            await updateLot.mutateAsync({
                id: lot.id,
                numero,
                type: type as any,
                etage: etage || null,
                loyerMensuelAttendu: amount,
                statut,
                locataireId: statut === 'LIBRE' ? null : (locataireId === 'none' ? null : locataireId)
            });
            onOpenChange(false);
        } catch (error) { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Modifier le lot</DialogTitle>
                    <DialogDescription className="font-medium font-display">
                        Ajustez les informations techniques ou d'occupation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Référence / N°</Label>
                            <Input
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                className="h-11 rounded-xl border-border/50 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Étage</Label>
                            <Input
                                value={etage}
                                onChange={(e) => setEtage(e.target.value)}
                                className="h-11 rounded-xl border-border/50 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Type de bien</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
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
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Loyer HC (FCFA)</Label>
                        <Input
                            type="number"
                            value={loyer}
                            onChange={(e) => setLoyer(e.target.value)}
                            className="h-11 rounded-xl border-border/50 font-black text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Statut d'occupation</Label>
                        <Select value={statut} onValueChange={(v) => setStatut(v as any)}>
                            <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="OCCUPE" className="font-bold">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-success" />
                                        Occupé
                                    </div>
                                </SelectItem>
                                <SelectItem value="LIBRE" className="font-bold">
                                    <div className="flex items-center gap-2">
                                        <X className="h-4 w-4 text-warning" />
                                        Libre
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {statut === 'OCCUPE' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Locataire en place</Label>
                            <Select value={locataireId} onValueChange={setLocataireId}>
                                <SelectTrigger className="h-11 rounded-xl border-border/50 font-bold bg-muted/20">
                                    <SelectValue placeholder="Sélectionner un locataire" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="none" className="font-bold text-muted-foreground italic">Aucun locataire</SelectItem>
                                    {locataires.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id} className="font-bold">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                {loc.nom}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Annuler</Button>
                    <Button onClick={handleSubmit} disabled={updateLot.isPending} className="rounded-xl font-black px-8 bg-primary">
                        {updateLot.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
