import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { parseDateFromAPI } from '@/lib/date-utils';

interface ImmeubleFiltersProps {
    lots: any[];
    uniqueMois: string[];
    selectedLot: string;
    setSelectedLot: (val: string) => void;
    selectedMois: string;
    setSelectedMois: (val: string) => void;
    dateDebut: Date | undefined;
    setDateDebut: (date: Date | undefined) => void;
    dateFin: Date | undefined;
    setDateFin: (date: Date | undefined) => void;
    onClear: () => void;
}

export function ImmeubleFilters({
    lots,
    uniqueMois,
    selectedLot,
    setSelectedLot,
    selectedMois,
    setSelectedMois,
    dateDebut,
    setDateDebut,
    dateFin,
    setDateFin,
    onClear
}: ImmeubleFiltersProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4" />
                    Filtres
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label>Lot / Appartement</Label>
                        <Select value={selectedLot} onValueChange={setSelectedLot}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les lots" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les lots</SelectItem>
                                {lots.map(lot => (
                                    <SelectItem key={lot.id} value={lot.id}>
                                        {lot.numero} - {lot.type || 'Lot'} {lot.locataireNom ? `(${lot.locataireNom})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Mois</Label>
                        <Select value={selectedMois} onValueChange={setSelectedMois}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les mois" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les mois</SelectItem>
                                {uniqueMois.map(mois => (
                                    <SelectItem key={mois} value={mois}>
                                        {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(mois + '-01'))}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Date début</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateDebut ? format(dateDebut, 'dd/MM/yyyy') : 'Sélectionner'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={dateDebut}
                                    onSelect={setDateDebut}
                                    initialFocus
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>Date fin</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateFin ? format(dateFin, 'dd/MM/yyyy') : 'Sélectionner'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={dateFin}
                                    onSelect={setDateFin}
                                    initialFocus
                                    className="pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-end">
                        <Button variant="ghost" onClick={onClear} className="w-full">
                            Effacer filtres
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
