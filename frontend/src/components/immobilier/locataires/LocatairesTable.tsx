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
import { Phone, Mail, Eye, Edit, Users, Loader2 } from 'lucide-react';
import { type LocataireComplete } from '@/hooks/useLocataires';

interface LocatairesTableProps {
    locataires: LocataireComplete[];
    isLoading: boolean;
    onEdit: (locataire: LocataireComplete) => void;
    onDetail: (locataire: LocataireComplete) => void;
}

export function LocatairesTable({ locataires, isLoading, onEdit, onDetail }: LocatairesTableProps) {
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
        <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/10">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold py-4">Locataire</TableHead>
                        <TableHead className="font-bold py-4">Contact</TableHead>
                        <TableHead className="font-bold py-4">Profession</TableHead>
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
                            <TableCell className="text-right py-4">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                        onClick={() => onDetail(locataire)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl hover:bg-info/10 hover:text-info transition-all"
                                        onClick={() => onEdit(locataire)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
