import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, XCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';
import { type LoyerAttendu } from '@/hooks/useImpayesPage';

interface ImpayesTableProps {
    loyers: LoyerAttendu[];
    onPaiement: (loyer: LoyerAttendu) => void;
}

export function ImpayesTable({ loyers, onPaiement }: ImpayesTableProps) {
    const navigate = useNavigate();

    return (
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold py-4">Immeuble</TableHead>
                        <TableHead className="font-bold py-4 text-center">Lot</TableHead>
                        <TableHead className="font-bold py-4">Locataire</TableHead>
                        <TableHead className="font-bold py-4 text-center">Mois</TableHead>
                        <TableHead className="font-bold py-4 text-right">Loyer attendu</TableHead>
                        <TableHead className="font-bold py-4 text-center">Statut</TableHead>
                        <TableHead className="font-bold py-4 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loyers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                                Aucun loyer correspondant aux critères
                            </TableCell>
                        </TableRow>
                    ) : (
                        loyers.map(loyer => (
                            <TableRow
                                key={loyer.id}
                                className={cn(
                                    "group transition-colors",
                                    loyer.statut === 'IMPAYE' ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'
                                )}
                            >
                                <TableCell className="py-4">
                                    <div
                                        className="flex items-center gap-2 font-bold cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => navigate(`/immobilier/immeubles/${loyer.immeubleId}`)}
                                    >
                                        <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                        {loyer.immeubleNom}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="font-black bg-background border-border/50">{loyer.lotNumero}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{loyer.locataireNom}</TableCell>
                                <TableCell className="text-center uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                    {new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(loyer.mois + '-01'))}
                                </TableCell>
                                <TableCell className="text-right font-black">
                                    {formatCurrency(loyer.montantAttendu)}
                                </TableCell>
                                <TableCell className="text-center">
                                    {loyer.statut === 'PAYE' ? (
                                        <Badge className="bg-success text-success-foreground border-none font-bold py-0.5 px-2">
                                            <CheckCircle className="h-3 w-3 mr-1.5" />
                                            Payé
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="font-bold py-0.5 px-2">
                                            <XCircle className="h-3 w-3 mr-1.5" />
                                            Impayé
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {loyer.statut === 'IMPAYE' && (
                                        <Button
                                            size="sm"
                                            className="font-bold rounded-xl bg-primary hover:shadow-lg shadow-primary/20 transition-all"
                                            onClick={() => onPaiement(loyer)}
                                        >
                                            Encaisser
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
