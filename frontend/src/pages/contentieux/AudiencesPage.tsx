import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  List, 
  AlertTriangle,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { NouvelleAudienceDialog } from '@/components/dialogs/NouvelleAudienceDialog';
import { ResultatAudienceDialog } from '@/components/dialogs/ResultatAudienceDialog';
import { useAudiences, AudienceDB } from '@/hooks/useAudiences';
import { cn } from '@/lib/utils';

const statutLabels = {
  A_VENIR: { label: 'À venir', color: 'bg-info/10 text-info' },
  PASSEE_NON_RENSEIGNEE: { label: 'Non renseignée', color: 'bg-destructive/10 text-destructive' },
  RENSEIGNEE: { label: 'Renseignée', color: 'bg-success/10 text-success' }
};

const objetLabels = {
  MISE_EN_ETAT: 'Mise en état',
  PLAIDOIRIE: 'Plaidoirie',
  REFERE: 'Référé',
  AUTRE: 'Autre'
};

export default function AudiencesPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showNouvelleAudience, setShowNouvelleAudience] = useState(false);
  const [showResultatAudience, setShowResultatAudience] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<AudienceDB | null>(null);

  const { data: audiences = [], isLoading } = useAudiences();

  const audiencesNonRenseignees = audiences.filter(a => a.statut === 'PASSEE_NON_RENSEIGNEE');
  const audiencesAVenir = audiences.filter(a => a.statut === 'A_VENIR');

  const handleSaisirResultat = (audience: AudienceDB) => {
    setSelectedAudience(audience);
    setShowResultatAudience(true);
  };

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

  const getAudiencesForDay = (day: number) => {
    return audiences.filter(a => {
      const audienceDate = new Date(a.date);
      return audienceDate.getDate() === day && 
             audienceDate.getMonth() === month && 
             audienceDate.getFullYear() === year;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Audiences" subtitle="Chargement..." />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Audiences" 
        subtitle={`${audiencesNonRenseignees.length} à régulariser`}
        actions={
          <Button className="gap-2" onClick={() => setShowNouvelleAudience(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle audience
          </Button>
        }
      />

      <NouvelleAudienceDialog 
        open={showNouvelleAudience} 
        onOpenChange={setShowNouvelleAudience} 
      />

      <ResultatAudienceDialog 
        open={showResultatAudience} 
        onOpenChange={setShowResultatAudience}
        audience={selectedAudience}
      />

      <div className="p-6 animate-fade-in">
        {/* Alert for non-renseignées */}
        {audiencesNonRenseignees.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">
                {audiencesNonRenseignees.length} audience(s) passée(s) non renseignée(s)
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-7">
              Veuillez saisir le résultat de ces audiences pour les régulariser.
            </p>
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une audience..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === 'calendar' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setView('calendar')}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {view === 'list' ? (
          <Tabs defaultValue="a-venir" className="space-y-4">
            <TabsList>
              <TabsTrigger value="a-venir" className="gap-2">
                À venir
                <Badge variant="secondary" className="ml-1">{audiencesAVenir.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="non-renseignees" className="gap-2">
                Non renseignées
                {audiencesNonRenseignees.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{audiencesNonRenseignees.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="toutes">Toutes</TabsTrigger>
            </TabsList>

            <TabsContent value="a-venir" className="space-y-4">
              {audiencesAVenir.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune audience à venir</p>
              ) : (
                audiencesAVenir.map((audience) => (
                  <AudienceCard 
                    key={audience.id} 
                    audience={audience} 
                    onSaisirResultat={handleSaisirResultat}
                    onVoirDetails={(affaireId) => navigate(`/contentieux/affaires/${affaireId}`)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="non-renseignees" className="space-y-4">
              {audiencesNonRenseignees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune audience à régulariser</p>
              ) : (
                audiencesNonRenseignees.map((audience) => (
                  <AudienceCard 
                    key={audience.id} 
                    audience={audience} 
                    onSaisirResultat={handleSaisirResultat}
                    onVoirDetails={(affaireId) => navigate(`/contentieux/affaires/${affaireId}`)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="toutes" className="space-y-4">
              {audiences.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune audience</p>
              ) : (
                audiences.map((audience) => (
                  <AudienceCard 
                    key={audience.id} 
                    audience={audience} 
                    onSaisirResultat={handleSaisirResultat}
                    onVoirDetails={(affaireId) => navigate(`/contentieux/affaires/${affaireId}`)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* Calendar View */
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold">
                {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Aujourd'hui
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* Header */}
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="bg-muted/50 py-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Empty cells before first day */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day bg-muted/20" />
              ))}
              
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayAudiences = getAudiencesForDay(day);
                const isToday = today.getDate() === day && 
                               today.getMonth() === month && 
                               today.getFullYear() === year;
                
                return (
                  <div 
                    key={day} 
                    className={cn('calendar-day bg-card', isToday && 'calendar-day-today')}
                  >
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      isToday && 'text-primary'
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayAudiences.slice(0, 2).map((audience) => (
                        <div 
                          key={audience.id}
                          className={cn(
                            'calendar-event',
                            audience.statut === 'PASSEE_NON_RENSEIGNEE' 
                              ? 'bg-destructive text-destructive-foreground' 
                              : 'calendar-event-audience'
                          )}
                        >
                          {audience.heure && `${audience.heure} - `}{audience.affaires?.reference}
                        </div>
                      ))}
                      {dayAudiences.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAudiences.length - 2} autre(s)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AudienceCardProps {
  audience: AudienceDB;
  onSaisirResultat: (audience: AudienceDB) => void;
  onVoirDetails: (affaireId: string) => void;
}

function AudienceCard({ audience, onSaisirResultat, onVoirDetails }: AudienceCardProps) {
  const isUrgent = audience.statut === 'PASSEE_NON_RENSEIGNEE';
  
  return (
    <div className={cn(
      'p-4 rounded-lg border bg-card transition-all hover:shadow-md',
      isUrgent && 'border-destructive/50 bg-destructive/5'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={statutLabels[audience.statut].color}>
              {statutLabels[audience.statut].label}
            </Badge>
            <span className="module-badge module-badge-contentieux">
              {objetLabels[audience.objet]}
            </span>
          </div>
          
          <h3 className="font-medium text-foreground">
            {audience.affaires?.reference} - {audience.affaires?.intitule}
          </h3>
          
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {new Date(audience.date).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </span>
            {audience.heure && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {audience.heure}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {audience.affaires?.juridiction} - {audience.affaires?.chambre}
            </span>
          </div>
          
          {audience.notes_preparation && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              <span className="font-medium">Notes:</span> {audience.notes_preparation}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {isUrgent && (
            <Button variant="destructive" size="sm" onClick={() => onSaisirResultat(audience)}>
              Saisir résultat
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onVoirDetails(audience.affaire_id)}>
            Voir détails
          </Button>
        </div>
      </div>
    </div>
  );
}