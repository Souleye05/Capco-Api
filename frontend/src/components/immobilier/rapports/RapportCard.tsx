import { FileText, Building2, Download, Eye, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';

interface RapportCardProps {
    rapport: any;
    onPreview: (rapport: any) => void;
    onDownload: (rapport: any) => void;
    onSend: (rapport: any) => void;
}

export function RapportCard({ rapport, onPreview, onDownload, onSend }: RapportCardProps) {
    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-border/50 group overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-5">
                        <div className="p-4 rounded-[20px] bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-black text-foreground">{rapport.immeubleNom}</span>
                                <Badge className={cn(
                                    "font-bold py-0.5 px-2 ml-2",
                                    rapport.statut === 'GENERE' && 'bg-success text-success-foreground border-none',
                                    rapport.statut === 'ENVOYE' && 'bg-primary text-primary-foreground border-none',
                                    rapport.statut === 'BROUILLON' && 'bg-muted text-muted-foreground'
                                )}>
                                    {rapport.statut}
                                </Badge>
                            </div>
                            <h3 className="text-xl font-black tracking-tight">
                                Rapport {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeDebut))}
                            </h3>
                            <p className="text-sm font-bold text-muted-foreground">
                                Période: {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeDebut))} — {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeFin))}
                            </p>
                            <div className="pt-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                Généré le {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.dateGeneration))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 md:max-w-xl p-4 bg-muted/30 rounded-2xl border border-border/30">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Loyers</p>
                            <p className="font-black text-success">{formatCurrency(rapport.totalLoyers)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Dépenses</p>
                            <p className="font-black text-destructive">-{formatCurrency(rapport.totalDepenses)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Commission</p>
                            <p className="font-black text-immobilier">-{formatCurrency(rapport.totalCommissions)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Net Proprio</p>
                            <p className="font-black text-foreground text-lg">{formatCurrency(rapport.netProprietaire)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl font-bold border-border/50 hover:bg-muted" onClick={() => onPreview(rapport)}>
                        <Eye className="h-4 w-4" /> Aperçu détaillé
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl font-bold border-border/50 hover:bg-muted" onClick={() => onDownload(rapport)}>
                        <Download className="h-4 w-4" /> Télécharger (PDF)
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl font-bold border-border/50 hover:bg-primary/10 hover:text-primary transition-all" onClick={() => onSend(rapport)}>
                        <Send className="h-4 w-4" /> Envoyer au propriétaire
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
