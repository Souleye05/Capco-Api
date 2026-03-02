import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { CreateLocataireDialog, EditLocataireDialog } from '@/components/immobilier/LocataireDialogs';

import { LocatairesFilters } from '@/components/immobilier/locataires/LocatairesFilters';
import { LocatairesExport } from '@/components/immobilier/locataires/LocatairesExport';
import { Plus, Search } from 'lucide-react';
import { useLocatairesPage } from '@/hooks/useLocatairesPage';
import { LocatairesStats } from '@/components/immobilier/locataires/LocatairesStats';
import { LocatairesTable } from '@/components/immobilier/locataires/LocatairesTable';
import { type LocataireComplete } from '@/hooks/useLocataires';

export default function LocatairesPage() {
  const navigate = useNavigate();
  const { user } = useNestJSAuth();
  const {
    filteredLocataires,
    searchTerm,
    setSearchTerm,
    isLoading,
    totalCount,
    activeLeasesCount,
    pagination,
    setPage
  } = useLocatairesPage();

  const [selectedLocataire, setSelectedLocataire] = useState<LocataireComplete | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [professionFilter, setProfessionFilter] = useState('all');

  const handleEdit = (locataire: LocataireComplete) => {
    setSelectedLocataire(locataire);
    setEditDialogOpen(true);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setProfessionFilter('all');
    setSearchTerm('');
  };

  const handleDetail = (locataire: LocataireComplete) => {
    navigate(`/immobilier/locataires/${locataire.id}`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in bg-background">
      <PageHeader
        title="Gestion des Locataires"
        description="Gérez les informations, baux et documents de vos locataires."
        action={{
          label: "Nouveau Locataire",
          icon: <Plus className="h-5 w-5" />,
          onClick: () => setCreateDialogOpen(true)
        }}
      />

      <div className="flex justify-end mb-4">
        <LocatairesExport
          locataires={filteredLocataires}
          isLoading={isLoading}
        />
      </div>

      <LocatairesStats
        totalLocataires={totalCount}
        activeLeases={activeLeasesCount}
        unpaidCount={0}
        withoutLot={totalCount - activeLeasesCount}
      />

      <LocatairesFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        professionFilter={professionFilter}
        onProfessionFilterChange={setProfessionFilter}
        onClearFilters={handleClearFilters}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <LocatairesTable
            locataires={filteredLocataires}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDetail={handleDetail}
            pagination={pagination}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <CreateLocataireDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userId={user?.id}
      />

      {selectedLocataire && (
        <EditLocataireDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          locataire={selectedLocataire}
        />
      )}
    </div>
  );
}
