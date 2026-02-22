import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FinancialOverviewProps {
    stats: {
        ratioEncaissement: number;
        montantPrevu: number;
        totalPaiements: number;
        totalDepenses: number;
        benefice: number;
    };
}

export function FinancialOverview({ stats }: FinancialOverviewProps) {
    return (
        <Card className="border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="bg-primary/10 pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Résumé Financier
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-black text-muted-foreground uppercase tracking-widest">
                        <span>Encaissements</span>
                        <span>{Math.round(stats.ratioEncaissement)}%</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                        <div
                            className="h-full bg-success transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                            style={{ width: `${stats.ratioEncaissement}%` }}
                        />
                    </div>
                </div>

                <div className="grid gap-3 pt-2">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Honoraires</span>
                        <span className="font-black text-primary">{formatCurrency(stats.montantPrevu)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-success/10 border border-success/20">
                        <span className="text-xs font-bold text-success uppercase">Reçu</span>
                        <span className="font-black text-success">{formatCurrency(stats.totalPaiements)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                        <span className="text-xs font-bold text-destructive uppercase">Dépenses</span>
                        <span className="font-black text-destructive">{formatCurrency(stats.totalDepenses)}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-dashed">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground text-white shadow-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block mb-1">Bénéfice Net Estimé</span>
                        <p className="text-3xl font-black italic tracking-tighter">
                            {formatCurrency(stats.benefice)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
