import { useMemo } from 'react';
import {
    Users, CheckCircle2, XCircle, Download, Building2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, cn } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';

interface RapportPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rapport: any;
    lots: any[];
    encaissements: any[];
    depenses: any[];
    onDownload: (rapport: any) => void;
}

const typeDepenseLabels: Record<string, string> = {
    PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
    ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
    ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance générale',
    SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
    AUTRES_DEPENSES: 'Autres dépenses'
};

export function RapportPreviewDialog({ open, onOpenChange, rapport, lots, encaissements, depenses, onDownload }: RapportPreviewDialogProps) {
    const reportDetails = useMemo(() => {
        if (!rapport) return null;

        const immeubleLots = lots.filter(l => l.immeubleId === rapport.immeubleId);
        const immeubleEncaissements = encaissements.filter(e => {
            const lot = lots.find(l => l.id === e.lotId);
            return lot?.immeubleId === rapport.immeubleId;
        });
        const immeubleDepenses = depenses.filter(d => d.immeubleId === rapport.immeubleId);

        const paidLotIds = new Set(immeubleEncaissements.map(e => e.lotId));

        const locatairesStatus = immeubleLots.filter(l => l.statut === 'OCCUPE').map(lot => ({
            lot,
            locataire: lot.locataireNom ? { nom: lot.locataireNom } : null,
            hasPaid: paidLotIds.has(lot.id),
            paiement: immeubleEncaissements.find(e => e.lotId === lot.id)
        }));

        const expensesByType = immeubleDepenses.reduce((acc, dep) => {
            const type = dep.typeDepense;
            if (!acc[type]) {
                acc[type] = { total: 0, items: [] };
            }
            acc[type].total += dep.montant;
            acc[type].items.push(dep);
            return acc;
        }, {} as Record<string, { total: number; items: any[] }>);

        return {
            locatairesStatus,
            expensesByType,
            totalPaid: locatairesStatus.filter(l => l.hasPaid).length,
            totalUnpaid: locatairesStatus.filter(l => !l.hasPaid).length
        };
    }, [rapport, lots, encaissements, depenses]);

    if (!rapport || !reportDetails) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] p-0 flex flex-col">
                <DialogHeader className="p-8 pb-0">
                    <DialogTitle className="text-2xl font-black">Aperçu détaillé du rapport</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-muted/20 rounded-[28px] border border-border/30">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.2em]">
                                <Building2 className="h-3 w-3" /> Immeuble
                            </div>
                            <h2 className="text-2xl font-black">{rapport.immeubleNom}</h2>
                            <p className="font-bold text-muted-foreground">{rapport.immeubleAdresse}</p>
                        </div>
                        <div className="text-right md:text-right space-y-1">
                            <div className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground/60">Période de gestion</div>
                            <p className="text-lg font-black text-foreground">
                                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeDebut))}
                                <span className="mx-2 opacity-30 text-xs">—</span>
                                {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeFin))}
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="resume" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/30 p-1.5 rounded-2xl mb-8">
                            <TabsTrigger value="resume" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Résumé Financier</TabsTrigger>
                            <TabsTrigger value="locataires" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Encaissements</TabsTrigger>
                            <TabsTrigger value="depenses" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Dépenses</TabsTrigger>
                        </TabsList>

                        <TabsContent value="resume" className="space-y-4 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-[24px] border border-border/50 space-y-4">
                                    <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Recettes & Commissions</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between font-bold">
                                            <span>Encaissements loyers</span>
                                            <span className="text-success">+{formatCurrency(rapport.totalLoyers)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-immobilier">
                                            <span>Commissions Capco ({rapport.tauxCommission}%)</span>
                                            <span>-{formatCurrency(rapport.totalCommissions)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-[24px] border border-border/50 space-y-4">
                                    <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Charges & Net</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between font-bold text-destructive">
                                            <span>Charges immeuble</span>
                                            <span>-{formatCurrency(rapport.totalDepenses)}</span>
                                        </div>
                                        <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                                            <span className="font-black text-lg">NET PROPRIÉTAIRE</span>
                                            <span className="text-2xl font-black text-primary">{formatCurrency(rapport.netProprietaire)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="locataires" className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex gap-4">
                                <Badge className="bg-success text-success-foreground border-none font-bold py-1 px-3 rounded-lg flex gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> {reportDetails.totalPaid} payés
                                </Badge>
                                <Badge className="bg-destructive text-destructive-foreground border-none font-bold py-1 px-3 rounded-lg flex gap-2">
                                    <XCircle className="h-4 w-4" /> {reportDetails.totalUnpaid} impayés
                                </Badge>
                            </div>

                            <div className="border border-border/50 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b border-border/50">
                                        <tr>
                                            <th className="text-left px-5 py-4 font-black text-[11px] uppercase tracking-widest text-muted-foreground">Locataire / Lot</th>
                                            <th className="text-right px-5 py-4 font-black text-[11px] uppercase tracking-widest text-muted-foreground">Loyer HC</th>
                                            <th className="text-right px-5 py-4 font-black text-[11px] uppercase tracking-widest text-muted-foreground">Reçu</th>
                                            <th className="text-center px-5 py-4 font-black text-[11px] uppercase tracking-widest text-muted-foreground">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportDetails.locatairesStatus.map((item, idx) => (
                                            <tr key={item.lot.id} className={cn("border-b border-border/20 last:border-0", idx % 2 === 0 ? 'bg-background' : 'bg-muted/5')}>
                                                <td className="px-5 py-4">
                                                    <div className="font-black">{item.locataire?.nom || 'Inoccupé'}</div>
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{item.lot.numero} ({item.lot.type})</div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-muted-foreground">{formatCurrency(item.lot.loyerMensuelAttendu)}</td>
                                                <td className="px-5 py-4 text-right font-black">
                                                    {item.paiement ? formatCurrency(item.paiement.montantEncaisse) : '—'}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {item.hasPaid ? (
                                                        <Badge className="bg-success/10 text-success border-none font-bold text-[10px]">PAYÉ</Badge>
                                                    ) : (
                                                        <Badge className="bg-destructive/10 text-destructive border-none font-bold text-[10px]">IMPAYÉ</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="depenses" className="space-y-6 animate-in fade-in duration-300">
                            <div className="border border-border/50 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b border-border/50">
                                        <tr>
                                            <th className="text-left px-5 py-4 font-black text-[11px] uppercase tracking-widest text-muted-foreground text-left">Désignation</th>
                                            <th className="text-center px-5 py-4 font-black text-[11px] uppercase tracking-widest text-muted-foreground">Date</th>
                                            <th className="text-right px-5 py-4 font-black text-[11px] uppercase tracking-widest text-muted-foreground">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(reportDetails.expensesByType).map(([type, data]: [string, any]) => (
                                            <div key={type} className="contents">
                                                <tr className="bg-muted/20">
                                                    <td colSpan={2} className="px-5 py-2 font-black text-xs uppercase tracking-wider text-primary">{typeDepenseLabels[type] || type}</td>
                                                    <td className="px-5 py-2 text-right font-black text-primary">{formatCurrency(data.total)}</td>
                                                </tr>
                                                {data.items.map((dep, idx) => (
                                                    <tr key={dep.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                                                        <td className="px-5 py-3 pl-8">
                                                            <div className="font-bold">{dep.nature}</div>
                                                            <div className="text-[10px] text-muted-foreground line-clamp-1">{dep.description}</div>
                                                        </td>
                                                        <td className="px-5 py-3 text-center font-medium text-muted-foreground">
                                                            {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(dep.date))}
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-bold">{formatCurrency(dep.montant)}</td>
                                                    </tr>
                                                ))}
                                            </div>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <Separator className="opacity-50" />

                <DialogFooter className="p-8 gap-3 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-12">Fermer</Button>
                    <Button onClick={() => onDownload(rapport)} className="rounded-xl font-black h-12 px-8 bg-primary shadow-lg shadow-primary/20 gap-2">
                        <Download className="h-4 w-4" /> Version PDF Imprimable
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
