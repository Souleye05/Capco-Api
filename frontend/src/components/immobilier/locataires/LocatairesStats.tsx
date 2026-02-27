import { Users, FileText, AlertTriangle, Home } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface LocatairesStatsProps {
    totalLocataires: number;
    activeLeases: number;
    unpaidCount: number;
    withoutLot?: number;
}

export function LocatairesStats({ totalLocataires, activeLeases, unpaidCount, withoutLot = 0 }: LocatairesStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
                title="Total Locataires" 
                value={totalLocataires} 
                icon={Users} 
                variant="primary" 
            />
            <StatCard 
                title="Baux actifs" 
                value={activeLeases} 
                icon={FileText} 
                variant="success" 
            />
            <StatCard 
                title="Sans lot assigné" 
                value={withoutLot} 
                icon={Home} 
                variant="warning" 
            />
            <StatCard 
                title="Impayés" 
                value={unpaidCount} 
                icon={AlertTriangle} 
                variant="destructive" 
            />
        </div>
    );
}
