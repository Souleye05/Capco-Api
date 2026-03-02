import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TrendingDown, Calendar, DollarSign, FileText, LayoutGrid, Info, Loader2, Wrench, Layers } from 'lucide-react';

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
            <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-8 py-8 border-b border-border/10 bg-gradient-to-br from-destructive/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive/60 mb-2">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Console de Charge</span>
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                            {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium opacity-60">
                            {isEditing ? 'Mettre à jour les détails de cette opération comptable' : 'Enregistrez une sortie de fonds pour l\'entretien du patrimoine'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-8 py-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">Immeuble concerné *</Label>
                        <div className="relative group">
                            <LayoutGrid className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-destructive transition-colors pointer-events-none" />
                            <SearchableSelect
                                value={form.immeubleId}
                                onValueChange={v => setForm((f: any) => ({ ...f, immeubleId: v }))}
                                options={immeubles.map((i: any) => ({
                                    value: i.id,
                                    label: `${i.nom} (${i.reference})`
                                }))}
                                placeholder="Sélectionner l'immeuble..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-destructive/5 shadow-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date d'opération *</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-destructive transition-colors pointer-events-none" />
                                <Input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))}
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:bg-background focus:ring-4 focus:ring-destructive/5 shadow-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">Montant (FCFA) *</Label>
                            <div className="relative group">
                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-destructive transition-colors pointer-events-none" />
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.montant}
                                    onChange={e => setForm((f: any) => ({ ...f, montant: e.target.value }))}
                                    placeholder="Ex: 25000"
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-black focus:bg-background focus:ring-4 focus:ring-destructive/5 shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">Catégorie de dépense</Label>
                        <div className="relative group">
                            <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-destructive transition-colors pointer-events-none" />
                            <SearchableSelect
                                value={form.typeDepense}
                                onValueChange={v => setForm((f: any) => ({ ...f, typeDepense: v }))}
                                options={Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                                placeholder="Choisir un type..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-destructive/5 shadow-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">Nature / Objet *</Label>
                        <div className="relative group">
                            <Wrench className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-destructive transition-colors pointer-events-none" />
                            <Input
                                value={form.nature}
                                onChange={e => setForm((f: any) => ({ ...f, nature: e.target.value }))}
                                placeholder="Ex: Réparation fuite d'eau..."
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-black focus:bg-background focus:ring-4 focus:ring-destructive/5 shadow-none placeholder:font-medium placeholder:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-wider text-foreground/70 ml-1">Notes complémentaires</Label>
                        <div className="relative group">
                            <FileText className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-destructive transition-colors pointer-events-none" />
                            <Textarea
                                value={form.description}
                                onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                                placeholder="Détails supplémentaires sur l'intervention..."
                                className="min-h-[100px] pl-10 pt-2.5 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:bg-background focus:ring-4 focus:ring-destructive/5 shadow-none placeholder:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-border/10 bg-muted/5 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6 font-bold text-[11px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isPending || isInvalid}
                        className="rounded-xl h-12 px-8 bg-foreground hover:bg-foreground/90 text-background shadow-lg shadow-foreground/10 transition-all hover:scale-[1.02] active:scale-95 text-[11px] font-black uppercase tracking-widest font-display gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Action en cours...</span>
                            </>
                        ) : (
                            isEditing ? 'Mettre à jour' : 'Enregistrer la charge'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function DeleteConfirmationDialog({ open, onOpenChange, item, onConfirm, isDeleting }: any) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl sm:max-w-[440px]">
                <div className="px-8 py-8">
                    <AlertDialogHeader>
                        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 mb-6 shadow-lg shadow-destructive/5">
                            <span className="text-2xl font-black">!</span>
                        </div>
                        <AlertDialogTitle className="text-2xl font-black tracking-tight text-foreground">
                            Supprimer cette dépense ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground/80 leading-relaxed mt-2">
                            Vous êtes sur le point de supprimer la dépense <span className="font-black text-foreground">« {item?.nature} »</span> d'un montant de <span className="font-black text-destructive">{Number(item?.montant || 0).toLocaleString('fr-FR')} FCFA</span>.
                            <br /><br />
                            Cette action est <span className="underline decoration-destructive/30 underline-offset-4">irréversible</span> et impactera vos rapports de gestion.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
                <div className="px-8 py-6 border-t border-border/10 bg-muted/5 flex items-center justify-end gap-4">
                    <AlertDialogCancel disabled={isDeleting} className="border-none bg-transparent hover:bg-muted text-[11px] font-bold uppercase tracking-widest rounded-xl h-11 px-6 shadow-none">
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl h-11 px-8 shadow-lg shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-95 text-[11px] font-black uppercase tracking-widest border-none"
                        onClick={(e) => { e.preventDefault(); onConfirm(); }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
