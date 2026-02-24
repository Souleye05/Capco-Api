import { useNavigate } from 'react-router-dom';
import {
    Banknote, Landmark, CreditCard, ArrowUpRight,
    Wallet, FileText, User, Building2, ExternalLink
} from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { PaiementRecouvrement } from '@/hooks/useRecouvrement';

const modeIcons: Record<string, React.ReactNode> = {
    CASH: <Banknote className="h-4 w-4 text-success" />,
    VIREMENT: <Landmark className="h-4 w-4 text-primary" />,
    CHEQUE: <CreditCard className="h-4 w-4 text-warning" />,
    WAVE: <ArrowUpRight className="h-4 w-4 text-cyan-500" />,
    OM: <ArrowUpRight className="h-4 w-4 text-orange-500" />,
    DEFAULT: <Wallet className="h-4 w-4 text-slate-400" />
};

const modeLabels: Record<string, string> = {
    CASH: 'Espèces',
    VIREMENT: 'Virement',
    CHEQUE: 'Chèque',
    WAVE: 'Wave',
    OM: 'Orange Money'
};

export const PaiementRow = ({ paiement }: { paiement: PaiementRecouvrement }) => {
    const navigate = useNavigate();
    const dateObj = new Date(paiement.date);

    return (
        <TableRow className="group hover:bg-slate-50 transition-colors border-slate-50">
            <TableCell className="pl-6">
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{dateObj.toLocaleDateString()}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </TableCell>

            <TableCell>
                <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="text-[10px] font-bold text-recouvrement bg-recouvrement/10 hover:bg-recouvrement/20 border-none w-fit shadow-none">
                        <FileText className="h-3 w-3 mr-1" /> {paiement.dossierReference}
                    </Badge>
                    {paiement.reference && <span className="text-[10px] text-slate-400">Réf: {paiement.reference}</span>}
                </div>
            </TableCell>

            <TableCell>
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        <User className="h-3 w-3 text-warning" /> {paiement.debiteurNom}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium italic">
                        <Building2 className="h-2 w-2" /> {paiement.creancierNom}
                    </span>
                </div>
            </TableCell>

            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                        {modeIcons[paiement.mode] || modeIcons.DEFAULT}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-tight">{modeLabels[paiement.mode] || paiement.mode}</span>
                </div>
            </TableCell>

            <TableCell>
                <span className="text-base font-black text-success">
                    {formatCurrency(paiement.montant)}
                </span>
            </TableCell>

            <TableCell className="text-right pr-6">
                <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                    onClick={() => navigate(`/recouvrement/dossiers/${paiement.dossierId}`)}
                >
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                </Button>
            </TableCell>
        </TableRow>
    );
};
