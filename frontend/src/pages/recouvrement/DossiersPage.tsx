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

export default function DossiersPage() {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('all');
  const [nouveauDossierOpen, setNouveauDossierOpen] = useState(false);

  const { data: response, isLoading } = useDossiersRecouvrement({
    search,
    statut: statut === 'all' ? undefined : statut
  });
  const { data: stats, isLoading: isLoadingStats } = useRecouvrementDashboard();

  return (
    <div className="min-h-screen bg-slate-50/50">
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
      </div>
    </div>
  );
}
