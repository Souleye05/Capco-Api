import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogHeader,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
import { Building2, Home, Receipt, Info, Calendar, DollarSign, CreditCard, Trash2, Loader2, User } from 'lucide-react';

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
const MODE_LABELS: Record<string, string> = { CASH: 'Espèces', VIREMENT: 'Virement', CHEQUE: 'Chèque', WAVE: 'Wave', OM: 'Orange Money' };

export function DialogueArriere({ open, onOpenChange, id, form, setForm, immeubles, lots, onSave, isPending }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-primary/60 mb-1">
                            <Receipt className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Régularisation</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">{id ? 'Modifier arriéré' : 'Nouvel arriéré'}</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            {id ? 'Modifiez les informations de cet arriéré.' : 'Renseignez les informations pour enregistrer un nouvel arriéré.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5">
                    {!id && (
                        <div className="grid gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Immeuble</Label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                    <SearchableSelect
                                        options={immeubles.map((im: any) => ({ label: im.nom, value: im.id }))}
                                        value={form.immeubleId}
                                        onValueChange={v => setForm({ ...form, immeubleId: v, lotId: '' })}
                                        placeholder="Choisir l'immeuble..."
                                        className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Unité / Locataire</Label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                    <SearchableSelect
                                        options={lots.map((l: any) => ({ label: l.label, value: l.id }))}
                                        value={form.lotId}
                                        onValueChange={v => setForm({ ...form, lotId: v })}
                                        disabled={!form.immeubleId}
                                        placeholder="Choisir l'unité..."
                                        className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 disabled:opacity-40"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Montant dû (FCFA)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="number"
                                value={form.montant}
                                onChange={e => setForm({ ...form, montant: e.target.value })}
                                placeholder="0"
                                className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all font-black text-lg"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Observation</Label>
                        <div className="relative group">
                            <Info className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={form.observation}
                                onChange={e => setForm({ ...form, observation: e.target.value })}
                                placeholder="Détails ou motif de l'arriéré..."
                                className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button onClick={onSave} disabled={isPending} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Enregistrer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function DialoguePaiement({ open, onOpenChange, availableSolde, form, setForm, onSave, isPending }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-green-500/[0.03] to-transparent">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-green-600/60 mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Encroissement</span>
                        </div>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Règlement d'arriéré</DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            Enregistrez un paiement partiel ou total pour cet arriéré.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4">
                    <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-green-600/60">Reste à payer</span>
                        <span className="font-black text-green-600 text-lg">{formatFCFA(availableSolde)}</span>
                    </div>
                </div>

                <div className="px-6 py-2 space-y-5 pb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Date du paiement</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Montant versé</Label>
                            <div className="relative group">
                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="number"
                                    value={form.montant}
                                    onChange={e => setForm({ ...form, montant: e.target.value })}
                                    className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Mode de règlement</Label>
                        <div className="relative group">
                            <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                            <SearchableSelect
                                options={Object.entries(MODE_LABELS).map(([k, v]) => ({ label: v, value: k }))}
                                value={form.mode}
                                onValueChange={v => setForm({ ...form, mode: v })}
                                className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Note / Référence</Label>
                        <div className="relative group">
                            <Info className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={form.observation}
                                onChange={e => setForm({ ...form, observation: e.target.value })}
                                placeholder="Numéro de chèque, transaction ID..."
                                className="h-11 pl-10 rounded-xl border-border/40 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 flex items-center justify-end gap-3 border-t border-border/10 bg-muted/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                        Annuler
                    </Button>
                    <Button onClick={onSave} disabled={isPending} className="rounded-xl h-10 px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                        {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Confirmer'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function DialogueSuppression({ open, onOpenChange, onConfirm }: any) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-[2rem] border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
                <div className="px-6 py-6 space-y-4">
                    <AlertDialogHeader>
                        <div className="flex items-center justify-center mb-2">
                            <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
                                <Trash2 className="h-6 w-6" />
                            </div>
                        </div>
                        <AlertDialogTitle className="text-xl font-black text-center tracking-tight">Supprimer l'arriéré ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-center opacity-60">
                            Cette action est définitive. L'historique lié à cet arriéré sera effacé du système.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
                <div className="p-6 bg-muted/5 border-t border-border/10 flex items-center justify-center gap-3">
                    <AlertDialogCancel asChild>
                        <Button variant="ghost" className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                            Annuler
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button onClick={onConfirm} className="rounded-xl h-10 px-8 bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/10 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest">
                            Supprimer
                        </Button>
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
