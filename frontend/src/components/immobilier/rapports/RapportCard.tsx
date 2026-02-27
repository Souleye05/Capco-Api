import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-immobilier/10">
                            <FileText className="h-6 w-6 text-immobilier" />
                        </div>
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {rapport.immeubleNom || rapport.immeubles?.nom}
                            </h3>
                            <p className="text-lg font-medium mt-1">
                                Rapport {format(parseDateFromAPI(rapport.periodeDebut), 'MMMM yyyy', { locale: fr })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Période: {format(parseDateFromAPI(rapport.periodeDebut), 'dd/MM/yyyy')} - {format(parseDateFromAPI(rapport.periodeFin), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Généré le {format(parseDateFromAPI(rapport.dateGeneration), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                            </p>
                        </div>
                    </div>
                    <Badge className={cn(
                        rapport.statut === 'GENERE' && 'bg-success/10 text-success',
                        rapport.statut === 'ENVOYE' && 'bg-primary/10 text-primary',
                        rapport.statut === 'BROUILLON' && 'bg-muted text-muted-foreground'
                    )}>
                        {rapport.statut}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Loyers encaissés</p>
                        <p className="text-lg font-semibold text-success">{formatCurrency(rapport.totalLoyers)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Dépenses</p>
                        <p className="text-lg font-semibold text-destructive">-{formatCurrency(rapport.totalDepenses)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Commissions CAPCO</p>
                        <p className="text-lg font-semibold text-immobilier">-{formatCurrency(rapport.totalCommissions)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Net propriétaire</p>
                        <p className="text-lg font-bold">{formatCurrency(rapport.netProprietaire)}</p>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onPreview(rapport)}>
                        <Eye className="h-4 w-4" />
                        Aperçu
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onDownload(rapport)}>
                        <Download className="h-4 w-4" />
                        Télécharger PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onSend(rapport)}>
                        <Send className="h-4 w-4" />
                        Envoyer
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
