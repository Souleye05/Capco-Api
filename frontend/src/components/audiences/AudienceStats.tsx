import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AudienceStatsProps {
    stats?: {
        aVenir: number;
        nonRenseignees: number;
        tenues: number;
    };
    counts: {
        aVenir: number;
        nonRenseignees: number;
        renseignees: number;
    };
}

export function AudienceStats({ stats, counts }: AudienceStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/50">
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-medium">À venir</p>
                    <p className="text-2xl font-semibold text-info mt-1">{stats?.aVenir ?? counts.aVenir}</p>
                </CardContent>
            </Card>

            <Card className={cn("border-border/50", counts.nonRenseignees > 0 && "border-destructive/30 bg-destructive/5")}>
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-medium">Non renseignées</p>
                    <p className="text-2xl font-semibold text-destructive mt-1">{stats?.nonRenseignees ?? counts.nonRenseignees}</p>
                </CardContent>
            </Card>

            <Card className="border-border/50">
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-medium">Renseignées</p>
                    <p className="text-2xl font-semibold text-success mt-1">{stats?.tenues ?? counts.renseignees}</p>
                </CardContent>
            </Card>
        </div>
    );
}
