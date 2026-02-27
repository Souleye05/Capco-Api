import { Card, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LoyersStatsProps {
    totalEncaisse: number;
    totalCommissions: number;
    totalNet: number;
}

export function LoyersStats({ totalEncaisse, totalCommissions, totalNet }: LoyersStatsProps) {
    const stats = [
        { label: 'Total encaissé', value: totalEncaisse, color: 'text-success', bg: 'bg-success/10' },
        { label: 'Commissions CAPCO', value: totalCommissions, color: 'text-warning', bg: 'bg-warning/10' },
        { label: 'Net propriétaires', value: totalNet, color: 'text-info', bg: 'bg-info/10' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                                <Receipt className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider text-[10px]">{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.color}`}>{formatCurrency(stat.value)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
