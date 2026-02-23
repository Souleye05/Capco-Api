import { useState } from 'react';
import { format, addDays, subDays, isSameDay } from '@/lib/date-utils';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MapPin, ChevronLeft, ChevronRight, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { getStatusClassName, getStatusIcon } from '@/lib/statusConfig';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupprimerAudienceDialog } from '@/components/dialogs/SupprimerAudienceDialog';

interface DayViewProps {
    events: any[];
    selectedDate: Date;
    onEventClick: (event: any) => void;
    onDateChange?: (date: Date) => void;
    viewMode?: string;
    onViewChange?: (mode: string) => void;
}

export function DayView({
    events,
    selectedDate,
    onEventClick,
    onDateChange,
    viewMode = 'day',
    onViewChange
}: DayViewProps) {
    const [audienceToDelete, setAudienceToDelete] = useState<any>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDeleteClick = (event: any) => {
        setAudienceToDelete({
            id: event.audience?.id || event.id,
            date: event.date,
            juridiction: event.jurisdiction,
            affaire: {
                reference: event.caseReference,
                intitule: event.parties,
            }
        });
        setShowDeleteDialog(true);
    };

    const dayEvents = events.filter((event) => {
        return isSameDay(new Date(event.date), selectedDate);
    });

    // Grouper les audiences par juridiction
    const eventsByJurisdiction = dayEvents.reduce((acc, event) => {
        const jurisdiction = event.jurisdiction && event.jurisdiction !== 'N/A' ? event.jurisdiction : 'Non spécifiée';
        if (!acc[jurisdiction]) acc[jurisdiction] = [];
        acc[jurisdiction].push(event);
        return acc;
    }, {} as Record<string, any[]>);

    // Trier les juridictions alphabétiquement, mais mettre "Non spécifiée" à la fin
    const sortedJurisdictions = Object.keys(eventsByJurisdiction).sort((a, b) => {
        if (a === 'Non spécifiée') return 1;
        if (b === 'Non spécifiée') return -1;
        return a.localeCompare(b);
    });

    return (
        <>
            <div className="card-elevated overflow-hidden bg-background">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-border bg-card gap-4">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDateChange?.(subDays(selectedDate, 1))}
                            className="h-8 w-8 hover:scale-110 active:scale-95 transition-all hover:bg-muted"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDateChange?.(addDays(selectedDate, 1))}
                            className="h-8 w-8 hover:scale-110 active:scale-95 transition-all hover:bg-muted"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDateChange?.(new Date())}
                            className="ml-2 h-8 font-medium hover:scale-105 active:scale-95 transition-all"
                        >
                            Aujourd'hui
                        </Button>
                    </div>

                    {/* Center: Title */}
                    <h2 className="text-lg font-bold text-foreground capitalize font-serif whitespace-nowrap">
                        {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </h2>

                    {/* Right: View Tabs */}
                    <div className="flex items-center gap-2">
                        <Tabs value={viewMode} onValueChange={(v) => onViewChange?.(v)}>
                            <TabsList className="bg-muted/50 border-none h-8 p-1">
                                <TabsTrigger value="month" className="text-[10px] px-3 h-6 transition-all data-[state=active]:bg-background data-[state=active]:text-primary">Mois</TabsTrigger>
                                <TabsTrigger value="week" className="text-[10px] px-3 h-6 transition-all data-[state=active]:bg-background data-[state=active]:text-primary">Semaine</TabsTrigger>
                                <TabsTrigger value="day" className="text-[10px] px-3 h-6 transition-all data-[state=active]:bg-background data-[state=active]:text-primary">Jour</TabsTrigger>
                                <TabsTrigger value="list" className="text-[10px] px-3 h-6 transition-all data-[state=active]:bg-background data-[state=active]:text-primary">Liste</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[700px] p-6 space-y-6">
                    {dayEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 bg-muted/20 rounded-full mb-4">
                                <MapPin className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Aucune audience programmée pour cette journée.
                            </p>
                        </div>
                    ) : (
                        sortedJurisdictions.map((jurisdiction) => {
                            const jurisdictionEvents = [...eventsByJurisdiction[jurisdiction]].sort((a, b) =>
                                (a.time || '00:00').localeCompare(b.time || '00:00')
                            );

                            return (
                                <div key={jurisdiction} className="space-y-4">
                                    {/* En-tête de la juridiction */}
                                    <div className="flex items-center gap-3 pb-2 border-b-2 border-success/20">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10 text-success">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-foreground">
                                                {jurisdiction}
                                            </h3>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                {jurisdictionEvents.length} audience{jurisdictionEvents.length > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Liste des audiences */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {jurisdictionEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    "p-4 rounded-xl border bg-card shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group relative",
                                                    getStatusClassName(event.status)
                                                )}
                                                onClick={() => onEventClick(event)}
                                            >
                                                <div className="flex flex-col h-full justify-between gap-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                                {event.caseReference}
                                                            </span>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {getStatusIcon(event.status, "h-4 w-4")}
                                                                {/* Menu contextuel */}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <MoreVertical className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-44">
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEventClick(event); }}>
                                                                            <Eye className="h-4 w-4 mr-2" />
                                                                            Voir les détails
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(event); }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Supprimer
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-foreground leading-tight group-hover:text-success transition-colors overflow-hidden text-ellipsis line-clamp-2">
                                                            {event.parties}
                                                        </h4>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                        <div className="flex items-center gap-1.5">
                                                            {event.time && (
                                                                <span className="text-xs font-bold text-muted-foreground">
                                                                    {event.time}
                                                                </span>
                                                            )}
                                                            {event.chamber && (
                                                                <span className="text-[10px] text-muted-foreground/70 truncate max-w-[100px]">
                                                                    • {event.chamber}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <SupprimerAudienceDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                audience={audienceToDelete}
            />
        </>
    );
}
