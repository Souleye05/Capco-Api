import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TypeAction, ModePaiement } from '@/hooks/useRecouvrement';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
}

export const ActionFormDialog = ({ open, onOpenChange, onSubmit, labels, initialData }: DialogProps & { labels: Record<string, string> }) => {
    const [data, setData] = useState({ type: 'APPEL_TELEPHONIQUE' as TypeAction, resume: '', prochaineEtape: '', echeance: '' });

    useEffect(() => {
        if (open && initialData) {
            setData({
                type: initialData.typeAction,
                resume: initialData.resume || '',
                prochaineEtape: initialData.prochaineEtape || '',
                echeance: initialData.echeanceProchaineEtape ? new Date(initialData.echeanceProchaineEtape).toISOString().split('T')[0] : ''
            });
        } else if (open && !initialData) {
            setData({ type: 'APPEL_TELEPHONIQUE', resume: '', prochaineEtape: '', echeance: '' });
        }
    }, [open, initialData]);

    const handle = async () => {
        if (!data.resume) return toast.error("Le résumé est obligatoire");
        await onSubmit({ typeAction: data.type, resume: data.resume, prochaineEtape: data.prochaineEtape || undefined, echeanceProchaineEtape: data.echeance || undefined });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>Action de recouvrement</DialogTitle><DialogDescription>Détaillez le contact ou la procédure effectuée.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select value={data.type} onValueChange={(v) => setData({ ...data, type: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(labels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Résumé</Label>
                        <Textarea value={data.resume} onChange={(e) => setData({ ...data, resume: e.target.value })} placeholder="..." rows={3} />
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={handle} className="bg-primary hover:bg-primary/90 transition-all text-white">Enregistrer</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const PaiementFormDialog = ({ open, onOpenChange, onSubmit, initialData }: DialogProps) => {
    const [data, setData] = useState({ montant: '', mode: 'CASH' as ModePaiement, reference: '', commentaire: '' });

    useEffect(() => {
        if (open && initialData) {
            setData({
                montant: initialData.montant.toString(),
                mode: initialData.mode,
                reference: initialData.reference || '',
                commentaire: initialData.commentaire || ''
            });
        } else if (open && !initialData) {
            setData({ montant: '', mode: 'CASH', reference: '', commentaire: '' });
        }
    }, [open, initialData]);

    const handle = async () => {
        if (!data.montant) return toast.error("Le montant est obligatoire");
        await onSubmit({ montant: parseFloat(data.montant), mode: data.mode, reference: data.reference || undefined, commentaire: data.commentaire || undefined });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>Encaisser un paiement</DialogTitle><DialogDescription>Ajouter un versement reçu du débiteur.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Montant (FCFA)</Label>
                        <Input type="number" value={data.montant} onChange={(e) => setData({ ...data, montant: e.target.value })} className="font-bold text-lg text-success" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Mode</Label>
                        <Select value={data.mode} onValueChange={(v) => setData({ ...data, mode: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                            <SelectItem value="CASH">Espèces</SelectItem>
                            <SelectItem value="VIREMENT">Virement</SelectItem>
                            <SelectItem value="CHEQUE">Chèque</SelectItem>
                            <SelectItem value="WAVE">Wave</SelectItem>
                            <SelectItem value="OM">Orange Money</SelectItem>
                        </SelectContent></Select>
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={handle} className="bg-primary hover:bg-primary/90 transition-all text-white">Confirmer l'encaissement</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
export const GlobalPaiementFormDialog = ({ open, onOpenChange, onSubmit, dossiers }: DialogProps & { dossiers: any[] }) => {
    const [data, setData] = useState({ dossierId: '', montant: '', mode: 'CASH' as ModePaiement, reference: '', commentaire: '' });
    const [comboOpen, setComboOpen] = useState(false);

    const handle = async () => {
        if (!data.dossierId) return toast.error("Le dossier est obligatoire");
        if (!data.montant) return toast.error("Le montant est obligatoire");
        await onSubmit({ dossierId: data.dossierId, montant: parseFloat(data.montant), mode: data.mode, reference: data.reference || undefined, commentaire: data.commentaire || undefined });
        setData({ dossierId: '', montant: '', mode: 'CASH', reference: '', commentaire: '' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle><DialogDescription>Saisissez les détails de l'encaissement.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Dossier de recouvrement</Label>
                        <Popover open={comboOpen} onOpenChange={setComboOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboOpen}
                                    className="w-full justify-between bg-slate-50 border-none h-11 text-xs font-medium"
                                >
                                    {data.dossierId
                                        ? dossiers.find((d) => d.id === data.dossierId)?.reference || "Sélectionner..."
                                        : "Sélectionner le dossier..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Rechercher par référence ou débiteur..." className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>Aucun dossier trouvé.</CommandEmpty>
                                        <CommandGroup>
                                            {dossiers.map((d) => (
                                                <CommandItem
                                                    key={d.id}
                                                    value={`${d.reference} ${d.debiteurNom}`}
                                                    onSelect={() => {
                                                        setData({ ...data, dossierId: d.id });
                                                        setComboOpen(false);
                                                    }}
                                                    className="text-xs"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            data.dossierId === d.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{d.reference}</span>
                                                        <span className="text-[10px] text-slate-400">{d.debiteurNom}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label>Montant (FCFA)</Label>
                        <Input type="number" value={data.montant} onChange={(e) => setData({ ...data, montant: e.target.value })} className="font-bold text-lg text-success" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Mode</Label>
                            <Select value={data.mode} onValueChange={(v) => setData({ ...data, mode: v as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="VIREMENT">Virement</SelectItem>
                                    <SelectItem value="CHEQUE">Chèque</SelectItem>
                                    <SelectItem value="WAVE">Wave</SelectItem>
                                    <SelectItem value="OM">Orange Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Référence (Optionnel)</Label>
                            <Input value={data.reference} onChange={(e) => setData({ ...data, reference: e.target.value })} placeholder="N° Chèque, reçu..." />
                        </div>
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={handle} className="bg-primary hover:bg-primary/90 transition-all text-white">Confirmer l'encaissement</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
