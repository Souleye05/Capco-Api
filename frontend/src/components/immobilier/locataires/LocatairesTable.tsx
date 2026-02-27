import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Eye, Edit, Users, Loader2, Home } from 'lucide-react';
import { type LocataireComplete } from '@/hooks/useLocataires';
import { LocataireQuickActions } from './LocataireQuickActions';
import { Pagination } from '@/components/ui/pagination-custom';

interface LocatairesTableProps {
    locataires: LocataireComplete[];
    isLoading: boolean;
    onEdit: (locataire: LocataireComplete) => void;
    onDetail: (locataire: LocataireComplete) => void;
    pagination?: any;
    onPageChange?: (page: number) => void;
}

export function LocatairesTable({ locataires, isLoading, onEdit, onDetail, pagination, onPageChange }: LocatairesTableProps) {
    if (isLoading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Chargement des données...</p>
            </div>
        );
    }

    if (locataires.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-2 p-12">
                <Users className="h-12 w-12 text-muted-foreground opacity-20" />
                <p className="text-lg font-bold text-muted-foreground">Aucun locataire trouvé</p>
                <p className="text-sm text-muted-foreground">Essayez d'ajuster vos filtres de recherche.</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/10">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-bold py-4">Locataire</TableHead>
                            <TableHead className="font-bold py-4">Contact</TableHead>
                            <TableHead className="font-bold py-4">Profession</TableHead>
                            <TableHead className="font-bold py-4 text-center">Lots</TableHead>
                            <TableHead className="font-bold py-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locataires.map(locataire => (
                            <TableRow key={locataire.id} className="hover:bg-background transition-colors group">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-11 w-11 rounded-[14px] bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                                            {locataire.nom[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground">{locataire.nom}</p>
                                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{locataire.adresse || 'Pas d\'adresse'}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1.5 font-medium">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3 text-primary" />
                                            {locataire.telephone || <span className="italic opacity-30">Non renseigné</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3 text-primary" />
                                            {locataire.email || <span className="italic opacity-30">Non renseigné</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge label={locataire.profession || 'Non renseigné'} variant={locataire.profession ? "info" : "muted"} />
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Badge variant={locataire.nombreLots > 0 ? "default" : "secondary"} className="text-xs">
                                            <Home className="h-3 w-3 mr-1" />
                                            {locataire.nombreLots}
                                        </Badge>
                                        {locataire.nombreBauxActifs > 0 && (
                                            <Badge variant="success" className="text-xs">
                                                {locataire.nombreBauxActifs} bail{locataire.nombreBauxActifs > 1 ? 'x' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right py-4">
                                    <LocataireQuickActions
                                        locataire={locataire}
                                        onView={onDetail}
                                        onEdit={onEdit}
                                        onAssignLot={(loc) => console.log('Assign lot to:', loc.nom)}
                                        onViewPayments={(loc) => console.log('View payments for:', loc.nom)}
                                        onViewDocuments={(loc) => console.log('View documents for:', loc.nom)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
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
