import { useState, useEffect } from 'react';
import { parseDateFromAPI } from '@/lib/date-utils';
import { Header } from '@/components/layout/Header';
import { useImpayesPage, type LoyerAttendu } from '@/hooks/useImpayesPage';
import { ImpayesStats } from '@/components/immobilier/impayes/ImpayesStats';
import { ImpayesFilters } from '@/components/immobilier/impayes/ImpayesFilters';
import { ImpayesTable } from '@/components/immobilier/impayes/ImpayesTable';
import { PaiementLoyerDialog } from '@/components/immobilier/impayes/PaiementLoyerDialog';
import { Loader2 } from 'lucide-react';

export default function ImpayesPage() {
  const {
    loyersAttendus,
    totals,
    availableMonths,
    immeubles,
    isLoading,
    filters
  } = useImpayesPage();

  const [selectedLoyer, setSelectedLoyer] = useState<LoyerAttendu | null>(null);
  const [paiementDialogOpen, setPaiementDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Or whatever feels right for the dashboard

  // Reset page when data/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [loyersAttendus.length, filters.selectedImmeuble, filters.searchQuery, filters.selectedMois, filters.showPaidOnly]);

  const handlePaiementClick = (loyer: LoyerAttendu) => {
    setSelectedLoyer(loyer);
    setPaiementDialogOpen(true);
  };

  const totalPages = Math.ceil(loyersAttendus.length / itemsPerPage);
  const paginatedLoyers = loyersAttendus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const formattedMois = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(parseDateFromAPI(filters.selectedMois + '-01'));

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Suivi des Loyers"
        subtitle={`${totals.nbImpayes} impayé(s) identifié(s) pour ${formattedMois}`}
      />

      <div className="p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
        <ImpayesStats {...totals} />

        <ImpayesFilters
          availableMonths={availableMonths}
          immeubles={immeubles}
          filters={filters}
        />

        <ImpayesTable
          loyers={paginatedLoyers}
          onPaiement={handlePaiementClick}
          pagination={{
            page: currentPage,
            totalPages,
            total: loyersAttendus.length
          }}
          onPageChange={setCurrentPage}
        />
      </div>

      <PaiementLoyerDialog
        open={paiementDialogOpen}
        onOpenChange={setPaiementDialogOpen}
        loyer={selectedLoyer}
      />
    </div>
  );
}
