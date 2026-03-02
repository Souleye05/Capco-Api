import { Filter, Search, Calendar, Building2, Activity, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { parseDateFromAPI } from '@/lib/date-utils';

interface ImpayesFiltersProps {
    availableMonths: string[];
    immeubles: any[];
    filters: {
        searchQuery: string;
        setSearchQuery: (val: string) => void;
        selectedImmeuble: string;
        setSelectedImmeuble: (val: string) => void;
        selectedMois: string;
        setSelectedMois: (val: string) => void;
        showPaidOnly: string;
        setShowPaidOnly: (val: string) => void;
        clearFilters: () => void;
    };
}

export function ImpayesFilters({ availableMonths, immeubles, filters }: ImpayesFiltersProps) {
    const hasActiveFilters = filters.selectedImmeuble !== 'all' || filters.showPaidOnly !== 'all' || filters.searchQuery !== '';

    return (
        <div className="bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-4 px-1">
                <div className="h-6 w-1 bg-primary rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Gestion des impayés</span>
                <span className="text-xs font-bold text-foreground/80 ml-auto">Filtres de recherche</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Période concernée</Label>
                    <div className="relative group">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
                        <SearchableSelect
                            value={filters.selectedMois}
                            onValueChange={filters.setSelectedMois}
                            options={availableMonths.map(mois => ({
                                value: mois,
                                label: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(mois + '-01'))
                            }))}
                            placeholder="Choisir le mois..."
                            className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Immeuble</Label>
                    <div className="relative group">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
                        <SearchableSelect
                            value={filters.selectedImmeuble}
                            onValueChange={filters.setSelectedImmeuble}
                            options={[
                                { value: "all", label: "Tous les immeubles" },
                                ...immeubles.map(imm => ({ label: imm.nom, value: imm.id }))
                            ]}
                            placeholder="Tous"
                            className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Statut de paiement</Label>
                    <div className="relative group">
                        <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors pointer-events-none" />
                        <SearchableSelect
                            value={filters.showPaidOnly}
                            onValueChange={filters.setShowPaidOnly}
                            options={[
                                { value: "all", label: "Tous les lots" },
                                { value: "impayes", label: "Impayés uniquement" },
                                { value: "payes", label: "Payés uniquement" }
                            ]}
                            placeholder="Tous"
                            className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5 shadow-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Recherche rapide</Label>
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                        <Input
                            type="search"
                            placeholder="Lot, locataire..."
                            value={filters.searchQuery}
                            onChange={(e) => filters.setSearchQuery(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all shadow-none"
                        />
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            onClick={filters.clearFilters}
                            className="flex-1 h-11 rounded-xl border-border/40 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 font-bold transition-all text-xs uppercase tracking-widest"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Réinitialiser
                        </Button>
                    )}
                    {!hasActiveFilters && (
                        <div className="flex-1 h-11 flex items-center justify-center opacity-40 border border-dashed border-border/60 rounded-xl">
                            <Filter className="h-4 w-4 mr-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Actif</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
