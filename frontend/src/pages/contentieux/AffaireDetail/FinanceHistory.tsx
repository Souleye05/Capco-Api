import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Banknote, Landmark, Wallet, MoreVertical, Settings } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const modePaiementIcons: Record<string, any> = {
    VIREMENT: Landmark,
    CASH: Banknote,
    CHEQUE: CreditCard,
    WAVE: Wallet,
    OM: Wallet
};

const modePaiementLabels: Record<string, string> = {
    VIREMENT: 'Virement',
    CASH: 'Espèces',
    CHEQUE: 'Chèque',
    WAVE: 'Wave',
    OM: 'Orange Money'
};

interface FinanceHistoryProps {
    paiements: any[];
    onAddPaiement: () => void;
    onEditHonoraires: () => void;
    honorairesExist: boolean;
}

export function FinanceHistory({ paiements, onAddPaiement, onEditHonoraires, honorairesExist }: FinanceHistoryProps) {
    return (
        <Card className="border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/20">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-success" />
                    Paiements reçus
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onEditHonoraires} title={honorairesExist ? 'Modifier honoraires' : 'Définir honoraires'} className="h-8 w-8 rounded-full">
                        <Settings className="h-4 w-4 opacity-50" />
                    </Button>
                    <Button
                        size="sm"
                        onClick={onAddPaiement}
                        disabled={!honorairesExist}
                        className="rounded-full h-8 px-4 font-black text-[10px] uppercase tracking-wider bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 border-none ml-1"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Nouveau
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {paiements.length > 0 ? (
                    <div className="divide-y divide-border/30">
                        {paiements.map((p) => {
                            const Icon = modePaiementIcons[p.modePaiement] || Banknote;
                            return (
                                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-all group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-10 w-10 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0 group-hover:scale-110 transition-transform">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm tracking-tight text-foreground truncate capitalize">
                                                {modePaiementLabels[p.modePaiement] || p.modePaiement}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                                {format(new Date(p.date), 'dd MMMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-sm text-success">
                                            +{formatCurrency(Number(p.montant))}
                                        </p>
                                        {p.notes && (
                                            <p className="text-[10px] text-muted-foreground italic truncate max-w-[120px] opacity-70" title={p.notes}>
                                                {p.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-3">
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                            <Banknote className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium italic">
                            Aucun paiement enregistré pour le moment.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
