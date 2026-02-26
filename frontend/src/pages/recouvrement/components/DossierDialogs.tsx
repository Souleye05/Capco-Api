import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TypeAction, ModePaiement, TypeDepenseDossier, TypeHonoraires } from '@/hooks/useRecouvrement';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDateForAPI, parseDateFromAPI } from '@/lib/date-utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    soldeRestant?: number;
}

export const ActionFormDialog = ({ open, onOpenChange, onSubmit, labels, initialData }: DialogProps & { labels: Record<string, string> }) => {
    const [data, setData] = useState({ type: 'APPEL_TELEPHONIQUE' as TypeAction, resume: '', prochaineEtape: '', echeance: '' });

    useEffect(() => {
        if (open && initialData) {
            setData({
                type: initialData.typeAction,
                resume: initialData.resume || '',
                prochaineEtape: initialData.prochaineEtape || '',
                echeance: initialData.echeanceProchaineEtape ? formatDateForAPI(parseDateFromAPI(initialData.echeanceProchaineEtape)) : ''
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

export const PaiementFormDialog = ({ open, onOpenChange, onSubmit, initialData, soldeRestant }: DialogProps) => {
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
        const montant = parseFloat(data.montant);
        if (!data.montant || montant <= 0) return toast.error("Le montant doit être supérieur à 0");
        if (soldeRestant !== undefined && montant > soldeRestant) {
            if (!window.confirm(`Le montant (${montant}) dépasse le solde restant (${soldeRestant}). Confirmer quand même ?`)) return;
        }
        await onSubmit({ montant, mode: data.mode, reference: data.reference || undefined, commentaire: data.commentaire || undefined });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>Encaisser un paiement</DialogTitle><DialogDescription>Ajouter un versement reçu du débiteur.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    {soldeRestant !== undefined && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">Solde restant</span>
                            <span className="text-sm font-black text-slate-900">{formatCurrency(soldeRestant)}</span>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label>Montant (FCFA)</Label>
                        <Input type="number" value={data.montant} onChange={(e) => setData({ ...data, montant: e.target.value })} className={cn("font-bold text-lg", soldeRestant !== undefined && parseFloat(data.montant) > soldeRestant ? "text-warning" : "text-success")} />
                        {soldeRestant !== undefined && parseFloat(data.montant) > soldeRestant && (
                            <p className="text-[10px] text-warning font-bold italic">Attention: dépasse le solde restant</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid gap-2">
                            <Label>Référence</Label>
                            <Input value={data.reference} onChange={(e) => setData({ ...data, reference: e.target.value })} placeholder="N° Chèque, reçu..." />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Commentaire</Label>
                        <Textarea value={data.commentaire} onChange={(e) => setData({ ...data, commentaire: e.target.value })} placeholder="Notes additionnelles..." rows={2} />
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

    const dossierSelectionne = dossiers.find(d => d.id === data.dossierId);
    const soldeRestant = dossierSelectionne ? dossierSelectionne.soldeRestant : undefined;

    const handle = async () => {
        if (!data.dossierId) return toast.error("Le dossier est obligatoire");
        const montant = parseFloat(data.montant);
        if (!data.montant || montant <= 0) return toast.error("Le montant doit être supérieur à 0");

        if (soldeRestant !== undefined && montant > soldeRestant) {
            if (!window.confirm(`Le montant (${montant}) dépasse le solde restant (${soldeRestant}). Confirmer quand même ?`)) return;
        }

        await onSubmit({ dossierId: data.dossierId, montant, mode: data.mode, reference: data.reference || undefined, commentaire: data.commentaire || undefined });
        setData({ dossierId: '', montant: '', mode: 'CASH', reference: '', commentaire: '' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle><DialogDescription>Saisissez les détails de l'encaissement.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    {soldeRestant !== undefined && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center animate-in fade-in zoom-in duration-300">
                            <span className="text-xs font-bold text-slate-400 uppercase">Solde restant sur dossier</span>
                            <span className="text-sm font-black text-slate-900">{formatCurrency(soldeRestant)}</span>
                        </div>
                    )}
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
                        <Input type="number" value={data.montant} onChange={(e) => setData({ ...data, montant: e.target.value })} className={cn("font-bold text-lg", soldeRestant !== undefined && parseFloat(data.montant) > soldeRestant ? "text-warning" : "text-success")} />
                        {soldeRestant !== undefined && parseFloat(data.montant) > soldeRestant && (
                            <p className="text-[10px] text-warning font-bold italic">Attention: dépasse le solde du dossier</p>
                        )}
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

export const ConfirmDeleteDialog = ({ open, onOpenChange, onConfirm, title, description }: { open: boolean, onOpenChange: (open: boolean) => void, onConfirm: () => void, title?: string, description?: string }) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[400px] border-none shadow-2xl">
                <AlertDialogHeader>
                    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-xl font-bold">{title || "Confirmer la suppression"}</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500">
                        {description || "Cette action est irréversible. Toutes les données associées seront définitivement supprimées."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="rounded-full border-slate-200">Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="rounded-full bg-destructive hover:bg-destructive/90 text-white">Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export const DepenseFormDialog = ({ open, onOpenChange, onSubmit, initialData }: DialogProps) => {
    const [data, setData] = useState({ nature: '', typeDepense: 'AUTRES' as TypeDepenseDossier, montant: '' });

    useEffect(() => {
        if (open && initialData) {
            setData({
                nature: initialData.nature,
                typeDepense: initialData.typeDepense,
                montant: initialData.montant.toString()
            });
        } else if (open && !initialData) {
            setData({ nature: '', typeDepense: 'AUTRES', montant: '' });
        }
    }, [open, initialData]);

    const handle = async () => {
        const montant = parseFloat(data.montant);
        if (!data.nature) return toast.error("La nature est obligatoire");
        if (!data.montant || montant <= 0) return toast.error("Le montant doit être supérieur à 0");
        await onSubmit({ nature: data.nature, typeDepense: data.typeDepense, montant });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>Engager une dépense</DialogTitle><DialogDescription>Enregistrez les frais liés à la procédure.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Type de dépense</Label>
                        <Select value={data.typeDepense} onValueChange={(v) => setData({ ...data, typeDepense: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FRAIS_HUISSIER">Frais d'huissier</SelectItem>
                                <SelectItem value="FRAIS_GREFFE">Frais de greffe</SelectItem>
                                <SelectItem value="TIMBRES_FISCAUX">Timbres fiscaux</SelectItem>
                                <SelectItem value="FRAIS_COURRIER">Frais de courrier</SelectItem>
                                <SelectItem value="FRAIS_DEPLACEMENT">Frais de déplacement</SelectItem>
                                <SelectItem value="FRAIS_EXPERTISE">Frais d'expertise</SelectItem>
                                <SelectItem value="AUTRES">Autres</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Nature / Description</Label>
                        <Input value={data.nature} onChange={(e) => setData({ ...data, nature: e.target.value })} placeholder="Ex: Signification de mise en demeure..." />
                    </div>
                    <div className="grid gap-2">
                        <Label>Montant (FCFA)</Label>
                        <Input type="number" value={data.montant} onChange={(e) => setData({ ...data, montant: e.target.value })} className="font-bold text-lg text-destructive" />
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={handle} className="bg-primary hover:bg-primary/90 transition-all text-white">Enregistrer la dépense</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const HonoraireFormDialog = ({ open, onOpenChange, onSubmit, initialData }: DialogProps) => {
    const [data, setData] = useState({ type: 'FORFAIT' as TypeHonoraires, montantPrevu: '', pourcentage: '', montantPaye: '' });

    useEffect(() => {
        if (open && initialData) {
            setData({
                type: initialData.type,
                montantPrevu: initialData.montantPrevu?.toString() || '',
                pourcentage: initialData.pourcentage?.toString() || '',
                montantPaye: initialData.montantPaye?.toString() || '0'
            });
        }
    }, [open, initialData]);

    const handle = async () => {
        const montantPrevu = parseFloat(data.montantPrevu) || 0;
        const pourcentage = parseFloat(data.pourcentage) || 0;
        const montantPaye = parseFloat(data.montantPaye) || 0;

        if (data.type === 'FORFAIT' && montantPrevu <= 0) return toast.error("Le montant est obligatoire pour un forfait");
        if (data.type === 'POURCENTAGE' && pourcentage <= 0) return toast.error("Le pourcentage est obligatoire");

        await onSubmit({
            type: data.type,
            montantPrevu,
            pourcentage: data.type !== 'FORFAIT' ? pourcentage : undefined,
            montantPaye
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader><DialogTitle>Convention d'honoraires</DialogTitle><DialogDescription>Définissez les honoraires pour ce dossier.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Type d'honoraires</Label>
                        <Select value={data.type} onValueChange={(v) => setData({ ...data, type: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FORFAIT">Forfait fixe</SelectItem>
                                <SelectItem value="POURCENTAGE">Pourcentage sur recouvrement</SelectItem>
                                <SelectItem value="MIXTE">Mixte (Forfait + Pourcentage)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {(data.type === 'FORFAIT' || data.type === 'MIXTE') && (
                            <div className="grid gap-2">
                                <Label>Montant fixe (FCFA)</Label>
                                <Input type="number" value={data.montantPrevu} onChange={(e) => setData({ ...data, montantPrevu: e.target.value })} className="font-bold" />
                            </div>
                        )}

                        {(data.type === 'POURCENTAGE' || data.type === 'MIXTE') && (
                            <div className="grid gap-2">
                                <Label>Pourcentage (%)</Label>
                                <Input type="number" value={data.pourcentage} onChange={(e) => setData({ ...data, pourcentage: e.target.value })} className="font-bold" />
                            </div>
                        )}
                    </div>

                    <Separator className="my-2" />

                    <div className="grid gap-2">
                        <Label>Montant déjà payé (FCFA)</Label>
                        <Input type="number" value={data.montantPaye} onChange={(e) => setData({ ...data, montantPaye: e.target.value })} className="font-bold text-success" />
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={handle} className="bg-primary hover:bg-primary/90 transition-all text-white">Mettre à jour la convention</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
