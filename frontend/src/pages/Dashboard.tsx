import { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Gavel,
  Banknote,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Home,
  Plus,
  Briefcase,
  Users,
  CreditCard,
  Wallet,
  Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { AlertesList } from '@/components/dashboard/AlertesList';
import { AudiencesDemain } from '@/components/dashboard/AudiencesDemain';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Button } from '@/components/ui/button';
import { NouvelleActionDialog } from '@/components/dialogs/NouvelleActionDialog';
import { formatCurrency } from '@/lib/utils';
import { formatDateLong } from '@/lib/date-utils';
import capcoLogo from '@/assets/capco-logo.png';
import { useDashboardStats, useAudiencesDemain } from '@/hooks/useDashboardStats';
import { useAlertes } from '@/hooks/useAlertes';

export default function Dashboard() {
  const [showNouvelleAction, setShowNouvelleAction] = useState(false);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: audiencesDemain = [], isLoading: audiencesLoading } = useAudiencesDemain();
  const { data: alertes = [], isLoading: alertesLoading } = useAlertes();

  const isLoading = statsLoading || audiencesLoading || alertesLoading;

  // Default stats if loading
  const defaultStats = {
    contentieux: { audiencesDemain: 0, audiencesNonRenseignees: 0, prochainesAudiences: 0, affairesActives: 0, honorairesFactures: 0, honorairesEncaisses: 0, honorairesEnAttente: 0 },
    recouvrement: { dossiersEnCours: 0, montantARecouvrer: 0, totalEncaisse: 0, dossiersSansAction7j: 0, dossiersSansAction30j: 0, honorairesFactures: 0, honorairesEncaisses: 0, honorairesEnAttente: 0 },
    immobilier: { loyersAttendusMois: 0, loyersEncaissesMois: 0, impayesMois: 0, depensesMois: 0, commissionsCAPCO: 0, commissionsAttenduesMois: 0 },
    conseil: { clientsActifs: 0, facturesEnAttente: 0, montantFactureMois: 0, montantEncaisseMois: 0, tachesMois: 0 }
  };

  const currentStats = stats || defaultStats;
  const urgentAlertes = alertes.filter(a => !a.lu && a.priorite === 'HAUTE');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Tableau de bord"
        description={`${formatDateLong(new Date())}`}
        action={{
          label: "Nouvelle action",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setShowNouvelleAction(true)
        }}
      />

      <NouvelleActionDialog
        open={showNouvelleAction}
        onOpenChange={setShowNouvelleAction}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Alertes urgentes */}
        {urgentAlertes.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold text-destructive">Actions urgentes requises</h2>
            </div>
            <AlertesList
              alertes={urgentAlertes}
              limit={3}
            />
          </div>
        )}

        {/* Récapitulatif Honoraires */}
        <section className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-success" />
            <h2 className="section-title mb-0">Récapitulatif des Honoraires CAPCO</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contentieux */}
            <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Gavel className="h-4 w-4 text-info" />
                <h3 className="font-semibold">Contentieux</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Facturés</p>
                  <p className="text-lg font-bold">{formatCurrency(currentStats.contentieux.honorairesFactures)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Encaissés</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(currentStats.contentieux.honorairesEncaisses)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">En attente</p>
                  <p className="text-lg font-bold text-warning">{formatCurrency(currentStats.contentieux.honorairesEnAttente)}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${currentStats.contentieux.honorairesFactures > 0 ? (currentStats.contentieux.honorairesEncaisses / currentStats.contentieux.honorairesFactures) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {currentStats.contentieux.honorairesFactures > 0 ? ((currentStats.contentieux.honorairesEncaisses / currentStats.contentieux.honorairesFactures) * 100).toFixed(0) : 0}% encaissés
                </p>
              </div>
            </div>

            {/* Recouvrement */}
            <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="h-4 w-4 text-success" />
                <h3 className="font-semibold">Recouvrement</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Facturés</p>
                  <p className="text-lg font-bold">{formatCurrency(currentStats.recouvrement.honorairesFactures)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Encaissés</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(currentStats.recouvrement.honorairesEncaisses)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">En attente</p>
                  <p className="text-lg font-bold text-warning">{formatCurrency(currentStats.recouvrement.honorairesEnAttente)}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${currentStats.recouvrement.honorairesFactures > 0 ? (currentStats.recouvrement.honorairesEncaisses / currentStats.recouvrement.honorairesFactures) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {currentStats.recouvrement.honorairesFactures > 0 ? ((currentStats.recouvrement.honorairesEncaisses / currentStats.recouvrement.honorairesFactures) * 100).toFixed(0) : 0}% encaissés
                </p>
              </div>
            </div>
          </div>

          {/* Total combiné */}
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total facturé</p>
                <p className="text-2xl font-bold">{formatCurrency(currentStats.contentieux.honorairesFactures + currentStats.recouvrement.honorairesFactures)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total encaissé</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(currentStats.contentieux.honorairesEncaisses + currentStats.recouvrement.honorairesEncaisses)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total en attente</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(currentStats.contentieux.honorairesEnAttente + currentStats.recouvrement.honorairesEnAttente)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Contentieux */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="h-5 w-5 text-info" />
            <h2 className="section-title mb-0">Contentieux</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Audiences demain"
              value={currentStats.contentieux.audiencesDemain}
              icon={Calendar}
              variant="contentieux"
            />
            <StatCard
              title="Non renseignées"
              value={currentStats.contentieux.audiencesNonRenseignees}
              icon={AlertTriangle}
              variant={currentStats.contentieux.audiencesNonRenseignees > 0 ? 'destructive' : 'default'}
              subtitle="À régulariser"
            />
            <StatCard
              title="Prochaines audiences"
              value={currentStats.contentieux.prochainesAudiences}
              icon={Clock}
              variant="contentieux"
            />
            <StatCard
              title="Affaires actives"
              value={currentStats.contentieux.affairesActives}
              icon={FileText}
              variant="contentieux"
            />
          </div>
        </section>

        {/* Stats Recouvrement */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="h-5 w-5 text-success" />
            <h2 className="section-title mb-0">Recouvrement</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Dossiers en cours"
              value={currentStats.recouvrement.dossiersEnCours}
              icon={FileText}
              variant="recouvrement"
            />
            <StatCard
              title="À recouvrer"
              value={formatCurrency(currentStats.recouvrement.montantARecouvrer)}
              icon={TrendingUp}
              variant="recouvrement"
            />
            <StatCard
              title="Total encaissé"
              value={formatCurrency(currentStats.recouvrement.totalEncaisse)}
              icon={CreditCard}
              variant="recouvrement"
            />
            <StatCard
              title="Sans action +7j"
              value={currentStats.recouvrement.dossiersSansAction7j + currentStats.recouvrement.dossiersSansAction30j}
              icon={AlertTriangle}
              variant={currentStats.recouvrement.dossiersSansAction7j > 0 ? 'destructive' : 'default'}
              subtitle="Relance nécessaire"
            />
          </div>
        </section>

        {/* Stats Immobilier */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-immobilier" />
            <h2 className="section-title mb-0">Gestion Immobilière</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Loyers attendus"
              value={formatCurrency(currentStats.immobilier.loyersAttendusMois)}
              icon={Home}
              variant="immobilier"
              subtitle="Ce mois"
            />
            <StatCard
              title="Loyers encaissés"
              value={formatCurrency(currentStats.immobilier.loyersEncaissesMois)}
              icon={CreditCard}
              variant="immobilier"
            />
            <StatCard
              title="Impayés"
              value={formatCurrency(currentStats.immobilier.impayesMois)}
              icon={TrendingDown}
              variant={currentStats.immobilier.impayesMois > 0 ? 'destructive' : 'default'}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <StatCard
              title="Dépenses"
              value={formatCurrency(currentStats.immobilier.depensesMois)}
              icon={Banknote}
              variant="default"
              subtitle="Ce mois"
            />
            <StatCard
              title="Commissions attendues"
              value={formatCurrency(currentStats.immobilier.commissionsAttenduesMois)}
              icon={TrendingUp}
              variant="immobilier"
              subtitle="Ce mois"
            />
            <StatCard
              title="Commissions encaissées"
              value={formatCurrency(currentStats.immobilier.commissionsCAPCO)}
              icon={Wallet}
              variant="immobilier"
              subtitle="Ce mois"
            />
          </div>
        </section>

        {/* Stats Conseils */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="section-title mb-0">Conseils / Assistance juridique</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Clients actifs"
              value={currentStats.conseil.clientsActifs}
              icon={Users}
              variant="default"
            />
            <StatCard
              title="Factures en attente"
              value={currentStats.conseil.facturesEnAttente}
              icon={FileText}
              variant={currentStats.conseil.facturesEnAttente > 0 ? 'destructive' : 'default'}
            />
            <StatCard
              title="Facturé ce mois"
              value={formatCurrency(currentStats.conseil.montantFactureMois)}
              icon={TrendingUp}
              variant="default"
            />
            <StatCard
              title="Encaissé ce mois"
              value={formatCurrency(currentStats.conseil.montantEncaisseMois)}
              icon={CreditCard}
              variant="default"
            />
            <StatCard
              title="Tâches du mois"
              value={currentStats.conseil.tachesMois}
              icon={Briefcase}
              variant="default"
            />
          </div>
        </section>

        {/* Two columns: Audiences demain + Activité récente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audiences de demain */}
          <section className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Audiences de demain</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Voir tout
              </Button>
            </div>
            <AudiencesDemain audiences={audiencesDemain} />
          </section>

          {/* Activité récente */}
          <section className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Activité récente</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Voir tout
              </Button>
            </div>
            <RecentActivity />
          </section>
        </div>
      </div>
    </div>
  );
}
