import { useNavigate } from 'react-router-dom';
import { Home, Building2, Check, X, MoreHorizontal, Eye, Edit } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatCurrency } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination-custom';

interface LotsTableProps {
    lots: any[];
    onEdit: (lot: any) => void;
    pagination?: any;
    onPageChange?: (page: number) => void;
}

export function LotsTable({ lots, onEdit, pagination, onPageChange }: LotsTableProps) {
    const navigate = useNavigate();

    return (
        <>
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-bold py-4">Lot</TableHead>
                            <TableHead className="font-bold py-4">Immeuble</TableHead>
                            <TableHead className="font-bold py-4 text-center">Type</TableHead>
                            <TableHead className="font-bold py-4 text-center">Étage</TableHead>
                            <TableHead className="font-bold py-4 text-right">Loyer mensuel</TableHead>
                            <TableHead className="font-bold py-4 text-center">Statut</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lots.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                                    Aucun lot trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            lots.map(lot => (
                                <TableRow key={lot.id} className="group hover:bg-muted/50 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                <Home className="h-4 w-4" />
                                            </div>
                                            <span className="font-black text-foreground">{lot.numero}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div
                                            className="flex items-center gap-2 font-bold cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => navigate(`/immobilier/immeubles/${lot.immeubleId}`)}
                                        >
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            {lot.immeubleNom || lot.immeuble?.nom}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-bold border-border/50 uppercase text-[10px] tracking-widest">{lot.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-muted-foreground">{lot.etage || '-'}</TableCell>
                                    <TableCell className="text-right font-black">
                                        {formatCurrency(lot.loyerMensuelAttendu)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={cn(
                                            "font-bold py-0.5 px-3 uppercase text-[10px] tracking-widest",
                                            lot.statut === 'OCCUPE'
                                                ? 'bg-success/10 text-success border-success/20'
                                                : 'bg-warning/10 text-warning border-warning/20'
                                        )}>
                                            {lot.statut === 'OCCUPE' ? <Check className="h-3 w-3 mr-1.5" /> : <X className="h-3 w-3 mr-1.5" />}
                                            {lot.statut}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem
                                                    className="gap-2 font-bold"
                                                    onClick={() => navigate(`/immobilier/immeubles/${lot.immeubleId}`)}
                                                >
                                                    <Eye className="h-4 w-4" /> Voir immeuble
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 font-bold"
                                                    onClick={() => onEdit(lot)}
                                                >
                                                    <Edit className="h-4 w-4" /> Modifier
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {pagination && onPageChange && (
                <div className="mt-4 flex justify-center p-4 border-t border-border/50">
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </>
    );
}
