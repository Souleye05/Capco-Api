import { Card, CardContent } from '@/components/ui/card';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ImpayesStatsProps {
    totalAttendu: number;
    totalImpayes: number;
    totalPayes: number;
    nbImpayes: number;
}

export function ImpayesStats({ totalAttendu, totalImpayes, totalPayes, nbImpayes }: ImpayesStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted group-hover:bg-muted/80 transition-colors">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Loyers attendus</p>
                            <p className="text-2xl font-bold">{formatCurrency(totalAttendu)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className={cn(nbImpayes > 0 && "border-destructive/50 ring-1 ring-destructive/10 bg-destructive/5")}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Impayés ({nbImpayes})</p>
                            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalImpayes)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/10">
                            <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Encaissés</p>
                            <p className="text-2xl font-bold text-success">{formatCurrency(totalPayes)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
