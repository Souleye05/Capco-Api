import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { TypeDepenseDossier } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function AffaireDialogs({ ui, actions, finance }: { ui: any; actions: any; finance: any }) {
    const [hMontant, setHMontant] = useState('');
    const [pMontant, setPMontant] = useState('');
    const [pMode, setPMode] = useState('VIREMENT');
    const [pNotes, setPNotes] = useState('');

    const [dType, setDType] = useState<TypeDepenseDossier>('AUTRES');
    const [dNature, setDNature] = useState('');
    const [dMontant, setDMontant] = useState('');
    const [dDesc, setDDesc] = useState('');

    useEffect(() => { if (ui.showHonoraires) setHMontant(finance.montantPrevu.toString()); }, [ui.showHonoraires]);

    return (
        <>
            <Dialog open={ui.showHonoraires} onOpenChange={ui.setShowHonoraires}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Montant des honoraires</DialogTitle>
                        <DialogDescription>Définissez le montant total convenu pour ce dossier.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Montant total (FCFA)</Label>
                            <Input type="number" value={hMontant} onChange={(e) => setHMontant(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => ui.setShowHonoraires(false)}>Annuler</Button>
                        <Button onClick={() => actions.handleSaveHonoraires(parseFloat(hMontant))}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={ui.showPaiement} onOpenChange={ui.setShowPaiement}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enregistrer un paiement</DialogTitle>
                        <DialogDescription>Ajoutez un versement d'honoraires pour cette affaire.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Montant (FCFA)</Label>
                            <Input type="number" value={pMontant} onChange={(e) => setPMontant(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Mode</Label>
                            <Select value={pMode} onValueChange={setPMode}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIREMENT">Virement</SelectItem>
                                    <SelectItem value="CASH">Espèces</SelectItem>
                                    <SelectItem value="WAVE">Wave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea value={pNotes} onChange={(e) => setPNotes(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => ui.setShowPaiement(false)}>Annuler</Button>
                        <Button onClick={() => actions.handleSavePaiement({ montant: parseFloat(pMontant), mode: pMode, notes: pNotes })}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={ui.showDepense} onOpenChange={ui.setShowDepense}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouvelle dépense</DialogTitle>
                        <DialogDescription>Enregistrez les frais liés à cette procédure.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nature</Label>
                            <Input value={dNature} onChange={(e) => setDNature(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Montant</Label>
                            <Input type="number" value={dMontant} onChange={(e) => setDMontant(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => ui.setShowDepense(false)}>Annuler</Button>
                        <Button onClick={() => actions.handleSaveDepense({ type: dType, nature: dNature, montant: parseFloat(dMontant), description: dDesc })}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
