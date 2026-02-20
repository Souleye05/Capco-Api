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
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { NouvelleAudienceDialog } from '@/components/dialogs/NouvelleAudienceDialog';
import { ResultatAudienceDialog } from '@/components/dialogs/ResultatAudienceDialog';
import { useAudiences, AudienceDB } from '@/hooks/useAudiences';
import { cn } from '@/lib/utils';

const statutLabels = {
  A_VENIR: { label: 'À venir', className: 'bg-info/10 text-info border-info/20' },
  PASSEE_NON_RENSEIGNEE: { label: 'Non renseignée', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  RENSEIGNEE: { label: 'Renseignée', className: 'bg-success/10 text-success border-success/20' }
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
  const audiencesRenseignees = audiences.filter(a => a.statut === 'RENSEIGNEE');

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
      const d = new Date(a.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Audiences" subtitle="Chargement..." breadcrumbs={[{ label: 'Contentieux' }, { label: 'Audiences' }]} />
        <div className="p-6 lg:p-8 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Audiences" 
        subtitle={`${audiences.length} audiences • ${audiencesNonRenseignees.length} à régulariser`}
        breadcrumbs={[
          { label: 'Contentieux', href: '/contentieux/affaires' },
          { label: 'Audiences' },
        ]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setShowNouvelleAudience(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle audience
          </Button>
        }
      />

      <NouvelleAudienceDialog open={showNouvelleAudience} onOpenChange={setShowNouvelleAudience} />
      <ResultatAudienceDialog open={showResultatAudience} onOpenChange={setShowResultatAudience} audience={selectedAudience} />

      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">À venir</p>
              <p className="text-2xl font-semibold text-info mt-1">{audiencesAVenir.length}</p>
            </CardContent>
          </Card>
          <Card className={cn("border-border/50", audiencesNonRenseignees.length > 0 && "border-destructive/30 bg-destructive/5")}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Non renseignées</p>
              <p className="text-2xl font-semibold text-destructive mt-1">{audiencesNonRenseignees.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Renseignées</p>
              <p className="text-2xl font-semibold text-success mt-1">{audiencesRenseignees.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        {audiencesNonRenseignees.length > 0 && (
          <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive text-sm">
                {audiencesNonRenseignees.length} audience(s) nécessitant un résultat
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saisissez le résultat pour régulariser ces audiences.
              </p>
            </div>
          </div>
        )}

        {/* Filters + View toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher..." className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setView('list')}>
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setView('calendar')}>
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {view === 'list' ? (
          <Tabs defaultValue={audiencesNonRenseignees.length > 0 ? 'non-renseignees' : 'a-venir'} className="space-y-4">
            <TabsList className="h-9">
              <TabsTrigger value="a-venir" className="text-xs gap-1.5">
                À venir
                <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">{audiencesAVenir.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="non-renseignees" className="text-xs gap-1.5">
                Non renseignées
                {audiencesNonRenseignees.length > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">{audiencesNonRenseignees.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="toutes" className="text-xs">Toutes</TabsTrigger>
            </TabsList>

            <TabsContent value="a-venir" className="space-y-3">
              {audiencesAVenir.length === 0 ? (
                <EmptyState message="Aucune audience à venir" />
              ) : (
                audiencesAVenir.map((a) => (
                  <AudienceCard key={a.id} audience={a} onSaisirResultat={handleSaisirResultat} onVoirDetails={(id) => navigate(`/contentieux/affaires/${id}`)} />
                ))
              )}
            </TabsContent>
            <TabsContent value="non-renseignees" className="space-y-3">
              {audiencesNonRenseignees.length === 0 ? (
                <EmptyState message="Aucune audience à régulariser" />
              ) : (
                audiencesNonRenseignees.map((a) => (
                  <AudienceCard key={a.id} audience={a} onSaisirResultat={handleSaisirResultat} onVoirDetails={(id) => navigate(`/contentieux/affaires/${id}`)} />
                ))
              )}
            </TabsContent>
            <TabsContent value="toutes" className="space-y-3">
              {audiences.length === 0 ? (
                <EmptyState message="Aucune audience" />
              ) : (
                audiences.map((a) => (
                  <AudienceCard key={a.id} audience={a} onSaisirResultat={handleSaisirResultat} onVoirDetails={(id) => navigate(`/contentieux/affaires/${id}`)} />
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold capitalize">
                  {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentMonth(new Date())}>
                    Aujourd'hui
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="bg-muted/50 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`e-${i}`} className="h-20 bg-muted/10" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayAudiences = getAudiencesForDay(day);
                  const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                  
                  return (
                    <div key={day} className={cn('h-20 bg-card p-1 transition-colors hover:bg-muted/30', isToday && 'bg-primary/5 ring-1 ring-primary/20')}>
                      <div className={cn('text-xs font-medium mb-0.5', isToday && 'text-primary')}>{day}</div>
                      <div className="space-y-0.5">
                        {dayAudiences.slice(0, 2).map((a) => (
                          <div key={a.id} className={cn(
                            'text-[10px] px-1 py-0.5 rounded truncate cursor-pointer',
                            a.statut === 'PASSEE_NON_RENSEIGNEE' ? 'bg-destructive text-destructive-foreground' : 'bg-info/10 text-info'
                          )}>
                            {a.heure && `${a.heure} `}{a.affaires?.reference}
                          </div>
                        ))}
                        {dayAudiences.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">+{dayAudiences.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function AudienceCard({ audience, onSaisirResultat, onVoirDetails }: {
  audience: AudienceDB;
  onSaisirResultat: (a: AudienceDB) => void;
  onVoirDetails: (id: string) => void;
}) {
  const isUrgent = audience.statut === 'PASSEE_NON_RENSEIGNEE';
  
  return (
    <Card className={cn('border-border/50 transition-all hover:shadow-sm', isUrgent && 'border-destructive/30')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={cn('text-[11px]', statutLabels[audience.statut].className)}>
                {statutLabels[audience.statut].label}
              </Badge>
              <Badge variant="secondary" className="text-[11px]">
                {objetLabels[audience.objet]}
              </Badge>
            </div>
            
            <p className="font-medium text-sm text-foreground">
              {audience.affaires?.reference} — {audience.affaires?.intitule}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {new Date(audience.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {audience.heure && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {audience.heure}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {audience.affaires?.juridiction}
              </span>
            </div>

            {audience.notes_preparation && (
              <p className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded line-clamp-2">
                {audience.notes_preparation}
              </p>
            )}
          </div>
          
          <div className="flex gap-1.5 shrink-0">
            {isUrgent && (
              <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => onSaisirResultat(audience)}>
                Saisir résultat
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onVoirDetails(audience.affaire_id)}>
              Détails
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
