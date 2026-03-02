import { useState, useEffect } from 'react';
import { Loader2, Check, X, Users, Hash, Layers, Home, DollarSign, Activity, Settings2 } from 'lucide-react';
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
import { useUpdateLot } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface EditLotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lot: any;
    locataires: any[];
}

const LOT_TYPES = ['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'];

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
            toast.success('Mise à jour réussie');
        } catch (error) { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <Settings2 className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Paramètres Lot</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Modifier le lot</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Ajustez les informations techniques ou d'occupation.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Référence / N°</Label>
                            <div className="relative group">
                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Étage</Label>
                            <div className="relative group">
                                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={etage}
                                    onChange={(e) => setEtage(e.target.value)}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Type de bien</Label>
                        <div className="relative group">
                            <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                            <SearchableSelect
                                value={type}
                                onValueChange={setType}
                                options={LOT_TYPES.map(t => ({ label: t, value: t }))}
                                placeholder="Sélectionner..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Loyer mensuel HC (FCFA)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="number"
                                value={loyer}
                                onChange={(e) => setLoyer(e.target.value)}
                                className="h-12 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all font-black text-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Statut d'occupation</Label>
                        <div className="relative group">
                            <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                            <SearchableSelect
                                value={statut}
                                onValueChange={(v) => setStatut(v as any)}
                                options={[
                                    { value: "OCCUPE", label: "Occupé" },
                                    { value: "LIBRE", label: "Libre" }
                                ]}
                                placeholder="Choisir..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                            />
                        </div>
                    </div>

                    {statut === 'OCCUPE' && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Locataire en place</Label>
                            <div className="relative group">
                                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <SearchableSelect
                                    value={locataireId}
                                    onValueChange={setLocataireId}
                                    options={[
                                        { value: "none", label: "Aucun locataire" },
                                        ...locataires.map(loc => ({ label: loc.nom, value: loc.id }))
                                    ]}
                                    placeholder="Sélectionner un locataire..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={updateLot.isPending} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {updateLot.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Enregistrer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
