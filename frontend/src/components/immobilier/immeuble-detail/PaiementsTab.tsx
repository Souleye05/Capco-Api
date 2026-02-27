import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Receipt } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PaiementsTabProps {
    encaissements: any[];
    lots: any[];
    immeuble: any;
    onCreateEncaissement: (data: any) => Promise<void>;
    onDownloadQuittance: (enc: any) => void;
    isLoading: boolean;
}

export function PaiementsTab({
    encaissements,
    lots,
    immeuble,
    onCreateEncaissement,
    onDownloadQuittance,
    isLoading
}: PaiementsTabProps) {
    const [open, setOpen] = useState(false);
    const [lotId, setLotId] = useState('');
    const [mois, setMois] = useState('');
    const [montant, setMontant] = useState('');
    const [mode, setMode] = useState('VIREMENT');

    const totalLoyers = encaissements.reduce((sum, e) => sum + Number(e.montantEncaisse), 0);
    const totalCommissions = encaissements.reduce((sum, e) => sum + Number(e.commissionCapco), 0);

    const handleSubmit = async () => {
        if (!lotId || !mois || !montant) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        await onCreateEncaissement({
            lotId,
            moisConcerne: mois,
            montantEncaisse: parseFloat(montant),
            modePaiement: mode,
            dateEncaissement: format(new Date(), 'yyyy-MM-dd')
        });

        setOpen(false);
        setLotId('');
        setMois('');
        setMontant('');
    };

    const monthOptions = [];
    const today = new Date();
    for (let i = -2; i < 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthOptions.push(format(d, 'yyyy-MM'));
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Paiements de loyers</CardTitle>
                <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nouvel encaissement
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Lot</TableHead>
                            <TableHead>Locataire</TableHead>
                            <TableHead>Mois</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                            <TableHead>Document</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {encaissements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                    Aucun paiement trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            encaissements.map(enc => {
                                const lot = lots.find(l => l.id === enc.lotId);
                                const isFull = Number(enc.montantEncaisse) >= Number(lot?.loyerMensuelAttendu || 0);
                                return (
                                    <TableRow key={enc.id}>
                                        <TableCell>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.dateEncaissement))}</TableCell>
                                        <TableCell><Badge variant="outline">{lot?.numero || 'N/A'}</Badge></TableCell>
                                        <TableCell>{enc.locataireNom || lot?.locataireNom || '-'}</TableCell>
                                        <TableCell>{new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.moisConcerne + '-01'))}</TableCell>
                                        <TableCell><Badge variant="secondary">{enc.modePaiement}</Badge></TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(Number(enc.montantEncaisse))}</TableCell>
                                        <TableCell className="text-right text-warning">{formatCurrency(Number(enc.commissionCapco))}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(Number(enc.netProprietaire))}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="gap-1" onClick={() => onDownloadQuittance(enc)}>
                                                <Download className="h-3 w-3" />
                                                {isFull ? 'Quittance' : 'Reçu'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {encaissements.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-end gap-8">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total encaissé</p>
                            <p className="text-lg font-bold">{formatCurrency(totalLoyers)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total commissions</p>
                            <p className="text-lg font-bold text-warning">{formatCurrency(totalCommissions)}</p>
                        </div>
                    </div>
                )}

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nouvel encaissement</DialogTitle>
                            <DialogDescription>Enregistrez un paiement de loyer pour un lot</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Lot / Appartement</Label>
                                <Select value={lotId} onValueChange={setLotId}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner un lot" /></SelectTrigger>
                                    <SelectContent>
                                        {lots.map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.numero} - {l.locataireNom || 'Sans locataire'}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Mois concerné</Label>
                                <Select value={mois} onValueChange={setMois}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner le mois" /></SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.map(m => (
                                            <SelectItem key={m} value={m}>
                                                {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(m + '-01'))}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Montant encaissé (FCFA)</Label>
                                <Input type="number" value={montant} onChange={e => setMontant(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mode de paiement</Label>
                                <Select value={mode} onValueChange={setMode}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="VIREMENT">Virement</SelectItem>
                                        <SelectItem value="CHEQUE">Chèque</SelectItem>
                                        <SelectItem value="CASH">Espèces</SelectItem>
                                        <SelectItem value="WAVE">Wave</SelectItem>
                                        <SelectItem value="OM">Orange Money</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                            <Button onClick={handleSubmit} disabled={isLoading}>Enregistrer</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
