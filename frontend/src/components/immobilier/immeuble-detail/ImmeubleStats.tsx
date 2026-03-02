import { Card, CardContent } from '@/components/ui/card';
import { Receipt, TrendingDown, Percent, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ImmeubleStatsProps {
    totalLoyers: number;
    totalDepenses: number;
    totalCommissions: number;
    netProprietaire: number;
    tauxCommission: number;
}

export function ImmeubleStats({
    totalLoyers,
    totalDepenses,
    totalCommissions,
    netProprietaire,
    tauxCommission
}: ImmeubleStatsProps) {
    const stats = [
        {
            label: 'Loyers encaissés',
            value: totalLoyers,
            icon: Receipt,
            bg: 'bg-success/10',
            color: 'text-success'
        },
        {
            label: 'Dépenses',
            value: totalDepenses,
            icon: TrendingDown,
            bg: 'bg-destructive/10',
            color: 'text-destructive'
        },
        {
            label: `Commissions CAPCO (${tauxCommission}%)`,
            value: totalCommissions,
            icon: Percent,
            bg: 'bg-warning/10',
            color: 'text-warning'
        },
        {
            label: 'Net propriétaire',
            value: netProprietaire,
            icon: Users,
            bg: 'bg-primary/10',
            color: 'text-primary'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-bold">
                                    {stat.bg.includes('destructive') ? '-' : ''}{formatCurrency(stat.value)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
