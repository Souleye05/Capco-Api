import { useNavigate } from 'react-router-dom';
import { Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';
import { Pagination } from '@/components/ui/pagination-custom';
import { useState } from 'react';
import { EditEncaissementDialog } from './EditEncaissementDialog';

interface LoyersTableProps {
    encaissements: any[];
    pagination?: any;
    onPageChange?: (page: number) => void;
    onDelete?: (id: string) => Promise<any>;
    onUpdate?: (id: string, data: any) => Promise<any>;
}

export function LoyersTable({ encaissements, pagination, onPageChange, onDelete, onUpdate }: LoyersTableProps) {
    const navigate = useNavigate();
    const [selectedEnc, setSelectedEnc] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleEdit = (enc: any) => {
        setSelectedEnc(enc);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!onDelete) return;
        if (window.confirm('Voulez-vous vraiment supprimer cet encaissement ? cette action est irréversible.')) {
            await onDelete(id);
        }
    };

    return (
        <>
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-bold py-4">Date règlement</TableHead>
                            <TableHead className="font-bold py-4">Immeuble</TableHead>
                            <TableHead className="font-bold py-4 text-center">Lot</TableHead>
                            <TableHead className="font-bold py-4 text-center">Mois dû</TableHead>
                            <TableHead className="font-bold py-4 text-center">Mode</TableHead>
                            <TableHead className="font-bold py-4 text-right">Montant</TableHead>
                            <TableHead className="font-bold py-4 text-right">Commission</TableHead>
                            <TableHead className="font-bold py-4 text-right">Net</TableHead>
                            {(onDelete || onUpdate) && <TableHead className="font-bold py-4 text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {encaissements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground py-16">
                                    Aucun encaissement trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            encaissements.map(enc => (
                                <TableRow key={enc.id} className="hover:bg-muted/50 transition-colors group">
                                    <TableCell className="font-bold text-xs">
                                        {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.dateEncaissement))}
                                    </TableCell>
                                    <TableCell>
                                        <div
                                            className="flex items-center gap-2 font-black cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => navigate(`/immobilier/immeubles/${enc.lotId}`)}
                                        >
                                            <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                            {enc.immeubleNom}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-black border-border/50 bg-background">{enc.lotNumero}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                        {new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(enc.moisConcerne + '-01'))}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-bold border-none uppercase text-[9px] tracking-widest">{enc.modePaiement}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-black">
                                        {formatCurrency(enc.montantEncaisse)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-warning">
                                        {formatCurrency(enc.commissionCapco)}
                                    </TableCell>
                                    <TableCell className="text-right font-black text-info">
                                        {formatCurrency(enc.netProprietaire)}
                                    </TableCell>
                                    {(onDelete || onUpdate) && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/40 p-2">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-2 py-1.5">Options</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {onUpdate && (
                                                        <DropdownMenuItem onClick={() => handleEdit(enc)} className="rounded-lg gap-2 font-bold text-xs py-2.5">
                                                            <Pencil className="h-3.5 w-3.5" /> Modifier
                                                        </DropdownMenuItem>
                                                    )}
                                                    {onDelete && (
                                                        <DropdownMenuItem onClick={() => handleDelete(enc.id)} className="rounded-lg gap-2 font-bold text-xs py-2.5 text-destructive hover:bg-destructive/5">
                                                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
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

            {onUpdate && (
                <EditEncaissementDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    encaissement={selectedEnc}
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
}
