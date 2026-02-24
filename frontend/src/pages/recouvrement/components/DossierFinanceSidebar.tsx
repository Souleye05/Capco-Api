import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DossierRecouvrement } from '@/hooks/useRecouvrement';
import { generateRapportActionsPDF } from '@/utils/generateRapportActionsPDF';

export const DossierFinanceSidebar = ({ dossier }: { dossier: DossierRecouvrement }) => {
    const progress = (dossier.totalPaiements / dossier.totalARecouvrer) * 100;

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-recouvrement" /> Progression
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-end text-xs font-bold text-slate-400">
                            <span className="uppercase">Taux de recouvrement</span>
                            <span className="text-lg text-recouvrement font-black">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    <Separator className="bg-slate-50" />

                    <div className="space-y-3">
                        <FinancialRow label="Principal" value={formatCurrency(dossier.montantPrincipal)} />
                        <FinancialRow label="Pénalités" value={formatCurrency(dossier.penalitesInterets)} />
                        <FinancialRow label="Total dû" value={formatCurrency(dossier.totalARecouvrer)} bold />
                    </div>

                    <Button
                        className="w-full bg-slate-900 hover:bg-black font-bold h-11"
                        onClick={() => generateRapportActionsPDF({
                            dossier,
                            actions: dossier.actions || [],
                            paiements: dossier.paiements || [],
                            totalEncaisse: dossier.totalPaiements,
                            soldeRestant: dossier.soldeRestant
                        })}
                    >
                        <Download className="mr-2 h-4 w-4" /> Rapport PDF
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-recouvrement/20 bg-recouvrement/5 shadow-none">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold text-recouvrement/60 uppercase tracking-widest flex items-center gap-2">
                        <Receipt className="h-4 w-4" /> Honoraires
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="p-4 bg-white rounded-xl shadow-sm border border-recouvrement/20">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Impact Honoraires</p>
                        <p className="text-2xl font-black text-recouvrement">{formatCurrency(dossier.totalARecouvrer * 0.1)}</p>
                    </div>
                    <Button variant="link" className="text-xs text-recouvrement font-bold uppercase p-0">Modifier convention</Button>
                </CardContent>
            </Card>
        </div>
    );
};

const FinancialRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className={`flex justify-between items-center ${bold ? 'pt-2 border-t border-slate-50' : 'text-xs'}`}>
        <span className={`font-medium ${bold ? 'text-xs text-slate-800 font-bold' : 'text-slate-400'}`}>{label}</span>
        <span className={`${bold ? 'text-sm font-black text-slate-900' : 'text-slate-700 font-bold'}`}>{value}</span>
    </div>
);
