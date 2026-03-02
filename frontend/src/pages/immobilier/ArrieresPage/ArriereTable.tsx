import React, { Fragment } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronDown,
    ChevronUp,
    Pencil,
    Trash2,
    CreditCard,
    MoreHorizontal,
    LayoutGrid,
    History
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
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
        <div className="border border-border/40 rounded-2xl bg-background/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-foreground/5">
            <Table>
                <TableHeader className="bg-muted/30 border-b border-border/40">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Immeuble</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Lot</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Locataire</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Dû</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Payé</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Restant</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Statut</TableHead>
                        <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 py-5">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map(a => (
                        <Fragment key={a.id}>
                            <TableRow
                                className="group cursor-pointer border-border/5 hover:bg-muted/40 transition-all duration-300"
                                onClick={() => onExpand(expandedRow === a.id ? null : a.id)}
                            >
                                <TableCell className="w-12 py-5">
                                    {a.paiementsPartiels.length > 0 ? (
                                        <div className="flex items-center justify-center h-7 w-7 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-all shadow-sm">
                                            {expandedRow === a.id ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7" />
                                    )}
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-black text-sm tracking-tight text-foreground">{a.immeubleNom}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{a.immeubleRef || 'REF-N/A'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-5">
                                    <Badge variant="outline" className="rounded-lg bg-background border-border/60 font-black text-[11px] px-2.5 py-1 shadow-sm">
                                        {a.lotNumero}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-5">
                                    <span className="text-sm font-bold text-foreground/70">{a.locataireNom}</span>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap py-5">
                                    <span className="text-sm font-black text-slate-600/80">{formatFCFA(Number(a.montantDu))}</span>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap py-5">
                                    <span className="text-sm font-black text-success">{formatFCFA(a.totalPaye)}</span>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap py-5">
                                    <span className="text-sm font-black text-destructive">
                                        {formatFCFA(a.solde)}
                                    </span>
                                </TableCell>
                                <TableCell className="py-5">
                                    {a.solde <= 0 ? (
                                        <Badge className="bg-success/10 text-success border-none rounded-xl font-black text-[9px] uppercase tracking-wider px-3 h-7 shadow-none">Soldé</Badge>
                                    ) : a.totalPaye > 0 ? (
                                        <Badge className="bg-orange-500/10 text-orange-600 border-none rounded-xl font-black text-[9px] uppercase tracking-wider px-3 h-7 shadow-none">Partiel</Badge>
                                    ) : (
                                        <Badge className="bg-destructive/10 text-destructive border-none rounded-xl font-black text-[9px] uppercase tracking-wider px-3 h-7 shadow-none">Impayé</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="py-5 text-right" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl">
                                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-border/40" />
                                            {a.solde > 0 && (
                                                <DropdownMenuItem
                                                    onClick={() => onPay(a.id)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-primary/10 text-primary transition-all group"
                                                >
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <CreditCard className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase tracking-wide">Encaisser</span>
                                                        <span className="text-[9px] font-medium opacity-60 italic">Régler l'arriéré</span>
                                                    </div>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => onEdit(a)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 transition-all group"
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:scale-110 transition-transform text-foreground">
                                                    <Pencil className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">Modifier</span>
                                                    <span className="text-[9px] font-medium opacity-60">Éditer les détails</span>
                                                </div>
                                            </DropdownMenuItem>
                                            {isAdmin && (
                                                <>
                                                    <DropdownMenuSeparator className="bg-border/40" />
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(a.id)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-destructive/10 text-destructive transition-all group"
                                                    >
                                                        <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Trash2 className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold">Supprimer</span>
                                                            <span className="text-[9px] font-medium opacity-60">Action irréversible</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            {expandedRow === a.id && a.paiementsPartiels.length > 0 && (
                                <TableRow className="bg-muted/10 border-none hover:bg-transparent">
                                    <TableCell colSpan={9} className="p-8">
                                        <div className="space-y-4 animate-in slide-in-from-top-3 duration-500 fill-mode-both">
                                            <div className="flex items-center gap-3 text-primary">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-md shadow-primary/20" />
                                                <span className="font-black text-[11px] uppercase tracking-[0.25em]">Historique détaillé des encaissements</span>
                                            </div>
                                            <div className="bg-background/80 backdrop-blur-md rounded-3xl border border-border/40 overflow-hidden shadow-2xl shadow-foreground/5">
                                                <Table>
                                                    <TableHeader className="bg-muted/20">
                                                        <TableRow className="border-none">
                                                            <TableHead className="text-[9px] font-black uppercase tracking-wider py-4">Date</TableHead>
                                                            <TableHead className="text-[9px] font-black uppercase tracking-wider py-4">Mode</TableHead>
                                                            <TableHead className="text-right text-[9px] font-black uppercase tracking-wider py-4">Montant</TableHead>
                                                            <TableHead className="text-right text-[9px] font-black uppercase tracking-wider py-4">Commission ({a.tauxCommission}%)</TableHead>
                                                            <TableHead className="text-[9px] font-black uppercase tracking-wider py-4 pl-8">Note de règlement</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {a.paiementsPartiels.map((p: any) => (
                                                            <TableRow key={p.id} className="border-border/5 hover:bg-muted/20 transition-colors">
                                                                <TableCell className="font-bold text-xs py-4">{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="rounded-xl bg-background border-border/60 font-black text-[10px] px-3 py-1 text-foreground/70">
                                                                        {MODE_LABELS[p.mode] || p.mode}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right font-black text-success text-xs py-4">{formatFCFA(Number(p.montant))}</TableCell>
                                                                <TableCell className="text-right text-primary font-black text-xs py-4">{formatFCFA(p.montant * (a.tauxCommission / 100))}</TableCell>
                                                                <TableCell className="text-muted-foreground/60 italic text-[11px] py-4 pl-8 font-medium">
                                                                    {p.commentaire || 'Aucun commentaire renseigné'}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
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
                <div className="p-6 border-t border-border/40 bg-muted/10">
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
}
