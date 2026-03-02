import { useState } from 'react';
import {
  Plus,
  Download,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLoyersPage } from '@/hooks/useLoyersPage';
import { LoyersStats } from '@/components/immobilier/loyers/LoyersStats';
import { LoyersFilters } from '@/components/immobilier/loyers/LoyersFilters';
import { LoyersTable } from '@/components/immobilier/loyers/LoyersTable';
import { NouvelEncaissementDialog } from '@/components/immobilier/loyers/NouvelEncaissementDialog';

export default function LoyersPage() {
  const {
    encaissements,
    allEncaissementsCount,
    immeubles,
    lots,
    uniqueMois,
    totals,
    isLoading,
    filters,
    page,
    setPage,
    pagination,
    deleteEncaissement,
    updateEncaissement
  } = useLoyersPage();

  const [encaissementDialogOpen, setEncaissementDialogOpen] = useState(false);

  const handleExport = () => {
    toast.success('Génération de l\'export Excel en cours...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Gestion des Loyers"
        subtitle={`${allEncaissementsCount} règlements enregistrés au total`}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport} className="gap-2 rounded-xl h-11 border-border/50 font-bold">
              <Download className="h-4 w-4" />
              Exporter (Excel)
            </Button>
            <Button className="gap-2 rounded-xl h-11 bg-primary font-black px-6 shadow-lg shadow-primary/20" onClick={() => setEncaissementDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvel encaissement
            </Button>
          </div>
        }
      />

      <div className="p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
        <LoyersStats {...totals} />

        <LoyersFilters
          immeubles={immeubles}
          lots={lots}
          uniqueMois={uniqueMois}
          filters={filters}
        />

        <LoyersTable
          encaissements={encaissements}
          pagination={pagination}
          onPageChange={setPage}
          onDelete={deleteEncaissement}
          onUpdate={updateEncaissement}
        />
      </div>

      <NouvelEncaissementDialog
        open={encaissementDialogOpen}
        onOpenChange={setEncaissementDialogOpen}
        immeubles={immeubles}
        lots={lots}
      />
    </div>
  );
}
