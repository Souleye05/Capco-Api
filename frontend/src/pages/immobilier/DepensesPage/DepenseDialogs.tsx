import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const TYPE_DEPENSE_LABELS: Record<string, string> = {
    PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
    ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
    ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance',
    SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
    AUTRES_DEPENSES: 'Autres dépenses',
};

export function DepenseFormDialog({
    open, onOpenChange, isEditing, form, setForm, immeubles, onSave, isPending
}: any) {
    const isInvalid = !form.immeubleId || !form.nature || !form.montant;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
                    <DialogDescription>{isEditing ? 'Modifier les informations de la dépense' : 'Enregistrer une dépense liée à un immeuble'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Immeuble *</Label>
                        <Select value={form.immeubleId} onValueChange={v => setForm((f: any) => ({ ...f, immeubleId: v }))}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner un immeuble" /></SelectTrigger>
                            <SelectContent>
                                {immeubles.map((i: any) => (
                                    <SelectItem key={i.id} value={i.id}>{i.nom} ({i.reference})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Date *</Label>
                            <Input type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Montant (FCFA) *</Label>
                            <Input type="number" min="0" value={form.montant} onChange={e => setForm((f: any) => ({ ...f, montant: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <Label>Type de dépense</Label>
                        <Select value={form.typeDepense} onValueChange={v => setForm((f: any) => ({ ...f, typeDepense: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Nature / Objet *</Label>
                        <Input value={form.nature} onChange={e => setForm((f: any) => ({ ...f, nature: e.target.value }))} placeholder="Ex: Réparation fuite d'eau" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Détails supplémentaires..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={onSave} disabled={isPending || isInvalid}>
                        {isPending ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DeleteConfirmationDialog({ open, onOpenChange, item, onConfirm, isDeleting }: any) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Vous êtes sur le point de supprimer la dépense « {item?.nature} » d'un montant de {Number(item?.montant || 0).toLocaleString('fr-FR')} FCFA. Cette action est irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => { e.preventDefault(); onConfirm(); }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
