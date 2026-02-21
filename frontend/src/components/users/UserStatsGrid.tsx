import { Users, UserCheck, UserX, Shield, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface UserStatsGridProps {
    stats: {
        total: number;
        actifs: number;
        inactifs: number;
        admins: number;
        collabs: number;
        recent: number;
    };
}

export const UserStatsGrid = ({ stats }: UserStatsGridProps) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
            title="Total"
            value={stats.total}
            icon={Users}
            variant="primary"
        />
        <StatCard
            title="Actifs"
            value={stats.actifs}
            icon={UserCheck}
            variant="success"
        />
        <StatCard
            title="Inactifs"
            value={stats.inactifs}
            icon={UserX}
            variant="destructive"
        />
        <StatCard
            title="Admins"
            value={stats.admins}
            icon={Shield}
            variant="primary"
        />
        <StatCard
            title="Collabs"
            value={stats.collabs}
            icon={Users}
            variant="default"
        />
        <StatCard
            title="Récent"
            value={stats.recent}
            icon={Clock}
            variant="info"
        />
    </div>
);
