import { useState, useEffect } from 'react';
import { Loader2, Building2, Home, Hash, Layers, DollarSign, Plus } from 'lucide-react';
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
import { useCreateLot } from '@/hooks/useImmobilier';
import { toast } from 'sonner';

interface NouvelLotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    immeubles: any[];
}

const LOT_TYPES = ['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'];

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
            toast.success('Lot créé avec succès');
        } catch (error) { }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <Plus className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configuration</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Nouveau lot</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Créez un nouvel emplacement (appartement, magasin, bureau) à gérer.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Immeuble de destination <span className="text-primary">*</span></Label>
                        <div className="relative group">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                            <SearchableSelect
                                options={immeubles.map(imm => ({ label: imm.nom, value: imm.id }))}
                                value={immeubleId}
                                onValueChange={setImmeubleId}
                                placeholder="Sélectionner l'immeuble..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Numéro du lot <span className="text-primary">*</span></Label>
                            <div className="relative group">
                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Ex: A01, B02..."
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Étage (Optionnel)</Label>
                            <div className="relative group">
                                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Ex: RDC, 1er..."
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
                                placeholder="Choisir le type..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Loyer mensuel indicatif (FCFA)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="number"
                                placeholder="Ex: 150000"
                                value={loyer}
                                onChange={(e) => setLoyer(e.target.value)}
                                className="h-12 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all font-black text-xl"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={createLot.isPending} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {createLot.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Créer le lot'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
