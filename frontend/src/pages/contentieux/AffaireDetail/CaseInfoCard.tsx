import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, StatusVariant } from '@/components/ui/status-badge';
import { Scale, Building2, Users, Phone, MapPin } from 'lucide-react';
import { parseDateFromAPI, formatDateShort } from '@/lib/date-utils';

const statutLabels: Record<string, { label: string; variant: StatusVariant }> = {
    ACTIVE: { label: 'Active', variant: 'success' },
    CLOTUREE: { label: 'Clôturée', variant: 'muted' },
    RADIEE: { label: 'Radiée', variant: 'destructive' }
};

export function CaseInfoCard({ affaire }: { affaire: any }) {
    const demandeurs = affaire.demandeurs || [];
    const defendeurs = affaire.defendeurs || [];

    return (
        <Card className="md:col-span-2 overflow-hidden border-none shadow-xl bg-card transition-all">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                        <Scale className="h-5 w-5 text-primary" />
                        Détails du Dossier
                    </CardTitle>
                    <StatusBadge
                        label={statutLabels[affaire.statut]?.label || affaire.statut}
                        variant={statutLabels[affaire.statut]?.variant || 'default'}
                        className="scale-110"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1 p-4 rounded-xl bg-muted/20 border border-border/50">
                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            Juridiction
                        </h4>
                        <p className="font-bold text-foreground text-lg truncate" title={affaire.derniereAudience?.juridiction}>
                            {affaire.derniereAudience?.juridiction || 'Non renseignée'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Chambre: <span className="font-medium text-foreground">{affaire.derniereAudience?.chambre || 'N/A'}</span>
                        </p>
                    </div>
                    <div className="space-y-1 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Scale className="h-3 w-3" />
                            Date de Création
                        </h4>
                        <p className="font-bold text-foreground text-lg">
                            {formatDateShort(parseDateFromAPI(affaire.createdAt))}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 pt-2">
                    <div className="bg-success/5 p-4 rounded-xl border border-success/10 min-w-0">
                        <h4 className="text-xs font-black text-success uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Partie Demanderesse
                        </h4>
                        <div className="space-y-3">
                            {demandeurs.map((p: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center gap-2 group min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center font-bold text-success text-xs shrink-0">
                                            {p.nom.charAt(0)}
                                        </div>
                                        <span className="font-bold group-hover:text-success transition-colors truncate" title={p.nom}>{p.nom}</span>
                                    </div>
                                    {p.telephone && (
                                        <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3 shrink-0" />
                                            <span>{p.telephone}</span>
                                        </div>
                                    )}
                                    {p.adresse && (
                                        <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate" title={p.adresse}>{p.adresse}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10 min-w-0">
                        <h4 className="text-xs font-black text-destructive uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Partie Défenderesse
                        </h4>
                        <div className="space-y-3">
                            {defendeurs.map((p: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center gap-2 group min-w-0">
                                        <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center font-bold text-destructive text-xs shrink-0">
                                            {p.nom.charAt(0)}
                                        </div>
                                        <span className="font-bold group-hover:text-destructive transition-colors truncate" title={p.nom}>{p.nom}</span>
                                    </div>
                                    {p.telephone && (
                                        <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3 shrink-0" />
                                            <span>{p.telephone}</span>
                                        </div>
                                    )}
                                    {p.adresse && (
                                        <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate" title={p.adresse}>{p.adresse}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {affaire.observations && (
                    <div className="pt-2">
                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">Observations & Notes</h4>
                        <div className="text-sm bg-muted/40 p-4 rounded-xl border border-dashed border-border text-foreground leading-relaxed whitespace-pre-wrap">
                            {affaire.observations}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
