import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit, Trash2, Home, Mail, Phone, Calendar,
    ArrowRight, UserPlus, MoreVertical, Filter, X, Building2, ArrowUpDown
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/pagination-custom';
import { useProprietaires, useDeleteProprietaire, Proprietaire } from '@/hooks/useImmobilier';
import { NouveauProprietaireDialog } from '@/components/dialogs/NouveauProprietaireDialog';
import { EditProprietaireDialog } from '@/components/dialogs/EditProprietaireDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function ProprietairesPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNouveauProprietaire, setShowNouveauProprietaire] = useState(false);
    const [editingProprietaire, setEditingProprietaire] = useState<Proprietaire | null>(null);

    // Filter State
    const [filters, setFilters] = useState({
        hasImmeubles: false,
        sortBy: 'recent' as string
    });

    // Handle sort mapping
    const sortParams = (() => {
        switch (filters.sortBy) {
            case 'recent': return { sortBy: 'createdAt', sortOrder: 'desc' as const };
            case 'oldest': return { sortBy: 'createdAt', sortOrder: 'asc' as const };
            case 'name': return { sortBy: 'nom', sortOrder: 'asc' as const };
            default: return { sortBy: 'createdAt', sortOrder: 'desc' as const };
        }
    })();

    const { data: proprietairesResult, isLoading } = useProprietaires({
        page,
        limit: 10,
        search: searchQuery || undefined,
        ...sortParams,
        withImmeublesOnly: filters.hasImmeubles ? 'true' : undefined
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
        <div className="min-h-screen pb-20 bg-background/50 backdrop-blur-3xl">
            <Header
                title={
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-primary/10 text-primary hidden sm:block">
                            <Home className="h-5 w-5" />
                        </div>
                        <span className="font-black text-xl">Propriétaires</span>
                    </div>
                }
                subtitle={null}
                actions={
                    <Button
                        onClick={() => setShowNouveauProprietaire(true)}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4 flex items-center gap-2 shadow-md shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="font-bold">Nouveau</span>
                    </Button>
                }
            />

            <div className="px-4 lg:px-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-2">
                {/* Search & Filter Bar - Compact */}
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="search"
                            placeholder="Rechercher par nom..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-xl border-border/40 bg-background/50 backdrop-blur-md focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <SearchableSelect
                            value={filters.hasImmeubles ? 'only' : 'all'}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, hasImmeubles: val === 'only' }))}
                            options={[
                                { value: "all", label: "Tous les immeubles" },
                                { value: "only", label: "Avec immeubles" }
                            ]}
                            placeholder="Immeubles"
                            className="h-10 w-[160px] rounded-xl border-border/40 bg-background/50 backdrop-blur-md text-xs font-semibold"
                        />

                        <SearchableSelect
                            value={filters.sortBy}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
                            options={[
                                { value: "recent", label: "Plus récent" },
                                { value: "oldest", label: "Plus ancien" },
                                { value: "name", label: "Nom (A-Z)" }
                            ]}
                            placeholder="Trier par"
                            className="h-10 w-[140px] rounded-xl border-border/40 bg-background/50 backdrop-blur-md text-xs font-semibold ml-2"
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid gap-4 lg:gap-6">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="border-border/30 bg-background/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-3xl">
                                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                                    <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                                    <div className="flex-1 space-y-3 w-full">
                                        <Skeleton className="h-6 w-1/3" />
                                        <Skeleton className="h-4 w-1/4" />
                                    </div>
                                    <Skeleton className="h-10 w-32 rounded-xl hidden md:block" />
                                </CardContent>
                            </Card>
                        ))
                    ) : proprietaires.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="h-32 w-32 rounded-full bg-muted/30 flex items-center justify-center">
                                <UserPlus className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">Aucun propriétaire</h3>
                                <p className="text-muted-foreground max-w-sm">Commencez par ajouter votre premier partenaire immobilier pour gérer vos immeubles.</p>
                            </div>
                            <Button onClick={() => setShowNouveauProprietaire(true)} variant="outline" className="rounded-2xl px-8 h-12">
                                Ajouter maintenant
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Header style for desktop */}
                            <div className="hidden md:grid grid-cols-12 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                <div className="col-span-5">Nom & Coordonnées</div>
                                <div className="col-span-3">Portefeuille</div>
                                <div className="col-span-2">Date d'adhésion</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {proprietaires.map((prop, idx) => (
                                <Card
                                    key={prop.id}
                                    className={cn(
                                        "group border-border/30 bg-background/40 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/5 overflow-hidden cursor-pointer",
                                        "animate-in fade-in slide-in-from-bottom-4"
                                    )}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                    onClick={() => navigate(`/immobilier/proprietaires/${prop.id}`)}
                                >
                                    <CardContent className="px-3 py-1.5 md:px-5 md:py-2 grid grid-cols-1 md:grid-cols-12 items-center gap-3">
                                        <div className="col-span-1 md:col-span-5 flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                {prop.nom.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {prop.nom}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                                    {prop.email && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            {prop.email}
                                                        </span>
                                                    )}
                                                    {prop.telephone && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            {prop.telephone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                                                    <Home className="h-5 w-5 text-secondary-foreground" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold">{prop.nombreImmeubles || 0}</div>
                                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Immeubles</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4 opacity-50" />
                                            {new Date(prop.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                        </div>

                                        <div className="col-span-1 md:col-span-2 flex justify-end items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingProprietaire(prop);
                                                }}
                                            >
                                                <Edit className="h-5 w-5" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-muted font-bold"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 border-border/40 backdrop-blur-xl bg-background/80 shadow-2xl">
                                                    <DropdownMenuItem
                                                        className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/immobilier/proprietaires/${prop.id}`);
                                                        }}
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                        <span>Voir le détail</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="rounded-xl flex items-center gap-2 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(prop.id, prop.nom);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span>Supprimer</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="pt-4 flex justify-center">
                        <div className="bg-background/40 backdrop-blur-md p-2 rounded-3xl border border-border/30 shadow-xl">
                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                total={pagination.total}
                                onPageChange={setPage}
                            />
                        </div>
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
