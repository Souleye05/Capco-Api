import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Plus, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TypeDepenseDossier } from '@/types';

const typeDepenseLabels: Record<TypeDepenseDossier, string> = {
    FRAIS_HUISSIER: 'Frais Huissier',
    FRAIS_GREFFE: 'Frais Greffe',
    TIMBRES_FISCAUX: 'Timbres fiscaux',
    FRAIS_COURRIER: 'Courrier',
    FRAIS_DEPLACEMENT: 'Déplacement',
    FRAIS_EXPERTISE: 'Expertise',
    AUTRES: 'Autres'
};

interface ExpensesHistoryProps {
    depenses: any[];
    onAddDepense: () => void;
    total: number;
}

export function ExpensesHistory({ depenses, onAddDepense, total }: ExpensesHistoryProps) {
    return (
        <Card className="border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/20">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-destructive" />
                    Dépenses
                </CardTitle>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/10 shrink-0">
                        {formatCurrency(total)}
                    </div>
                    <Button
                        size="sm"
                        onClick={onAddDepense}
                        className="rounded-full h-8 px-4 font-black text-[10px] uppercase tracking-wider bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 border-none ml-1 shrink-0"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Nouvelle
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {depenses.length > 0 ? (
                    <div className="divide-y divide-border/30">
                        {depenses.map((d) => (
                            <div key={d.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-all group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-10 w-10 rounded-2xl bg-destructive/5 flex items-center justify-center text-destructive shrink-0 group-hover:scale-110 transition-transform border border-destructive/10 text-xs">
                                        <History className="h-5 w-5 opacity-60" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm tracking-tight text-foreground truncate capitalize">
                                            {d.nature}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded text-muted-foreground/70">
                                                {typeDepenseLabels[d.typeDepense as TypeDepenseDossier] || d.typeDepense}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium italic opacity-60">
                                                {format(new Date(d.date), 'dd MMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-sm text-destructive">
                                        -{formatCurrency(Number(d.montant))}
                                    </p>
                                    {d.description && (
                                        <p className="text-[10px] text-muted-foreground italic truncate max-w-[120px] opacity-70" title={d.description}>
                                            {d.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-3">
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium italic">
                            Aucune dépense enregistrée.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
