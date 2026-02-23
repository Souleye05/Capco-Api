import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, Bell } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NouvelleAudienceDialog } from '@/components/dialogs/NouvelleAudienceDialog';
import { ResultatAudienceDialog } from '@/components/dialogs/ResultatAudienceDialog';

import { useAudiences, useAudiencesStats, useAudiencesRappelEnrolement, AudienceDB } from '@/hooks/useAudiences';
import { useAudienceUI } from '@/hooks/useAudienceUI';

import { AudienceStats } from '@/components/audiences/AudienceStats';
import { AudienceFilters } from '@/components/audiences/AudienceFilters';
import { AudienceCalendar } from '@/components/audiences/AudienceCalendar';
import { AudienceListView } from '@/components/audiences/AudienceListView';

export default function AudiencesPage() {
  const navigate = useNavigate();
  const { data: audiences = [], isLoading } = useAudiences();
  const { data: stats } = useAudiencesStats();
  const { data: audiencesRappel = [] } = useAudiencesRappelEnrolement();

  const [showNouvelleAudience, setShowNouvelleAudience] = useState(false);
  const [showResultatAudience, setShowResultatAudience] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<AudienceDB | null>(null);

  const {
    view, setView,
    viewMode, setViewMode,
    currentMonth, setCurrentMonth,
    selectedDate, setSelectedDate,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    nonRenseignees, aVenir, renseignees,
    events, groupedEvents
  } = useAudienceUI(audiences);

  if (isLoading) return <AudiencesLoading />;

  return (
    <div className="min-h-screen">
      <Header
        title="Audiences"
        subtitle={`${audiences.length} audiences • ${nonRenseignees.length} à régulariser`}
        breadcrumbs={[{ label: 'Contentieux', href: '/contentieux/affaires' }, { label: 'Audiences' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 bg-[#433878] hover:bg-[#433878]/90 text-white" onClick={() => setShowNouvelleAudience(true)}>
              <Plus className="h-4 w-4" /> Nouvelle audience
            </Button>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <AudienceStats stats={stats} counts={{ aVenir: aVenir.length, nonRenseignees: nonRenseignees.length, renseignees: renseignees.length }} />

        {nonRenseignees.length > 0 && (
          <AlertBanner
            type="error"
            title={`${nonRenseignees.length} audience(s) nécessitant un résultat`}
            message="Saisissez le résultat pour régulariser ces audiences."
          />
        )}

        {audiencesRappel.length > 0 && (
          <AlertBanner
            type="warning"
            title={`${audiencesRappel.length} audience(s) nécessitant un rappel d'enrôlement`}
            message="Vérifiez l'enrôlement de ces audiences et marquez-les comme effectuées."
          />
        )}

        <AudienceFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          view={view}
          onViewChange={setView}
          counts={{
            aVenir: aVenir.length,
            nonRenseignees: nonRenseignees.length,
            total: audiences.length
          }}
        />

        {view === 'agenda' ? (
          <AudienceCalendar
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
            events={events}
            onEventClick={(e) => navigate(`/contentieux/audiences/${e.id}`)}
          />
        ) : (
          <AudienceListView
            groupedEvents={groupedEvents}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onEventClick={(e) => navigate(`/contentieux/audiences/${e.id}`)}
            onAddAudience={() => setShowNouvelleAudience(true)}
          />
        )}
      </div>

      <NouvelleAudienceDialog open={showNouvelleAudience} onOpenChange={setShowNouvelleAudience} />
      <ResultatAudienceDialog
        open={showResultatAudience}
        onOpenChange={setShowResultatAudience}
        audienceId={selectedAudience?.id}
        audienceInfo={selectedAudience ? {
          reference: selectedAudience.affaire?.reference || 'N/A',
          intitule: selectedAudience.affaire?.intitule || 'N/A',
          date: selectedAudience.date,
          juridiction: selectedAudience.juridiction
        } : undefined}
        mode="create"
      />
    </div>
  );
}

function AudiencesLoading() {
  return (
    <div className="min-h-screen">
      <Header title="Audiences" subtitle="Chargement..." breadcrumbs={[{ label: 'Contentieux' }, { label: 'Audiences' }]} />
      <div className="p-6 lg:p-8 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
      </div>
    </div>
  );
}

function AlertBanner({ type, title, message }: { type: 'error' | 'warning', title: string, message: string }) {
  const isError = type === 'error';
  return (
    <div className={`flex items-start gap-3 rounded-lg p-4 ${isError ? 'bg-destructive/5 border border-destructive/20' : 'bg-orange-50 border border-orange-200'}`}>
      {isError ? <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" /> : <Bell className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />}
      <div>
        <p className={`font-medium text-sm ${isError ? 'text-destructive' : 'text-orange-700'}`}>{title}</p>
        <p className={`text-xs mt-0.5 ${isError ? 'text-muted-foreground' : 'text-orange-600'}`}>{message}</p>
      </div>
    </div>
  );
}