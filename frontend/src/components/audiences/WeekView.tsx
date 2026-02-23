import { useState } from 'react';
import {
    startOfWeek,
    endOfWeek,
    addDays,
    addWeeks,
    subWeeks,
    isSameDay,
    isToday,
    parseDateFromAPI,
} from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, MoreVertical, Eye, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { ViewMode } from '@/hooks/useAudienceUI';

interface WeekViewProps {
    events: any[];
    onEventClick: (event: any) => void;
    currentWeek: Date;
    onWeekChange: (date: Date) => void;
    viewMode: ViewMode;
    onViewChange: (mode: ViewMode) => void;
}

const statusColors: Record<string, string> = {
    A_VENIR: 'bg-info/15 text-info border border-info/30 hover:bg-info/25',
    PASSEE_NON_RENSEIGNEE: 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/20',
    RENSEIGNEE: 'bg-success/15 text-success border border-success/30 hover:bg-success/25',
};

const VIEW_LABELS: Record<ViewMode, string> = { month: 'Mois', week: 'Semaine', day: 'Jour', list: 'Liste' };

export function WeekView({
    events,
    onEventClick,
    currentWeek,
    onWeekChange,
    viewMode,
    onViewChange
}: WeekViewProps) {
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

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = weekStart;
    for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
    }

    const getEventsForDay = (date: Date) => {
        return events.filter(event => isSameDay(parseDateFromAPI(event.date), date));
    };

    const weekStartLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', timeZone: 'UTC' }).format(weekStart);
    const weekEndLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(weekEnd);

    return (
        <>
            <div className="card-elevated overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-border bg-card gap-4">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onWeekChange(subWeeks(currentWeek, 1))}
                            className="h-9 w-9 hover:scale-110 active:scale-95 transition-all hover:bg-muted"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onWeekChange(addWeeks(currentWeek, 1))}
                            className="h-9 w-9 hover:scale-110 active:scale-95 transition-all hover:bg-muted"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onWeekChange(new Date())}
                            className="ml-2 font-medium hover:scale-105 active:scale-95 transition-all"
                        >
                            Aujourd'hui
                        </Button>
                    </div>

                    {/* Center: Title */}
                    <h2 className="text-xl font-bold text-foreground capitalize font-serif whitespace-nowrap">
                        Semaine du {weekStartLabel} au {weekEndLabel}
                    </h2>

                    {/* Right: View Tabs */}
                    <div className="flex items-center gap-2">
                        <Tabs value={viewMode} onValueChange={(v) => onViewChange(v as ViewMode)}>
                            <TabsList className="bg-muted/50 border-none h-9 p-1">
                                {(['month', 'week', 'day', 'list'] as ViewMode[]).map(mode => (
                                    <TabsTrigger
                                        key={mode}
                                        value={mode}
                                        className="text-xs px-3 h-7 transition-all duration-300 ease-out hover:scale-110 hover:translate-y-[-2px] hover:shadow-lg hover:bg-background/50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:scale-105 active:scale-95 active:translate-y-0"
                                    >
                                        {VIEW_LABELS[mode]}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Week grid */}
                <div className="grid grid-cols-7 divide-x divide-border">
                    {days.map((dayDate, idx) => {
                        const dayEvents = getEventsForDay(dayDate);
                        const isCurrentDay = isToday(dayDate);

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "min-h-[220px] p-2 transition-all duration-300 hover:bg-muted/30",
                                    isCurrentDay && "bg-primary/5"
                                )}
                            >
                                {/* Day header */}
                                <div className="text-center mb-3">
                                    <div className="text-xs text-muted-foreground uppercase font-medium">
                                        {new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' }).format(dayDate)}
                                    </div>
                                    <div className={cn(
                                        "text-lg font-medium mt-1 transition-all duration-300",
                                        isCurrentDay
                                            ? "w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md scale-110"
                                            : "hover:scale-110"
                                    )}>
                                        {dayDate.getUTCDate()}
                                    </div>
                                </div>

                                {/* Events */}
                                <div className="space-y-1">
                                    {dayEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "text-xs p-1.5 rounded-md cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md group/event relative",
                                                statusColors[event.status] || statusColors.A_VENIR
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(event);
                                            }}
                                            title={`${event.time || ''} ${event.parties} - ${event.caseReference}`}
                                        >
                                            <div className="font-bold flex items-center justify-between gap-1 mb-0.5">
                                                <span className="opacity-70">{event.time || '--:--'}</span>
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-[9px] font-mono opacity-60 truncate">{event.caseReference}</span>
                                                    {/* Context menu */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="h-4 w-4 flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity rounded hover:bg-black/10"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-3 w-3" />
                                                            </button>
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
                                            <div className="truncate font-bold text-xs">{event.parties}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
