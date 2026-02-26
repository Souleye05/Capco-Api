import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Send, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { parseDateFromAPI } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RapportsTabProps {
    rapports: any[];
    immeuble: any;
    onGenerateRapport: () => void;
    isLoading: boolean;
}

export function RapportsTab({ rapports, immeuble, onGenerateRapport, isLoading }: RapportsTabProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Rapports de gestion</CardTitle>
                <Button size="sm" className="gap-2" onClick={onGenerateRapport} disabled={isLoading}>
                    <Plus className="h-4 w-4" />
                    Générer nouveau
                </Button>
            </CardHeader>
            <CardContent>
                {rapports.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucun rapport généré pour cet immeuble</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rapports.map(rapport => (
                            <div key={rapport.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded bg-primary/10">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">
                                            Période: {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeDebut))} - {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.periodeFin))}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Généré le {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(parseDateFromAPI(rapport.dateGeneration))}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right mr-4">
                                        <p className="text-sm font-semibold">{formatCurrency(Number(rapport.netProprietaire))}</p>
                                        <p className="text-xs text-muted-foreground">Net propriétaire</p>
                                    </div>
                                    <Badge className={cn(
                                        rapport.statut === 'GENERE' && 'bg-success/10 text-success',
                                        rapport.statut === 'ENVOYE' && 'bg-primary/10 text-primary'
                                    )}>
                                        {rapport.statut}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
