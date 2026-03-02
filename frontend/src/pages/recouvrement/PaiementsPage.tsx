import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Banknote, Calendar, Plus, Wallet, FileText, Check, ChevronsUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  usePaiementsRecouvrementGlobal,
  usePaiementsStatistics,
  useDossiersRecouvrement,
  useCreatePaiementRecouvrement,
  useUpdatePaiementRecouvrement,
  useDeletePaiementRecouvrement
} from '@/hooks/useRecouvrement';
import { Skeleton } from '@/components/ui/skeleton';
import { PaiementRow } from '@/pages/recouvrement/components/PaiementRow';
import { StatCard } from '@/pages/recouvrement/components/StatCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, cn } from '@/lib/utils';
import { GlobalPaiementFormDialog, ConfirmDeleteDialog, PaiementFormDialog } from '@/pages/recouvrement/components/DossierDialogs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { formatDate, parseDateFromAPI } from '@/lib/date-utils';

const LIMIT = 15;

export default function PaiementsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dossierId, setDossierId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nouveauPaiementOpen, setNouveauPaiementOpen] = useState(false);
  const [dossierComboOpen, setDossierComboOpen] = useState(false);

  // States for Edit/Delete
  const [editingPaiement, setEditingPaiement] = useState<any>(null);
  const [deletingPaiement, setDeletingPaiement] = useState<any>(null);

  const filterParams = {
    search,
    dossierId: dossierId === 'all' ? undefined : dossierId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data: response, isLoading } = usePaiementsRecouvrementGlobal({ ...filterParams, page, limit: LIMIT });
  const { data: stats, isLoading: isLoadingStats } = usePaiementsStatistics(filterParams);
  const { data: dossiersResp } = useDossiersRecouvrement({ limit: 100 });

  const createPaiement = useCreatePaiementRecouvrement();
  const updatePaiement = useUpdatePaiementRecouvrement();
  const deletePaiement = useDeletePaiementRecouvrement();

  const handleCreatePaiement = async (data: any) => {
    try {
      await createPaiement.mutateAsync({ ...data, date: new Date().toISOString() });
      setNouveauPaiementOpen(false);
    } catch (e) { }
  };

  const handleUpdatePaiement = async (data: any) => {
    try {
      if (editingPaiement) {
        await updatePaiement.mutateAsync({ id: editingPaiement.id, data });
        setEditingPaiement(null);
      }
    } catch (e) { }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deletingPaiement) {
        await deletePaiement.mutateAsync({ id: deletingPaiement.id, dossierId: deletingPaiement.dossierId });
        setDeletingPaiement(null);
      }
    } catch (e) { }
  };

  const dossiers = dossiersResp?.data || [];
  const totalPages = response?.total ? Math.ceil(response.total / LIMIT) : 1;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Historique des Paiements"
        subtitle="Suivi global de tous les encaissements du module recouvrement"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 shadow-sm bg-white"><Download className="h-4 w-4" /> Exporter</Button>
            <Button onClick={() => setNouveauPaiementOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md">
              <Plus className="h-4 w-4" /> Nouveau paiement
            </Button>
          </div>
        }
      />

      <GlobalPaiementFormDialog
        open={nouveauPaiementOpen}
        onOpenChange={setNouveauPaiementOpen}
        onSubmit={handleCreatePaiement}
        dossiers={dossiers}
      />

      {/* Edit Dialog - Reuse individual form but we need specific dossier context if possible */}
      <PaiementFormDialog
        open={!!editingPaiement}
        onOpenChange={(open) => !open && setEditingPaiement(null)}
        onSubmit={handleUpdatePaiement}
        initialData={editingPaiement}
      />

      <ConfirmDeleteDialog
        open={!!deletingPaiement}
        onOpenChange={(open) => !open && setDeletingPaiement(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer ce paiement ?"
        description={`Voulez-vous vraiment supprimer le paiement de ${deletingPaiement ? formatCurrency(deletingPaiement.montant) : ''} ? Cette action est irréversible.`}
      />

      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Encaissé"
            value={formatCurrency(stats?.totalMontant || 0)}
            icon={<Wallet className="text-success h-5 w-5" />}
            loading={isLoadingStats}
            subtext="Cumul de tous les versements"
          />
          <StatCard
            title="Nombre de Paiements"
            value={stats?.nombrePaiements || 0}
            icon={<FileText className="text-primary h-5 w-5" />}
            loading={isLoadingStats}
            subtext="Transactions enregistrées"
          />
          <StatCard
            title="Dernier Paiement"
            value={stats?.dernierPaiement ? formatDate(parseDateFromAPI(stats.dernierPaiement)) : 'N/A'}
            icon={<Calendar className="text-warning h-5 w-5" />}
            loading={isLoadingStats}
            subtext="Date du dernier encaissement"
          />
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end">
              <div className="relative w-full lg:w-96 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Chercher reference, débiteur, créancier..."
                  className="pl-10 bg-slate-50 border-none h-11 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-start sm:items-end">
                <div className="flex flex-col gap-1.5 w-full sm:w-[240px]">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Dossier</Label>
                  <Popover open={dossierComboOpen} onOpenChange={setDossierComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={dossierComboOpen}
                        className="w-full justify-between bg-slate-50 border-none h-11 text-xs font-medium"
                      >
                        {dossierId === "all"
                          ? "Tous les dossiers"
                          : dossiers.find((d) => d.id === dossierId)?.reference || "Sélectionner..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un dossier..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucun dossier trouvé.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setDossierId("all");
                                setDossierComboOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  dossierId === "all" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Tous les dossiers
                            </CommandItem>
                            {dossiers.map((d) => (
                              <CommandItem
                                key={d.id}
                                value={`${d.reference} ${d.debiteurNom}`}
                                onSelect={() => {
                                  setDossierId(d.id);
                                  setDossierComboOpen(false);
                                }}
                                className="text-xs"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    dossierId === d.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-bold">{d.reference}</span>
                                  <span className="text-[10px] text-slate-400">{d.debiteurNom}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Période (Début - Fin)</Label>
                  <div className="flex items-center bg-slate-50 rounded-md px-3 gap-2 h-11">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      className="bg-transparent border-none text-[11px] focus:outline-none placeholder:text-slate-300"
                      value={startDate}
                      title="Date de début"
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-slate-300 mx-1 font-bold">-</span>
                    <input
                      type="date"
                      className="bg-transparent border-none text-[11px] focus:outline-none placeholder:text-slate-300"
                      value={endDate}
                      title="Date de fin"
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="border-slate-100 h-11 w-11 hover:bg-slate-50 transition-colors"
                    onClick={() => { setDossierId('all'); setStartDate(''); setEndDate(''); setSearch(''); }}
                    title="Réinitialiser les filtres"
                  >
                    <Filter className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 mt-6">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400 pl-6">Date</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Dossier / Réf</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Débiteur / Créancier</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Mode</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-slate-400">Montant</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase text-slate-400 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6} className="py-4"><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : !response?.data?.length ? (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center"><Banknote className="h-12 w-12 opacity-5 mx-auto mb-2" /><p className="text-slate-400">Aucun paiement enregistré</p></TableCell></TableRow>
                ) : (
                  response.data.map(p => <PaiementRow key={p.id} paiement={p} onEdit={setEditingPaiement} onDelete={setDeletingPaiement} />)
                )}
              </TableBody>
            </Table>
          </CardContent>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
              <span className="text-xs text-slate-400 font-medium">Page {page} sur {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 border-slate-200" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
                <Button variant="outline" size="sm" className="h-8 border-slate-200" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}