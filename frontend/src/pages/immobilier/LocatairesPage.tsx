import { useState } from 'react';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { CreateLocataireDialog, EditLocataireDialog } from '@/components/immobilier/LocataireDialogs';
import { Plus, Search } from 'lucide-react';
import { useLocatairesPage } from '@/hooks/useLocatairesPage';
import { LocatairesStats } from '@/components/immobilier/locataires/LocatairesStats';
import { LocatairesTable } from '@/components/immobilier/locataires/LocatairesTable';
import { type LocataireComplete } from '@/hooks/useLocataires';

export default function LocatairesPage() {
  const { user } = useNestJSAuth();
  const {
    filteredLocataires,
    searchTerm,
    setSearchTerm,
    isLoading,
    totalCount,
    activeLeasesCount
  } = useLocatairesPage();

  const [selectedLocataire, setSelectedLocataire] = useState<LocataireComplete | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleEdit = (locataire: LocataireComplete) => {
    setSelectedLocataire(locataire);
    setEditDialogOpen(true);
  };

  const handleDetail = (locataire: LocataireComplete) => {
    setSelectedLocataire(locataire);
    setDetailDialogOpen(true);
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

      <LocatairesStats
        totalLocataires={totalCount}
        activeLeases={activeLeasesCount}
        unpaidCount={0}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un locataire..."
                className="pl-9 h-11 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <LocatairesTable
            locataires={filteredLocataires}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDetail={handleDetail}
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
