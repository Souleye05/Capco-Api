import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Search, Calendar as CalendarIcon, Building2, Home, Hash } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
        <Card className="border-border/40 bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden rounded-[2rem]">
            <CardHeader className="py-4 px-6 bg-gradient-to-r from-primary/[0.03] to-transparent border-b border-border/10">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground/80">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Filter className="h-3.5 w-3.5" />
                    </div>
                    Filtres intelligents
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                        <div className="lg:col-span-4 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/60 ml-1">Recherche globale</Label>
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="search"
                                    placeholder="Locataire, lot, immeuble..."
                                    value={filters.searchQuery}
                                    onChange={(e) => filters.setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 rounded-xl border-border/40 bg-background/50 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/60 ml-1">Immeuble</Label>
                            <div className="relative group">
                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <SearchableSelect
                                    options={[
                                        { label: "Tous les immeubles", value: "all" },
                                        ...immeubles.map(imm => ({ label: imm.nom, value: imm.id }))
                                    ]}
                                    value={filters.selectedImmeuble}
                                    onValueChange={(v) => { filters.setSelectedImmeuble(v); filters.setSelectedLot('all'); }}
                                    className="h-11 pl-10 rounded-xl bg-background/50 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/60 ml-1">Lot / Logement</Label>
                            <div className="relative group">
                                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <SearchableSelect
                                    options={[
                                        { label: "Tous les lots", value: "all" },
                                        ...availableLots.map(lot => ({
                                            label: `${lot.numero} (${lot.immeuble?.nom})`,
                                            value: lot.id
                                        }))
                                    ]}
                                    value={filters.selectedLot}
                                    onValueChange={filters.setSelectedLot}
                                    className="h-11 pl-10 rounded-xl bg-background/50 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/60 ml-1">Période (Mois)</Label>
                            <div className="relative group">
                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                                <SearchableSelect
                                    options={[
                                        { label: "Tous les mois", value: "all" },
                                        ...uniqueMois.map(mois => ({
                                            label: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(mois + '-01')),
                                            value: mois
                                        }))
                                    ]}
                                    value={filters.selectedMois}
                                    onValueChange={filters.setSelectedMois}
                                    className="h-11 pl-10 rounded-xl bg-background/50 border-border/40 text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 flex items-end">
                            <Button variant="ghost" onClick={filters.clearFilters} className="w-full h-11 rounded-xl text-destructive hover:bg-destructive/10 font-bold text-[10px] uppercase tracking-widest transition-all">
                                Réinitialiser
                            </Button>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border/10">
                        <div className="space-y-2 max-w-2xl">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/40 ml-1 italic">Intervalle de règlement</Label>
                            <div className="flex flex-wrap gap-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="min-w-[180px] justify-start text-left h-11 rounded-xl border-border/40 bg-background/50 hover:bg-background font-bold text-xs relative pl-10">
                                            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                            {filters.dateDebut ? format(filters.dateDebut, 'dd/MM/yyyy') : 'Date de début'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-border/40 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={filters.dateDebut}
                                            onSelect={filters.setDateDebut}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="min-w-[180px] justify-start text-left h-11 rounded-xl border-border/40 bg-background/50 hover:bg-background font-bold text-xs relative pl-10">
                                            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                            {filters.dateFin ? format(filters.dateFin, 'dd/MM/yyyy') : 'Date de fin'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-border/40 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={filters.dateFin}
                                            onSelect={filters.setDateFin}
                                            initialFocus
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
