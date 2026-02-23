import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/hooks/useAudienceUI';
import { DayView } from './DayView';
import { parseDateFromAPI, getUTCYear, getUTCMonth, getUTCDay, isSameDay, format } from '@/lib/date-utils';

interface CalendarViewProps {
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    events: any[];
    onEventClick: (event: any) => void;
}

export function AudienceCalendar({
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    events,
    onEventClick
}: CalendarViewProps) {

    const year = getUTCYear(currentMonth);
    const month = getUTCMonth(currentMonth);
    const today = new Date();

    // Calendar Helpers - utilise UTC pour éviter les décalages timezone
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const startingDayOfWeek = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const getDayEvents = (day: number) => events.filter(e => {
        // ✅ Parse la date en UTC et compare avec UTC
        const eventDate = parseDateFromAPI(e.date);
        return getUTCDay(eventDate) === day &&
            getUTCMonth(eventDate) === month &&
            getUTCYear(eventDate) === year;
    });

    const navigateMonth = (step: number) => {
        setCurrentMonth(new Date(year, month + step, 1));
    };

    if (viewMode === 'day') {
        return (
            <DayView
                events={events}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onEventClick={onEventClick}
                viewMode={viewMode}
                onViewChange={setViewMode}
            />
        );
    }

    if (viewMode !== 'month') {
        return (
            <div className="card-elevated overflow-hidden bg-background">
                <CalendarHeader viewMode={viewMode} setViewMode={setViewMode} title={`Vue ${viewMode}`} />
                <div className="p-12 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-muted rounded-full">
                            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium">Vue {viewMode}</h3>
                        <p className="text-muted-foreground">Cette vue sera implémentée prochainement.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card-elevated overflow-hidden bg-background">
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold text-foreground capitalize font-serif">
                        {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="ml-2" onClick={() => setCurrentMonth(new Date())}>
                        Aujourd'hui
                    </Button>
                </div>
                <ViewTabs value={viewMode} onChange={setViewMode} />
            </div>

            <div className="p-4">
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                        <div key={day} className="bg-muted/50 py-3 text-center text-sm font-medium text-muted-foreground">{day}</div>
                    ))}
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-28 bg-muted/10" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getDayEvents(day);
                        const isToday = (() => {
                            const todayUTC = new Date();
                            const dayDateUTC = new Date(Date.UTC(year, month, day, 12, 0, 0));
                            return isSameDay(todayUTC, dayDateUTC);
                        })();

                        return (
                            <div key={day} className={cn('h-28 bg-card p-2 transition-colors hover:bg-muted/30 cursor-pointer', isToday && 'bg-primary/5 ring-2 ring-primary/20')}>
                                <div className={cn('text-sm font-medium mb-1', isToday && 'text-primary')}>{day}</div>
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                'text-xs p-1 rounded truncate cursor-pointer transition-all hover:scale-105',
                                                event.status === 'PASSEE_NON_RENSEIGNEE' ? 'bg-destructive text-destructive-foreground' :
                                                    event.status === 'A_VENIR' ? 'bg-info/20 text-info-foreground border border-info/30' :
                                                        'bg-success/20 text-success-foreground border border-success/30'
                                            )}
                                            title={`${event.parties} - ${event.caseReference}`}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                        >
                                            {event.time && `${event.time} - `}{event.parties}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-muted-foreground pl-1 font-medium">+{dayEvents.length - 3} autre(s)</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function CalendarHeader({ viewMode, setViewMode, title }: { viewMode: ViewMode, setViewMode: (m: ViewMode) => void, title: string }) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <h2 className="text-xl font-bold text-foreground capitalize font-serif ml-2">{title}</h2>
            <ViewTabs value={viewMode} onChange={setViewMode} />
        </div>
    );
}

function ViewTabs({ value, onChange }: { value: ViewMode, onChange: (v: ViewMode) => void }) {
    const modes: ViewMode[] = ['month', 'week', 'day', 'list'];
    const labels: Record<ViewMode, string> = { month: 'Mois', week: 'Semaine', day: 'Jour', list: 'Liste' };

    return (
        <Tabs value={value} onValueChange={(v) => onChange(v as ViewMode)}>
            <TabsList className="bg-muted/50 border-none h-9 p-1">
                {modes.map(mode => (
                    <TabsTrigger
                        key={mode}
                        value={mode}
                        className="text-xs px-3 h-7 transition-all duration-300 ease-out hover:scale-110 hover:translate-y-[-2px] hover:shadow-lg hover:bg-background/50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:scale-105 active:scale-95 active:translate-y-0"
                    >
                        {labels[mode]}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
