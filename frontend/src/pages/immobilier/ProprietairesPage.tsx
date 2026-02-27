import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/pagination-custom';
import { useProprietaires, useDeleteProprietaire, Proprietaire } from '@/hooks/useImmobilier';
import { NouveauProprietaireDialog } from '@/components/dialogs/NouveauProprietaireDialog';
import { EditProprietaireDialog } from '@/components/dialogs/EditProprietaireDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProprietairesPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNouveauProprietaire, setShowNouveauProprietaire] = useState(false);
    const [editingProprietaire, setEditingProprietaire] = useState<Proprietaire | null>(null);

    const { data: proprietairesResult, isLoading } = useProprietaires({
        page,
        limit: 10,
        search: searchQuery || undefined
    });

    const deleteProprietaire = useDeleteProprietaire();

    const proprietaires = proprietairesResult?.data || [];
    const pagination = proprietairesResult?.pagination;

    const handleDelete = async (id: string, nom: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le propriétaire ${nom} ?`)) {
            deleteProprietaire.mutate(id);
        }
    };

    return (
        <div className="min-h-screen pb-12">
            <Header
                title="Gestion des Propriétaires"
                subtitle={`${pagination?.total || 0} propriétaires enregistrés`}
                actions={
                    <div className="flex gap-3">
                        <Button className="gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20" onClick={() => setShowNouveauProprietaire(true)}>
                            <Plus className="h-4 w-4" />
                            Nouveau propriétaire
                        </Button>
                    </div>
                }
            />

            <div className="p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative max-w-md mb-8 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Rechercher par nom, email ou téléphone..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="pl-11 h-12 rounded-2xl border-border/50 bg-background shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="py-4">Nom complet / Raison sociale</TableHead>
                                        <TableHead className="py-4">Contact</TableHead>
                                        <TableHead className="py-4">Immeubles</TableHead>
                                        <TableHead className="py-4">Date d'ajout</TableHead>
                                        <TableHead className="py-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-40 mb-2" /><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : proprietaires.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                Aucun propriétaire trouvé.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        proprietaires.map((prop) => (
                                            <TableRow key={prop.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-medium text-foreground py-4">
                                                    {prop.nom}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        {prop.email && <div className="text-sm font-medium">{prop.email}</div>}
                                                        {prop.telephone && <div className="text-xs text-muted-foreground">{prop.telephone}</div>}
                                                        {!prop.email && !prop.telephone && <span className="text-muted-foreground italic">Non renseigné</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="font-medium text-primary bg-primary/10 w-fit px-2 py-1 rounded-md">
                                                        {prop.nombreImmeubles || 0} immeuble(s)
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-muted-foreground">
                                                    {new Date(prop.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => setEditingProprietaire(prop)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleDelete(prop.id, prop.nom)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            <NouveauProprietaireDialog
                open={showNouveauProprietaire}
                onOpenChange={setShowNouveauProprietaire}
            />

            {editingProprietaire && (
                <EditProprietaireDialog
                    open={!!editingProprietaire}
                    onOpenChange={(open) => !open && setEditingProprietaire(null)}
                    proprietaire={editingProprietaire}
                />
            )}
        </div>
    );
}
