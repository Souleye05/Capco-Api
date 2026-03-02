import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Receipt, Wallet, Calendar, User, Info, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
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
        monthOptions.push({
            value: format(d, 'yyyy-MM'),
            label: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(format(d, 'yyyy-MM') + '-01'))
        });
    }

    return (
        <div className="bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="px-6 py-5 border-b border-border/10 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black tracking-tight">Paiements de loyers</h3>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Suivi des encaissements</p>
                    </div>
                </div>
                <Button onClick={() => setOpen(true)} className="h-10 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-black text-[10px] uppercase tracking-widest gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvel encaissement
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/10">
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 pl-6">Date</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70">Mois</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 text-right">Montant</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 text-right">Commission</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 text-right">Net</TableHead>
                            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 text-center pr-6">Preuve</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {encaissements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 px-6">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/20 mb-3">
                                        <Info className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-sm font-black tracking-tight">Aucun paiement trouvé</p>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Les encaissements s'afficheront ici</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            encaissements.map(enc => {
                                const lot = lots.find(l => l.id === enc.lotId);
                                const isFull = Number(enc.montantEncaisse) >= Number(lot?.loyerMensuelAttendu || 0);
                                return (
                                    <TableRow key={enc.id} className="hover:bg-primary/[0.02] border-b border-border/5 transition-colors group">
                                        <TableCell className="py-4 pl-6">
                                            <p className="font-bold text-sm">
                                                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.dateEncaissement))}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5 opacity-50">
                                                <User className="h-3 w-3" />
                                                <span className="text-[10px] font-bold truncate max-w-[120px]">{enc.locataireNom || lot?.locataireNom || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <Badge variant="outline" className="w-fit rounded-lg bg-background/50 border-border/40 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                                                    #{lot?.numero || 'N/A'}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase">
                                                    {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.moisConcerne + '-01'))}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <p className="font-black text-sm text-primary tracking-tight">{formatCurrency(Number(enc.montantEncaisse))}</p>
                                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">{enc.modePaiement}</span>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <p className="font-bold text-xs text-warning tracking-tight">{formatCurrency(Number(enc.commissionCapco))}</p>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <p className="font-black text-sm text-foreground tracking-tight">{formatCurrency(Number(enc.netProprietaire))}</p>
                                        </TableCell>
                                        <TableCell className="py-4 text-center pr-6">
                                            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all p-0" onClick={() => onDownloadQuittance(enc)} title={isFull ? 'Quittance' : 'Reçu'}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {encaissements.length > 0 && (
                <div className="px-6 py-6 bg-primary/[0.02] border-t border-border/10 flex flex-col sm:flex-row justify-end gap-10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total des encaissements</p>
                        <p className="text-2xl font-black tracking-tighter text-primary">{formatCurrency(totalLoyers)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total des commissions</p>
                        <p className="text-2xl font-black tracking-tighter text-warning">{formatCurrency(totalCommissions)}</p>
                    </div>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                    <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-primary/[0.03] to-transparent">
                        <DialogHeader>
                            <div className="flex items-center gap-2 text-primary/60 mb-1">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Saisie de paiement</span>
                            </div>
                            <DialogTitle className="text-xl font-black tracking-tight text-foreground">Nouvel encaissement</DialogTitle>
                            <DialogDescription className="text-xs font-medium opacity-60">Enregistrez un paiement de loyer pour un lot</DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-6 space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Unité concernée (Lot)</Label>
                            <div className="relative group">
                                <Badge className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none p-0 flex items-center justify-center bg-transparent shadow-none border-none">#</Badge>
                                <SearchableSelect
                                    value={lotId}
                                    onValueChange={setLotId}
                                    options={lots.map(l => ({
                                        value: l.id,
                                        label: `${l.numero} - ${l.locataireNom || 'Indisponible'}`
                                    }))}
                                    placeholder="Choisir l'unité..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Période du terme</Label>
                            <div className="relative group">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
                                <SearchableSelect
                                    value={mois}
                                    onValueChange={setMois}
                                    options={monthOptions}
                                    placeholder="Choisir le mois..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Montant versé (FCFA)</Label>
                            <div className="relative group">
                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                <Input
                                    type="number"
                                    value={montant}
                                    onChange={e => setMontant(e.target.value)}
                                    placeholder="Ex: 150000"
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-black focus:bg-background focus:ring-4 focus:ring-primary/5 shadow-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Mode de règlement</Label>
                            <div className="relative group">
                                <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
                                <SearchableSelect
                                    value={mode}
                                    onValueChange={setMode}
                                    options={[
                                        { value: "VIREMENT", label: "Virement" },
                                        { value: "CHEQUE", label: "Chèque" },
                                        { value: "CASH", label: "Espèces" },
                                        { value: "WAVE", label: "Wave" },
                                        { value: "OM", label: "Orange Money" }
                                    ]}
                                    placeholder="Choisir le mode..."
                                    className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-5 border-t border-border/10 bg-muted/5 flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all font-display">
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="rounded-xl h-10 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-black uppercase tracking-widest font-display">
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Enregistrer'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
