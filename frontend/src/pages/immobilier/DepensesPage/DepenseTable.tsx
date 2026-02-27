import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination-custom';

const TYPE_DEPENSE_LABELS: Record<string, string> = {
    PLOMBERIE_ASSAINISSEMENT: 'Plomberie – Assainissement',
    ELECTRICITE_ECLAIRAGE: 'Électricité – Éclairage',
    ENTRETIEN_MAINTENANCE: 'Entretien – Maintenance',
    SECURITE_GARDIENNAGE_ASSURANCE: 'Sécurité – Gardiennage – Assurance',
    AUTRES_DEPENSES: 'Autres dépenses',
};

const TYPE_DEPENSE_COLORS: Record<string, string> = {
    PLOMBERIE_ASSAINISSEMENT: 'bg-info/10 text-info border-info/20',
    ELECTRICITE_ECLAIRAGE: 'bg-warning/10 text-warning border-warning/20',
    ENTRETIEN_MAINTENANCE: 'bg-success/10 text-success border-success/20',
    SECURITE_GARDIENNAGE_ASSURANCE: 'bg-primary/10 text-primary border-primary/20',
    AUTRES_DEPENSES: 'bg-muted text-muted-foreground',
};

interface DepenseTableProps {
    data: any[];
    immeubleMap: Record<string, any>;
    isAdmin: boolean;
    onEdit: (d: any) => void;
    onDelete: (d: any) => void;
    isLoading: boolean;
    pagination?: any;
    onPageChange?: (page: number) => void;
}

export function DepenseTable({ data, immeubleMap, isAdmin, onEdit, onDelete, isLoading, pagination, onPageChange }: DepenseTableProps) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="text-center py-8 text-muted-foreground">Chargement...</CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-8 text-muted-foreground">Aucune dépense trouvée</CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Immeuble</TableHead>
                            <TableHead>Nature</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(d => {
                            const imm = immeubleMap[d.immeubleId];
                            return (
                                <TableRow key={d.id}>
                                    <TableCell>{format(new Date(d.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-medium">{imm?.nom || '—'}</TableCell>
                                    <TableCell>
                                        <div>
                                            <span>{d.nature}</span>
                                            {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={TYPE_DEPENSE_COLORS[d.typeDepense] || TYPE_DEPENSE_COLORS.AUTRES_DEPENSES}>
                                            {TYPE_DEPENSE_LABELS[d.typeDepense] || d.typeDepense}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-destructive">{Number(d.montant).toLocaleString('fr-FR')} FCFA</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(d)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {isAdmin && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(d)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
            {pagination && onPageChange && (
                <div className="p-4 border-t">
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </Card>
    );
}
