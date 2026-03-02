import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DossierRecouvrement } from '@/hooks/useRecouvrement';

export const DossierSummaryCards = ({ dossier }: { dossier: DossierRecouvrement }) => {
    const progress = (dossier.totalPaiements / dossier.totalARecouvrer) * 100;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
                label="Total à Recouvrer"
                value={formatCurrency(dossier.totalARecouvrer)}
                icon={<TrendingUp className="h-24 w-24" />}
                bgColor="bg-primary"
            />
            <StatCard
                label="Déjà Encaissé"
                value={formatCurrency(dossier.totalPaiements)}
                icon={<CheckCircle2 className="h-24 w-24" />}
                bgColor="bg-success"
                subtext={`${progress.toFixed(1)}% du total`}
            />
            <StatCard
                label="Solde Restant"
                value={formatCurrency(dossier.soldeRestant)}
                icon={<AlertTriangle className="h-24 w-24" />}
                bgColor="bg-warning"
            />
        </div>
    );
};

const StatCard = ({ label, value, icon, bgColor, subtext }: any) => (
    <Card className={`border-none shadow-sm ${bgColor} text-white overflow-hidden relative`}>
        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">{icon}</div>
        <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">{label}</p>
            <p className="text-2xl font-black">{value}</p>
            {subtext && <p className="text-[10px] font-bold opacity-80 italic">{subtext}</p>}
        </CardContent>
    </Card>
);
