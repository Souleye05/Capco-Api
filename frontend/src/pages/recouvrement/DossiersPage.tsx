import React, { useState } from 'react';
import {
  Plus, Search, Filter, TrendingUp, Clock,
  CheckCircle2, Wallet, FileText
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { NouveauDossierDialog } from '@/components/dialogs/NouveauDossierDialog';
import { useDossiersRecouvrement, useRecouvrementDashboard } from '@/hooks/useRecouvrement';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/pages/recouvrement/components/StatCard';
import { DossierCard } from '@/pages/recouvrement/components/DossierCard';

const LIMIT = 15;

export default function DossiersPage() {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('all');
  const [page, setPage] = useState(1);
  const [nouveauDossierOpen, setNouveauDossierOpen] = useState(false);

  // Revenir à la page 1 si les filtres changent
  React.useEffect(() => {
    setPage(1);
  }, [search, statut]);

  const { data: response, isLoading } = useDossiersRecouvrement({
    search,
    statut: statut === 'all' ? undefined : statut,
    page,
    limit: LIMIT
  });
  const { data: stats, isLoading: isLoadingStats } = useRecouvrementDashboard();

  const totalPages = response?.total ? Math.ceil(response.total / LIMIT) : 1;
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Recouvrement"
        subtitle="Gestion des créances et dossiers de recouvrement"
        actions={
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-sm transition-all text-white" onClick={() => setNouveauDossierOpen(true)}>
            <Plus className="h-4 w-4" /> Nouveau dossier
          </Button>
        }
      />

      <NouveauDossierDialog open={nouveauDossierOpen} onOpenChange={setNouveauDossierOpen} />

      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total à Recouvrer"
            value={formatCurrency(stats?.synthese?.totalARecouvrer || 0)}
            icon={<TrendingUp className="text-recouvrement" />}
            loading={isLoadingStats}
          />
          <StatCard
            title="Total Recouvré"
            value={formatCurrency(stats?.synthese?.totalRecouvre || 0)}
            icon={<Wallet className="text-success" />}
            loading={isLoadingStats}
            subtext={`${stats?.synthese?.tauxRecouvrement || 0}% encaissé`}
          />
          <StatCard
            title="Dossiers Actifs"
            value={stats?.dossiers?.enCours || 0}
            icon={<Clock className="text-warning" />}
            loading={isLoadingStats}
          />
          <StatCard
            title="Dossiers Clôturés"
            value={stats?.dossiers?.clotures || 0}
            icon={<CheckCircle2 className="text-primary" />}
            loading={isLoadingStats}
          />
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher..."
              className="pl-10 bg-slate-50 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-50 border-none">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                <SelectItem value="CLOTURE">Clôturé</SelectItem>
                <SelectItem value="ANNULE">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="border-slate-100"><Filter className="h-4 w-4 text-slate-500" /></Button>
          </div>
        </div>

        {/* Results List */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          ) : !response?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <FileText className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-lg font-medium">Aucun dossier trouvé</p>
            </div>
          ) : (
            response.data.map(dossier => <DossierCard key={dossier.id} dossier={dossier} />)
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">Page {page} sur {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 border-slate-200 bg-white" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <Button variant="outline" size="sm" className="h-8 border-slate-200 bg-white" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
