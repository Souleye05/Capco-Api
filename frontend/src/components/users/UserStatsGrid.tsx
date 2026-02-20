import { Users, UserCheck, UserX, Shield, Clock } from 'lucide-react';
import { StatCard } from './StatCard';

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
            color="text-primary"
            bgColor="bg-primary/10"
        />
        <StatCard
            title="Actifs"
            value={stats.actifs}
            icon={UserCheck}
            color="text-success"
            bgColor="bg-success/10"
        />
        <StatCard
            title="Inactifs"
            value={stats.inactifs}
            icon={UserX}
            color="text-destructive"
            bgColor="bg-destructive/10"
        />
        <StatCard
            title="Admins"
            value={stats.admins}
            icon={Shield}
            color="text-primary"
            bgColor="bg-primary/10"
        />
        <StatCard
            title="Collaborateurs"
            value={stats.collabs}
            icon={Users}
            color="text-muted-foreground"
            bgColor="bg-muted"
        />
        <StatCard
            title="Récent"
            value={stats.recent}
            icon={Clock}
            color="text-[hsl(var(--status-upcoming))]"
            bgColor="bg-[hsl(var(--status-upcoming)/0.1)]"
        />
    </div>
);
