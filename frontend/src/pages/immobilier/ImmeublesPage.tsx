import {
  Plus,
  Search,
  Download,
  Upload
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination-custom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NouvelImmeubleDialog } from '@/components/dialogs/NouvelImmeubleDialog';
import { EditImmeubleDialog } from '@/components/dialogs/EditImmeubleDialog';
import { ImportExcelDialog } from '@/components/dialogs/ImportExcelDialog';
import { toast } from 'sonner';
import { useImmeublesPage } from '@/hooks/useImmeublesPage';
import { useTemplates } from '@/hooks/useTemplates';
import { ImmeublesGrid } from '@/components/immobilier/immeubles/ImmeublesGrid';

export default function ImmeublesPage() {
  const {
    immeubles,
    allImmeublesCount,
    lots,
    encaissements,
    currentMonth,
    isLoading,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    pagination,
    dialogs
  } = useImmeublesPage();

  const { downloadImportTemplate, isDownloading } = useTemplates();

  const handleRapport = (nom: string) => {
    toast.success(`Rapport généré pour ${nom}`);
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Gestion Immobilière"
        subtitle={`${allImmeublesCount} immeubles gérés`}
        actions={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2 rounded-xl" 
              onClick={downloadImportTemplate}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4" />
              {isDownloading ? 'Téléchargement...' : 'Template'}
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => dialogs.setShowImportExcel(true)}>
              <Upload className="h-4 w-4" />
              Importer
            </Button>
            <Button className="gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20" onClick={() => dialogs.setShowNouvelImmeuble(true)}>
              <Plus className="h-4 w-4" />
              Nouvel immeuble
            </Button>
          </div>
        }
      />

      <div className="p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative max-w-md mb-10 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder="Rechercher par nom, adresse ou propriétaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-border/50 bg-background shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <ImmeublesGrid
          immeubles={immeubles}
          lots={lots}
          encaissements={encaissements}
          currentMonth={currentMonth}
          isLoading={isLoading}
          onEdit={dialogs.setEditingImmeuble}
          onRapport={handleRapport}
          onNew={() => dialogs.setShowNouvelImmeuble(true)}
        />

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <NouvelImmeubleDialog
        open={dialogs.showNouvelImmeuble}
        onOpenChange={dialogs.setShowNouvelImmeuble}
      />

      <ImportExcelDialog
        open={dialogs.showImportExcel}
        onOpenChange={dialogs.setShowImportExcel}
      />

      {dialogs.editingImmeuble && (
        <EditImmeubleDialog
          open={!!dialogs.editingImmeuble}
          onOpenChange={(open) => !open && dialogs.setEditingImmeuble(null)}
          immeuble={dialogs.editingImmeuble}
        />
      )}
    </div>
  );
}
