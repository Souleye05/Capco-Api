import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface CommissionsTabProps {
    encaissements: any[];
    lots: any[];
    tauxCommission: number;
}

export function CommissionsTab({ encaissements, lots, tauxCommission }: CommissionsTabProps) {
    const totalCommissions = encaissements.reduce((sum, e) => sum + Number(e.commissionCapco), 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Commissions CAPCO encaissées</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-6 p-4 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Taux de commission appliqué</p>
                            <p className="text-3xl font-bold text-warning">{tauxCommission}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total commissions (période filtrée)</p>
                            <p className="text-3xl font-bold">{formatCurrency(totalCommissions)}</p>
                        </div>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date encaissement</TableHead>
                            <TableHead>Lot</TableHead>
                            <TableHead>Mois concerné</TableHead>
                            <TableHead className="text-right">Loyer encaissé</TableHead>
                            <TableHead className="text-right">Taux</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {encaissements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    Aucune commission trouvée
                                </TableCell>
                            </TableRow>
                        ) : (
                            encaissements.map(enc => {
                                const lot = lots.find(l => l.id === enc.lotId);
                                return (
                                    <TableRow key={enc.id}>
                                        <TableCell>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.dateEncaissement))}</TableCell>
                                        <TableCell><Badge variant="outline">{lot?.numero || 'N/A'}</Badge></TableCell>
                                        <TableCell>{new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.moisConcerne + '-01'))}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Number(enc.montantEncaisse))}</TableCell>
                                        <TableCell className="text-right">{tauxCommission}%</TableCell>
                                        <TableCell className="text-right font-medium text-warning">
                                            {formatCurrency(Number(enc.commissionCapco))}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
