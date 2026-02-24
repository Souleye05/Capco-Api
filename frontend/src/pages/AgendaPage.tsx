import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Gavel,
  Banknote,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { NouvelEvenementDialog } from '@/components/dialogs/NouvelEvenementDialog';
import { cn } from '@/lib/utils';
import { useAudiences } from '@/hooks/useAudiences';
import { useActionsRecouvrement } from '@/hooks/useRecouvrement';
import { parseDateFromAPI } from '@/lib/date-utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'audience' | 'echeance';
  status?: string;
  linkTo?: string;
}

export default function AgendaPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showNouvelEvenement, setShowNouvelEvenement] = useState(false);
  const [filters, setFilters] = useState({
    audiences: true,
    echeances: true
  });

  // Fetch data from database
  const { data: audiences = [], isLoading: audiencesLoading } = useAudiences();
  const { data: actions = [], isLoading: actionsLoading } = useActionsRecouvrement();

  const isLoading = audiencesLoading || actionsLoading;

  // Convert data to calendar events (without loyers - removed as per request)
  const events: CalendarEvent[] = useMemo(() => {
    const evts: CalendarEvent[] = [];

    // Audiences
    audiences.forEach((a: any) => {
      evts.push({
        id: a.id,
        title: `${a.affaires?.reference || 'Audience'} - ${a.affaires?.intitule || ''}`,
        date: parseDateFromAPI(a.date),
        time: a.heure || undefined,
        type: 'audience',
        status: a.statut,
        linkTo: a.affaires?.id ? `/contentieux/affaires/${a.affaires.id}` : undefined
      });
    });

    // Échéances de recouvrement (from actions with echeance_prochaine_etape)
    actions.forEach(action => {
      if (action.echeance_prochaine_etape) {
        evts.push({
          id: `ech-${action.id}`,
          title: `${action.dossiers_recouvrement?.reference || 'Dossier'} - ${action.prochaine_etape || 'Échéance'}`,
          date: parseDateFromAPI(action.echeance_prochaine_etape),
          type: 'echeance',
          linkTo: action.dossier_id ? `/recouvrement/dossiers/${action.dossier_id}` : undefined
        });
      }
    });

    return evts;
  }, [audiences, actions]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const today = new Date();

  const getEventsForDay = (day: number) => {
    return events.filter(e => {
      // ✅ Utilise UTC pour éviter les décalages de timezone
      const matchesDate = e.date.getUTCDate() === day &&
        e.date.getUTCMonth() === month &&
        e.date.getUTCFullYear() === year;

      // Apply filters
      if (e.type === 'audience' && !filters.audiences) return false;
      if (e.type === 'echeance' && !filters.echeances) return false;

      return matchesDate;
    });
  };

  const eventTypeStyles = {
    audience: {
      bg: 'bg-info',
      text: 'text-info-foreground'
    },
    echeance: {
      bg: 'bg-warning',
      text: 'text-warning-foreground'
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Agenda"
        subtitle="Vue unifiée de tous les événements"
        actions={
          <Button className="gap-2" onClick={() => setShowNouvelEvenement(true)}>
            <Plus className="h-4 w-4" />
            Nouvel événement
          </Button>
        }
      />

      <NouvelEvenementDialog
        open={showNouvelEvenement}
        onOpenChange={setShowNouvelEvenement}
      />

      <div className="p-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-6">
            {/* Navigation */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold">
                  {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCurrentMonth(new Date())}
              >
                Aujourd'hui
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audiences"
                    checked={filters.audiences}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, audiences: !!checked }))}
                  />
                  <Label htmlFor="audiences" className="flex items-center gap-2 cursor-pointer">
                    <Gavel className="h-4 w-4 text-info" />
                    Audiences ({audiences.length})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="echeances"
                    checked={filters.echeances}
                    onCheckedChange={(checked) => setFilters(f => ({ ...f, echeances: !!checked }))}
                  />
                  <Label htmlFor="echeances" className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="h-4 w-4 text-warning" />
                    Échéances recouvrement
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1">
            <div className="bg-card rounded-lg border overflow-hidden">
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-border">
                {/* Header */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="bg-muted py-3 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}

                {/* Empty cells before first day */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-28 bg-muted/20 p-2" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const isToday = today.getDate() === day &&
                    today.getMonth() === month &&
                    today.getFullYear() === year;

                  return (
                    <div
                      key={day}
                      className={cn(
                        'h-28 bg-card p-2 transition-colors hover:bg-muted/30',
                        isToday && 'bg-primary/5 ring-1 ring-primary'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-medium mb-1',
                        isToday && 'text-primary'
                      )}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => {
                          const style = eventTypeStyles[event.type];
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                'text-xs p-1 rounded truncate cursor-pointer transition-opacity hover:opacity-80',
                                event.status === 'PASSEE_NON_RENSEIGNEE'
                                  ? 'bg-destructive text-destructive-foreground'
                                  : `${style.bg} ${style.text}`
                              )}
                              title={event.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (event.linkTo) navigate(event.linkTo);
                              }}
                            >
                              {event.time && `${event.time} - `}
                              {event.title.split(' - ')[0]}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dayEvents.length - 3} autre(s)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}