import { Users, FileText, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface LocatairesStatsProps {
    totalLocataires: number;
    activeLeases: number;
    unpaidCount: number;
}

export function LocatairesStats({ totalLocataires, activeLeases, unpaidCount }: LocatairesStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Locataires" value={totalLocataires} icon={Users} variant="primary" />
            <StatCard title="Baux actifs" value={activeLeases} icon={FileText} variant="success" />
            <StatCard title="Impayés" value={unpaidCount} icon={AlertTriangle} variant="destructive" />
        </div>
    );
}
