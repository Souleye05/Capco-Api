import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Loader2
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination-custom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useLotsPage } from '@/hooks/useLotsPage';
import { LotsTable } from '@/components/immobilier/lots/LotsTable';
import { NouvelLotDialog } from '@/components/immobilier/lots/NouvelLotDialog';
import { EditLotDialog } from '@/components/immobilier/lots/EditLotDialog';
import { AssignLocataireDialog } from '@/components/immobilier/AssignLocataireDialog';
import { LibererLotDialog } from '@/components/immobilier/LibererLotDialog';

export default function LotsPage() {
  const {
    lots,
    immeubles,
    locataires,
    stats,
    isLoading,
    filters,
    page,
    setPage,
    pagination,
  } = useLotsPage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningLot, setAssigningLot] = useState<any | null>(null);
  const [libererDialogOpen, setLibererDialogOpen] = useState(false);
  const [liberatingLot, setLiberatingLot] = useState<any | null>(null);

  const handleEdit = (lot: any) => {
    setEditingLot(lot);
    setEditDialogOpen(true);
  };

  const handleAssignLocataire = (lot: any) => {
    setAssigningLot(lot);
    setAssignDialogOpen(true);
  };

  const handleLibererLot = (lot: any) => {
    setLiberatingLot(lot);
    setLibererDialogOpen(true);
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
        title="Gestion des Lots"
        subtitle={`${stats.total} lots au total • ${stats.occupes} occupés • ${stats.libres} disponibles`}
        actions={
          <Button className="gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau lot
          </Button>
        }
      />

      <div className="p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Rechercher par numéro ou immeuble..."
              value={filters.searchQuery}
              onChange={(e) => filters.setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-border/50 bg-background/50 backdrop-blur-md shadow-sm transition-all focus:bg-background"
            />
          </div>

          <SearchableSelect
            value={filters.selectedImmeuble}
            onValueChange={filters.setSelectedImmeuble}
            options={[
              { value: "all", label: "Tous les immeubles" },
              ...immeubles.map(imm => ({ value: imm.id, label: imm.nom }))
            ]}
            placeholder="Tous les immeubles"
            className="w-full md:w-[240px] h-12 rounded-2xl border-border/50 bg-background/50 backdrop-blur-md shadow-sm font-bold"
          />

          <SearchableSelect
            value={filters.selectedStatut}
            onValueChange={filters.setSelectedStatut}
            options={[
              { value: "all", label: "Tous les statuts" },
              { value: "OCCUPE", label: "Occupés" },
              { value: "LIBRE", label: "Libres" }
            ]}
            placeholder="Statuts"
            className="w-full md:w-[180px] h-12 rounded-2xl border-border/50 bg-background/50 backdrop-blur-md shadow-sm font-bold"
          />
        </div>

        <LotsTable
          lots={lots}
          onEdit={handleEdit}
          onAssignLocataire={handleAssignLocataire}
          onLibererLot={handleLibererLot}
          pagination={pagination}
          onPageChange={setPage}
        />

      </div>

      <NouvelLotDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        immeubles={immeubles}
      />

      {editingLot && (
        <EditLotDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingLot(null);
          }}
          lot={editingLot}
          locataires={locataires}
        />
      )}

      {assigningLot && (
        <AssignLocataireDialog
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) setAssigningLot(null);
          }}
          lotId={assigningLot.id}
          lotNumero={assigningLot.numero}
          locataires={locataires}
        />
      )}

      {liberatingLot && (
        <LibererLotDialog
          open={libererDialogOpen}
          onOpenChange={(open) => {
            setLibererDialogOpen(open);
            if (!open) setLiberatingLot(null);
          }}
          lotId={liberatingLot.id}
          lotNumero={liberatingLot.numero}
          locataireNom={liberatingLot.locataireNom}
        />
      )}
    </div>
  );
}
