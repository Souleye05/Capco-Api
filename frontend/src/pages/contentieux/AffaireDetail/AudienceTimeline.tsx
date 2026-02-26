import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { parseDateFromAPI } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';

const objetLabels: Record<string, string> = {
    CONCILIATION: 'Conciliation',
    PLAIDOIRIE: 'Plaidoirie',
    MISE_EN_ETAT: 'Mise en état',
    DELIBERE: 'Délibéré',
    REFERE: 'Référé'
};

interface AudienceTimelineProps {
    audiences: any[];
    onSaisirResultat: (audience: any) => void;
    onPlanifier: () => void;
    derniereJuridiction?: string;
}

export function AudienceTimeline({ audiences, onSaisirResultat, onPlanifier, derniereJuridiction }: AudienceTimelineProps) {
    const sorted = [...audiences].sort((a, b) => parseDateFromAPI(b.date).getTime() - parseDateFromAPI(a.date).getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chronologie des audiences</CardTitle>
            </CardHeader>
            <CardContent>
                {sorted.length === 0 ? (
                    <div className="py-12 text-center space-y-4">
                        <p className="text-muted-foreground italic">Aucune audience enregistrée.</p>
                        <Button onClick={onPlanifier}>Planifier une audience</Button>
                    </div>
                ) : (
                    <div className="relative pl-6 space-y-6">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                        {sorted.map((a) => {
                            const isUrgent = a.statut === 'PASSEE_NON_RENSEIGNEE';
                            const isUpcoming = a.statut === 'A_VENIR';
                            const hasResultat = a.statut === 'RENSEIGNEE';

                            return (
                                <div key={a.id} className="relative pl-8">
                                    <div className={cn(
                                        'absolute left-[-5px] top-6 w-3 h-3 rounded-full border-2 bg-background',
                                        isUrgent && 'border-destructive bg-destructive',
                                        isUpcoming && 'border-info bg-info',
                                        hasResultat && 'border-success bg-success'
                                    )} />

                                    <Card
                                        className={cn(
                                            'transition-all duration-300 border-none shadow-md overflow-hidden relative group/card',
                                            isUrgent ? 'bg-destructive/5 ring-1 ring-destructive/20 cursor-pointer hover:ring-destructive/40 hover:shadow-lg' : 'bg-card'
                                        )}
                                        onClick={isUrgent ? () => onSaisirResultat(a) : undefined}
                                    >
                                        <CardContent className="p-0 flex">
                                            <div className={cn(
                                                "w-2 transition-all duration-300 group-hover/card:w-3",
                                                isUrgent ? "bg-destructive" : isUpcoming ? "bg-info" : hasResultat ? "bg-success" : "bg-muted"
                                            )} />
                                            <div className="flex-1 p-5 space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap gap-2 items-center">
                                                            <StatusBadge
                                                                label={isUpcoming ? 'À venir' : isUrgent ? 'Non renseignée' : 'Passée'}
                                                                variant={isUpcoming ? 'info' : isUrgent ? 'destructive' : 'muted'}
                                                            />
                                                            <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                                                                {objetLabels[a.type] || a.type}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-foreground">
                                                            <div className="flex items-center gap-1.5 shrink-0 opacity-80"><Calendar className="h-4 w-4 text-primary" /> {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(a.date))}</div>
                                                            {a.heure && <div className="flex items-center gap-1.5 shrink-0 opacity-80"><Clock className="h-4 w-4 text-primary" /> {a.heure}</div>}
                                                            <div className="flex items-center gap-1.5 min-w-0 opacity-80"><MapPin className="h-4 w-4 text-primary shrink-0" /> <span className="truncate">{a.juridiction || derniereJuridiction}</span></div>
                                                        </div>
                                                    </div>
                                                    {isUrgent && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="font-black text-[10px] uppercase tracking-wider rounded-full px-6 shadow-lg shadow-destructive/20 hover:scale-105 transition-transform"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSaisirResultat(a);
                                                            }}
                                                        >
                                                            Saisir résultat
                                                        </Button>
                                                    )}
                                                </div>
                                                {a.notesPreparation && (
                                                    <div className="bg-muted/50 p-3 rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground">
                                                        <span className="font-black uppercase text-[9px] mr-2 opacity-70">Notes:</span> {a.notesPreparation}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
