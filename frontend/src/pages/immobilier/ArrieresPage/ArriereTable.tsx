import React, { Fragment } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Pencil, Trash2, CreditCard } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination-custom';

const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
const MODE_LABELS: Record<string, string> = { CASH: 'Espèces', VIREMENT: 'Virement', CHEQUE: 'Chèque', WAVE: 'Wave', OM: 'Orange Money' };

interface ArriereTableProps {
    data: any[];
    isAdmin: boolean;
    expandedRow: string | null;
    onExpand: (id: string | null) => void;
    onEdit: (a: any) => void;
    onDelete: (id: string) => void;
    onPay: (id: string) => void;
    pagination?: any;
    onPageChange?: (page: number) => void;
}

export function ArriereTable({ data, isAdmin, expandedRow, onExpand, onEdit, onDelete, onPay, pagination, onPageChange }: ArriereTableProps) {
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Immeuble</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead>Locataire</TableHead>
                        <TableHead className="text-right">Dû</TableHead>
                        <TableHead className="text-right">Payé</TableHead>
                        <TableHead className="text-right">Restant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(a => (
                        <Fragment key={a.id}>
                            <TableRow className="cursor-pointer hover:bg-muted/30" onClick={() => onExpand(expandedRow === a.id ? null : a.id)}>
                                <TableCell className="w-8">{a.paiementsPartiels.length > 0 ? (expandedRow === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}</TableCell>
                                <TableCell className="font-medium">{a.immeubleNom}</TableCell>
                                <TableCell>{a.lotNumero}</TableCell>
                                <TableCell>{a.locataireNom}</TableCell>
                                <TableCell className="text-right text-destructive font-semibold">{formatFCFA(Number(a.montantDu))}</TableCell>
                                <TableCell className="text-right text-success font-medium">{formatFCFA(a.totalPaye)}</TableCell>
                                <TableCell className="text-right text-warning font-bold">{formatFCFA(a.solde)}</TableCell>
                                <TableCell>
                                    {a.solde <= 0 ? (
                                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 uppercase text-[10px] font-bold">Soldé</Badge>
                                    ) : a.totalPaye > 0 ? (
                                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 uppercase text-[10px] font-bold">Partiel</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="uppercase text-[10px] font-bold">Impayé</Badge>
                                    )}
                                </TableCell>
                                <TableCell onClick={e => e.stopPropagation()}>
                                    <div className="flex gap-1 justify-end">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(a)}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        {isAdmin && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(a.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>}
                                        {a.solde > 0 && <Button size="sm" variant="outline" className="h-8" onClick={() => onPay(a.id)}>
                                            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                                            Payer
                                        </Button>}
                                    </div>
                                </TableCell>
                            </TableRow>
                            {expandedRow === a.id && a.paiementsPartiels.length > 0 && (
                                <TableRow className="bg-muted/20">
                                    <TableCell colSpan={9} className="p-4">
                                        <div className="space-y-2 text-xs">
                                            <p className="font-semibold text-muted-foreground uppercase tracking-wider">Paiements historisés</p>
                                            <div className="bg-background rounded border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Mode</TableHead>
                                                            <TableHead className="text-right">Montant</TableHead>
                                                            <TableHead className="text-right">Comm. ({a.tauxCommission}%)</TableHead>
                                                            <TableHead>Note</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>{a.paiementsPartiels.map((p: any) => (
                                                        <TableRow key={p.id}>
                                                            <TableCell>{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                                                            <TableCell>{MODE_LABELS[p.mode] || p.mode}</TableCell>
                                                            <TableCell className="text-right font-medium">{formatFCFA(Number(p.montant))}</TableCell>
                                                            <TableCell className="text-right text-primary">{formatFCFA(p.montant * (a.tauxCommission / 100))}</TableCell>
                                                            <TableCell className="text-muted-foreground italic">{p.commentaire || '—'}</TableCell>
                                                        </TableRow>
                                                    ))}</TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
            {pagination && onPageChange && (
                <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
}
