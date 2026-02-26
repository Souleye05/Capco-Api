import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Search, Calendar as CalendarIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { parseDateFromAPI } from '@/lib/date-utils';

interface LoyersFiltersProps {
    immeubles: any[];
    lots: any[];
    uniqueMois: string[];
    filters: any;
}

export function LoyersFilters({ immeubles, lots, uniqueMois, filters }: LoyersFiltersProps) {
    const availableLots = filters.selectedImmeuble === 'all'
        ? lots
        : lots.filter(l => l.immeubleId === filters.selectedImmeuble);

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="py-4 bg-muted/20 border-b">
                <CardTitle className="flex items-center gap-2 text-base font-black">
                    <Filter className="h-4 w-4 text-primary" />
                    Filtres de recherche
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-4 space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Recherche manuelle</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Locataire, lot, immeuble..."
                                    value={filters.searchQuery}
                                    onChange={(e) => filters.setSearchQuery(e.target.value)}
                                    className="pl-9 h-11 rounded-xl border-border/50 bg-background"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Immeuble</Label>
                            <Select value={filters.selectedImmeuble} onValueChange={(v) => { filters.setSelectedImmeuble(v); filters.setSelectedLot('all'); }}>
                                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-bold text-sm">
                                    <SelectValue placeholder="Tous" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all" className="font-bold">Tous les immeubles</SelectItem>
                                    {immeubles.map(imm => (
                                        <SelectItem key={imm.id} value={imm.id} className="font-bold">{imm.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Logement (Lot)</Label>
                            <Select value={filters.selectedLot} onValueChange={filters.setSelectedLot}>
                                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-bold text-sm">
                                    <SelectValue placeholder="Tous" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all" className="font-bold">Tous les lots</SelectItem>
                                    {availableLots.map(lot => (
                                        <SelectItem key={lot.id} value={lot.id} className="font-black">
                                            {lot.numero} <span className="font-normal opacity-50 ml-1">({lot.immeuble?.nom})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Mois dû</Label>
                            <Select value={filters.selectedMois} onValueChange={filters.setSelectedMois}>
                                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-bold text-sm">
                                    <SelectValue placeholder="Tous" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all" className="font-bold">Tous les mois</SelectItem>
                                    {uniqueMois.map(mois => (
                                        <SelectItem key={mois} value={mois} className="font-bold">
                                            {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(mois + '-01'))}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="lg:col-span-2 flex items-end">
                            <Button variant="ghost" onClick={filters.clearFilters} className="w-full h-11 rounded-xl hover:bg-destructive/10 hover:text-destructive font-black transition-all">
                                RAZ Filtres
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                        <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground italic">Période du règlement</Label>
                            <div className="flex gap-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="flex-1 justify-start text-left font-bold h-11 rounded-xl border-border/50">
                                            <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                                            {filters.dateDebut ? format(filters.dateDebut, 'dd/MM/yyyy') : 'Date de début'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={filters.dateDebut}
                                            onSelect={filters.setDateDebut}
                                            initialFocus
                                            className="pointer-events-auto"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="flex-1 justify-start text-left font-bold h-11 rounded-xl border-border/50">
                                            <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                                            {filters.dateFin ? format(filters.dateFin, 'dd/MM/yyyy') : 'Date de fin'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={filters.dateFin}
                                            onSelect={filters.setDateFin}
                                            initialFocus
                                            className="pointer-events-auto"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
