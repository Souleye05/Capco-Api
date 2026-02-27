import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Users, CheckCircle2, XCircle, Download
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
import { formatCurrency } from '@/lib/utils';
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Rapport de gestion détaillé</DialogTitle>
                </DialogHeader>

                {rapport && reportDetails && (
                    <div className="space-y-6 py-4">
                        {/* Header */}
                        <div className="text-center border-b pb-6">
                            <h2 className="text-2xl font-bold">CABINET CAPCO</h2>
                            <p className="text-muted-foreground">Rapport de gestion immobilière</p>
                        </div>

                        {/* Building info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Immeuble</h3>
                                <p className="font-medium text-lg">{rapport.immeubleNom}</p>
                                <p className="text-sm text-muted-foreground">{rapport.immeubleAdresse}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Propriétaire</h3>
                                <p className="font-medium text-lg">{rapport.proprietaireNom || rapport.immeubles?.proprietaires?.nom || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Période</h3>
                            <p className="font-medium">
                                Du {format(parseDateFromAPI(rapport.periodeDebut), 'dd MMMM yyyy', { locale: fr })} au {format(parseDateFromAPI(rapport.periodeFin), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                        </div>

                        <Separator />

                        <Tabs defaultValue="locataires" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="locataires" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    Locataires ({reportDetails.locatairesStatus.length})
                                </TabsTrigger>
                                <TabsTrigger value="depenses" className="gap-2">
                                    Dépenses
                                </TabsTrigger>
                                <TabsTrigger value="resume" className="gap-2">
                                    Résumé financier
                                </TabsTrigger>
                            </TabsList>

                            {/* Locataires Tab */}
                            <TabsContent value="locataires" className="space-y-4">
                                <div className="flex gap-4 mb-4">
                                    <Badge className="bg-success/10 text-success gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {reportDetails.totalPaid} payé(s)
                                    </Badge>
                                    <Badge className="bg-destructive/10 text-destructive gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {reportDetails.totalUnpaid} impayé(s)
                                    </Badge>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-medium">Locataire</th>
                                                <th className="text-left px-4 py-3 font-medium">Appartement</th>
                                                <th className="text-left px-4 py-3 font-medium">Loyer attendu</th>
                                                <th className="text-left px-4 py-3 font-medium">Montant payé</th>
                                                <th className="text-left px-4 py-3 font-medium">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportDetails.locatairesStatus.map((item, idx) => (
                                                <tr key={item.lot.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                                                    <td className="px-4 py-3 font-medium">{item.locataire?.nom || '-'}</td>
                                                    <td className="px-4 py-3">{item.lot.numero} ({item.lot.type})</td>
                                                    <td className="px-4 py-3">{formatCurrency(item.lot.loyerMensuelAttendu || item.lot.loyer_mensuel_attendu)}</td>
                                                    <td className="px-4 py-3">
                                                        {item.paiement ? formatCurrency(item.paiement.montantEncaisse || item.paiement.montant_encaisse) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {item.hasPaid ? (
                                                            <Badge className="bg-success/10 text-success gap-1">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Payé
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-destructive/10 text-destructive gap-1">
                                                                <XCircle className="h-3 w-3" />
                                                                Impayé
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>

                            {/* Dépenses Tab */}
                            <TabsContent value="depenses" className="space-y-4">
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-medium">Type de dépense</th>
                                                <th className="text-left px-4 py-3 font-medium">Désignation</th>
                                                <th className="text-left px-4 py-3 font-medium">Date</th>
                                                <th className="text-right px-4 py-3 font-medium">Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(reportDetails.expensesByType).map(([type, data]: [string, any]) => (
                                                <div key={`expenses-${type}`} className="contents">
                                                    {/* Type header */}
                                                    <tr key={`header-${type}`} className="bg-muted/30">
                                                        <td colSpan={3} className="px-4 py-2 font-semibold">
                                                            {typeDepenseLabels[type] || type}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-semibold">
                                                            {formatCurrency(data.total)}
                                                        </td>
                                                    </tr>
                                                    {/* Individual items */}
                                                    {data.items.map((dep, idx) => (
                                                        <tr key={dep.id} className={idx % 2 === 0 ? '' : 'bg-muted/10'}>
                                                            <td className="px-4 py-2 pl-8 text-muted-foreground">└</td>
                                                            <td className="px-4 py-2">{dep.nature}</td>
                                                            <td className="px-4 py-2">{format(parseDateFromAPI(dep.date), 'dd/MM/yyyy')}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(dep.montant)}</td>
                                                        </tr>
                                                    ))}
                                                </div>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/50 border-t-2">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 font-bold">TOTAL DES DÉPENSES</td>
                                                <td className="px-4 py-3 text-right font-bold text-destructive">
                                                    {formatCurrency(rapport.totalDepenses || rapport.total_depenses)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </TabsContent>

                            {/* Résumé financier Tab */}
                            <TabsContent value="resume" className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-3 px-4 border rounded-lg">
                                        <span className="font-medium">Loyers encaissés</span>
                                        <span className="text-lg font-semibold text-success">+{formatCurrency(rapport.totalLoyers || rapport.total_loyers)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 px-4 border rounded-lg">
                                        <span className="font-medium">Total des dépenses</span>
                                        <span className="text-lg font-semibold text-destructive">-{formatCurrency(rapport.totalDepenses || rapport.total_depenses)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 px-4 border rounded-lg">
                                        <span className="font-medium">Commission CAPCO ({rapport.tauxCommission || rapport.immeubles?.taux_commission_capco}%)</span>
                                        <span className="text-lg font-semibold text-immobilier">-{formatCurrency(rapport.totalCommissions || rapport.total_commissions)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center py-4 px-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                                        <span className="font-bold text-lg">Net à reverser au propriétaire</span>
                                        <span className="text-2xl font-bold">{formatCurrency(rapport.netProprietaire || rapport.net_proprietaire)}</span>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <Separator />

                        {/* Footer */}
                        <div className="text-center text-sm text-muted-foreground">
                            <p>Rapport généré le {format(parseDateFromAPI(rapport.dateGeneration || rapport.date_generation), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                            <p>Cabinet CAPCO - Gestion Immobilière</p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                    <Button onClick={() => rapport && onDownload(rapport)} className="gap-2">
                        <Download className="h-4 w-4" />
                        Télécharger PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
