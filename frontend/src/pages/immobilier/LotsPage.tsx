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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLotsPage } from '@/hooks/useLotsPage';
import { LotsTable } from '@/components/immobilier/lots/LotsTable';
import { NouvelLotDialog } from '@/components/immobilier/lots/NouvelLotDialog';
import { EditLotDialog } from '@/components/immobilier/lots/EditLotDialog';

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

  const handleEdit = (lot: any) => {
    setEditingLot(lot);
    setEditDialogOpen(true);
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
              className="pl-11 h-12 rounded-2xl border-border/50 bg-background shadow-sm"
            />
          </div>

          <Select value={filters.selectedImmeuble} onValueChange={filters.setSelectedImmeuble}>
            <SelectTrigger className="w-full md:w-[220px] h-12 rounded-2xl border-border/50 bg-background shadow-sm font-medium">
              <SelectValue placeholder="Tous les immeubles" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="font-medium">Tous les immeubles</SelectItem>
              {immeubles.map(imm => (
                <SelectItem key={imm.id} value={imm.id} className="font-medium">{imm.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.selectedStatut} onValueChange={filters.setSelectedStatut}>
            <SelectTrigger className="w-full md:w-[150px] h-12 rounded-2xl border-border/50 bg-background shadow-sm font-medium">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="font-medium">Tous les statuts</SelectItem>
              <SelectItem value="OCCUPE" className="font-medium">Occupés</SelectItem>
              <SelectItem value="LIBRE" className="font-medium">Libres</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <LotsTable
          lots={lots}
          onEdit={handleEdit}
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
    </div>
  );
}
