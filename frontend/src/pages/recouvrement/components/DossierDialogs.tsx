import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TypeAction, ModePaiement } from '@/hooks/useRecouvrement';

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
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={handle} className="bg-recouvrement hover:bg-recouvrement/90 transition-all">Enregistrer</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const PaiementFormDialog = ({ open, onOpenChange, onSubmit, initialData }: DialogProps) => {
    const [data, setData] = useState({ montant: '', mode: 'VIREMENT' as ModePaiement, reference: '', commentaire: '' });

    useEffect(() => {
        if (open && initialData) {
            setData({
                montant: initialData.montant.toString(),
                mode: initialData.mode,
                reference: initialData.reference || '',
                commentaire: initialData.commentaire || ''
            });
        } else if (open && !initialData) {
            setData({ montant: '', mode: 'VIREMENT', reference: '', commentaire: '' });
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
                        <Select value={data.mode} onValueChange={(v) => setData({ ...data, mode: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VIREMENT">Virement</SelectItem><SelectItem value="ESPECES">Espèces</SelectItem><SelectItem value="CHEQUE">Chèque</SelectItem></SelectContent></Select>
                    </div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={handle} className="bg-success hover:bg-success/90 transition-all">Confirmer l'encaissement</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
