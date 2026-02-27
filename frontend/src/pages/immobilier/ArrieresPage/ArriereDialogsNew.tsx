import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { cn } from "@/lib/utils";

// Local definitions to avoid ReferenceError if imports from @/components/ui/dialog fail
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
const MODE_LABELS: Record<string, string> = { CASH: 'Espèces', VIREMENT: 'Virement', CHEQUE: 'Chèque', WAVE: 'Wave', OM: 'Orange Money' };

export function DialogueArriere({ open, onOpenChange, id, form, setForm, immeubles, lots, onSave, isPending }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{id ? 'Modifier arriéré' : 'Nouvel arriéré'}</DialogTitle>
                    <DialogDescription>
                        {id ? 'Modifiez les informations de cet arriéré.' : 'Renseignez les informations pour enregistrer un nouvel arriéré.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {!id && (
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Immeuble</Label>
                                <Select value={form.immeubleId} onValueChange={v => setForm({ ...form, immeubleId: v, lotId: '' })}>
                                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                                    <SelectContent>
                                        {immeubles.map((im: any) => <SelectItem key={im.id} value={im.id}>{im.nom}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Lot / Locataire</Label>
                                <Select value={form.lotId} onValueChange={v => setForm({ ...form, lotId: v })} disabled={!form.immeubleId}>
                                    <SelectTrigger><SelectValue placeholder="Choisir un lot..." /></SelectTrigger>
                                    <SelectContent>
                                        {lots.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Montant (FCFA)</Label>
                        <Input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Observation</Label>
                        <Input value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} placeholder="Détails..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={onSave} disabled={isPending}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DialoguePaiement({ open, onOpenChange, availableSolde, form, setForm, onSave, isPending }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Encaisser un arriéré</DialogTitle>
                    <DialogDescription>
                        Enregistrez un paiement pour cet arriéré.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm bg-muted/50 p-3 rounded mb-4">
                    <span className="text-muted-foreground mr-1">Solde disponible:</span>
                    <span className="font-bold text-destructive">{formatFCFA(availableSolde)}</span>
                </div>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Montant</Label>
                        <Input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Mode</Label>
                        <Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(MODE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Note</Label>
                        <Input value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={onSave} disabled={isPending}>Confirmer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DialogueSuppression({ open, onOpenChange, onConfirm }: any) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                        Voulez-vous vraiment supprimer cet arriéré ? Cette action est définitive.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={onConfirm}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
