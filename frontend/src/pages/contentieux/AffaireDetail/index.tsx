import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Calendar, Clock, AlertTriangle, Banknote, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ResultatAudienceDialog } from '@/components/dialogs/ResultatAudienceDialog';
import { NouvelleAudienceDialog } from '@/components/dialogs/NouvelleAudienceDialog';

import { useAffaireLogic } from './useAffaireLogic';
import { CaseInfoCard } from './CaseInfoCard';
import { FinancialOverview } from './FinancialOverview';
import { FinanceHistory } from './FinanceHistory';
import { ExpensesHistory } from './ExpensesHistory';
import { AudienceTimeline } from './AudienceTimeline';
import { AffaireDialogs } from './AffaireDialogs';

export default function AffaireDetailPage() {
    const { data, finance, ui, actions, loading } = useAffaireLogic();

    if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse uppercase tracking-widest text-primary/40 text-xl">Chargement du dossier...</div>;
    if (!data.affaire) return <div className="p-8 text-center text-xl font-bold">Affaire non trouvée</div>;

    const { affaire, audiences, honoraires, depenses, paiements } = data;

    return (
        <div className="space-y-6 pb-12 w-full animate-fade-in">
            <PageHeader
                title={affaire.reference}
                description={affaire.intitule}
                backLink="/contentieux/affaires"
                actions={[
                    { label: "Nouvelle audience", icon: <Calendar className="h-4 w-4" />, onClick: () => ui.setShowNouvelleAudience(true) },
                    { label: "Compte Rendu", icon: <FileText className="h-4 w-4" />, onClick: () => ui.setShowCompteRendu(true), variant: "outline" }
                ]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Audiences" value={audiences.length} icon={Calendar} variant="default" className="shadow-sm" />
                <StatCard title="À venir" value={audiences.filter((a: any) => a.statut === 'A_VENIR').length} icon={Clock} variant="info" className="shadow-sm" />
                <StatCard title="À renseigner" value={audiences.filter((a: any) => a.statut === 'PASSEE_NON_RENSEIGNEE').length} icon={AlertTriangle} variant="destructive" className="shadow-sm" />
                <StatCard title="Solde" value={formatCurrency(finance.solde)} icon={Banknote} variant={finance.solde > 0 ? "warning" : "success"} className="shadow-sm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <CaseInfoCard affaire={affaire} />
                <FinancialOverview stats={{ ...finance, benefice: finance.totalPaiements - finance.totalDepenses }} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <FinanceHistory
                    paiements={paiements}
                    onAddPaiement={() => ui.setShowPaiement(true)}
                    onEditHonoraires={() => ui.setShowHonoraires(true)}
                    honorairesExist={!!honoraires}
                />
                <ExpensesHistory
                    depenses={depenses}
                    onAddDepense={() => ui.setShowDepense(true)}
                    total={finance.totalDepenses}
                />
            </div>

            <AudienceTimeline
                audiences={audiences}
                onSaisirResultat={ui.handleSaisirResultat}
                onPlanifier={() => ui.setShowNouvelleAudience(true)}
                derniereJuridiction={affaire.derniereAudience?.juridiction}
            />

            <ResultatAudienceDialog
                open={ui.showResultat}
                onOpenChange={ui.setShowResultat}
                audienceId={ui.selectedAudience?.id}
                audienceInfo={ui.selectedAudience ? {
                    reference: affaire.reference,
                    intitule: affaire.intitule,
                    date: ui.selectedAudience.date,
                    juridiction: ui.selectedAudience.juridiction || affaire.derniereAudience?.juridiction
                } : undefined}
                mode="edit"
            />
            <NouvelleAudienceDialog open={ui.showNouvelleAudience} onOpenChange={ui.setShowNouvelleAudience} />
            <AffaireDialogs ui={ui} actions={actions} finance={finance} />
        </div>
    );
}
