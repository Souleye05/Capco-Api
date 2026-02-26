import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Banknote, Landmark, CreditCard, ArrowUpRight,
    Wallet, FileText, User, Building2, ExternalLink, MoreVertical, Edit, Trash2
} from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from '@/lib/utils';
import { formatDate, formatTimeUTC, parseDateFromAPI } from '@/lib/date-utils';
import { formatDate, formatTimeUTC, parseDateFromAPI } from '@/lib/date-utils';
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

export const PaiementRow = ({ paiement, onEdit, onDelete }: { paiement: PaiementRecouvrement, onEdit?: (p: PaiementRecouvrement) => void, onDelete?: (p: PaiementRecouvrement) => void }) => {
    const navigate = useNavigate();
    const dateObj = parseDateFromAPI(paiement.date);

    return (
        <TableRow className="group hover:bg-slate-50/50 transition-colors border-slate-100">
            <TableCell className="pl-6">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{formatDate(dateObj)}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{formatTimeUTC(dateObj)}</span>
                </div>
            </TableCell>

            <TableCell>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-primary/50" />
                        <span className="text-sm font-black text-slate-900">{paiement.dossierReference}</span>
                    </div>
                    {paiement.reference && (
                        <span className="text-[10px] text-slate-400 font-bold ml-4.5 bg-slate-100/50 w-fit px-1.5 rounded uppercase">Ref: {paiement.reference}</span>
                    )}
                </div>
            </TableCell>

            <TableCell>
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><User className="h-2.5 w-2.5 text-slate-500" /></div>
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{paiement.debiteurNom}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Building2 className="h-2.5 w-2.5 text-slate-500" /></div>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{paiement.creancierNom}</span>
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <Badge variant="secondary" className="bg-slate-100/50 text-slate-600 border-none shadow-none font-bold text-[10px] px-2 py-0.5 flex items-center gap-1.5 w-fit uppercase">
                    {modeIcons[paiement.mode] || modeIcons.DEFAULT}
                    {modeLabels[paiement.mode] || paiement.mode}
                </Badge>
            </TableCell>

            <TableCell className="text-right">
                <span className="text-sm font-black text-success tabular-nums">{formatCurrency(paiement.montant)}</span>
            </TableCell>

            <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                        onClick={() => navigate(`/recouvrement/dossiers/${paiement.dossierId}`)}
                        title="Voir le dossier"
                    >
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                    </Button>

                    {(onEdit || onDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 border-none shadow-xl">
                                {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(paiement)}>
                                        <Edit className="h-4 w-4 mr-2 text-slate-500" />
                                        <span>Modifier</span>
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem onClick={() => onDelete(paiement)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        <span>Supprimer</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
};
