import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/hooks/useAudienceUI';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { parseDateFromAPI, getUTCYear, getUTCMonth, getUTCDay, isSameDay } from '@/lib/date-utils';

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

    // Calendar Helpers - utilise UTC pour éviter les décalages timezone
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const startingDayOfWeek = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const getDayEvents = (day: number) => events.filter(e => {
        const eventDate = parseDateFromAPI(e.date);
        return getUTCDay(eventDate) === day &&
            getUTCMonth(eventDate) === month &&
            getUTCYear(eventDate) === year;
    });

    const navigateMonth = (step: number) => {
        setCurrentMonth(new Date(year, month + step, 1));
    };

    // Day view
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

    // Week view
    if (viewMode === 'week') {
        return (
            <WeekView
                events={events}
                onEventClick={onEventClick}
                currentWeek={selectedDate}
                onWeekChange={setSelectedDate}
                viewMode={viewMode}
                onViewChange={setViewMode}
            />
        );
    }

    // Month view
    return (
        <div className="card-elevated overflow-hidden bg-background">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-border bg-card gap-4">
                {/* Left: Navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 hover:scale-110 active:scale-95 transition-all hover:bg-muted"
                        onClick={() => navigateMonth(-1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 hover:scale-110 active:scale-95 transition-all hover:bg-muted"
                        onClick={() => navigateMonth(1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date())}
                        className="ml-2 font-medium hover:scale-105 active:scale-95 transition-all"
                    >
                        Aujourd'hui
                    </Button>
                </div>

                {/* Center: Title */}
                <h2 className="text-xl font-bold text-foreground capitalize font-serif whitespace-nowrap">
                    {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>

                {/* Right: View Tabs */}
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
                        const isCurrentDay = (() => {
                            const todayUTC = new Date();
                            const dayDateUTC = new Date(Date.UTC(year, month, day, 12, 0, 0));
                            return isSameDay(todayUTC, dayDateUTC);
                        })();

                        return (
                            <div
                                key={day}
                                className={cn(
                                    'h-28 bg-card p-2 transition-colors hover:bg-muted/30 cursor-pointer',
                                    isCurrentDay && 'bg-primary/5 ring-2 ring-primary/20'
                                )}
                                onClick={() => {
                                    setSelectedDate(new Date(Date.UTC(year, month, day, 12, 0, 0)));
                                    setViewMode('day');
                                }}
                            >
                                <div className={cn(
                                    'text-sm font-medium mb-1',
                                    isCurrentDay && 'text-primary'
                                )}>
                                    {day}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                'text-xs p-1 rounded truncate cursor-pointer transition-all hover:scale-105 font-semibold',
                                                event.status === 'PASSEE_NON_RENSEIGNEE' ? 'bg-destructive text-destructive-foreground' :
                                                    event.status === 'A_VENIR' ? 'bg-info/15 text-info border border-info/30' :
                                                        'bg-success/15 text-success border border-success/30'
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
