import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
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
    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Filter className="h-4 w-4 text-primary" />
                    Filtres de recherche
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Mois concerné</Label>
                        <Select value={filters.selectedMois} onValueChange={filters.setSelectedMois}>
                            <SelectTrigger className="rounded-xl border-border/50 h-11 bg-muted/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMonths.map(mois => (
                                    <SelectItem key={mois} value={mois}>
                                        {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(mois + '-01'))}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Immeuble</Label>
                        <Select value={filters.selectedImmeuble} onValueChange={filters.setSelectedImmeuble}>
                            <SelectTrigger className="rounded-xl border-border/50 h-11 bg-muted/20">
                                <SelectValue placeholder="Tous" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les immeubles</SelectItem>
                                {immeubles.map(imm => (
                                    <SelectItem key={imm.id} value={imm.id}>{imm.nom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Statut</Label>
                        <Select value={filters.showPaidOnly} onValueChange={filters.setShowPaidOnly}>
                            <SelectTrigger className="rounded-xl border-border/50 h-11 bg-muted/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les lots</SelectItem>
                                <SelectItem value="impayes">Impayés uniquement</SelectItem>
                                <SelectItem value="payes">Payés uniquement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Recherche</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Lot, locataire..."
                                value={filters.searchQuery}
                                onChange={(e) => filters.setSearchQuery(e.target.value)}
                                className="pl-9 h-11 rounded-xl bg-muted/20 border-border/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Button variant="ghost" onClick={filters.clearFilters} className="w-full h-11 rounded-xl hover:bg-destructive/10 hover:text-destructive font-bold transition-all">
                            Réinitialiser
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
