import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatFCFA = (n: number | undefined | null) => {
    if (n === undefined || n === null || isNaN(n)) return '0 FCFA';
    return n.toLocaleString('fr-FR') + ' FCFA';
};

export function StatCard({ title, value, sub, color = "text-foreground", rate }: { title: string, value: string, sub?: string, color?: string, rate?: number }) {
    return (
        <Card>
            <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                {rate !== undefined && (
                    <>
                        <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                            <div className={`h-full ${rate >= 75 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${rate}%` }} />
                        </div>
                    </>
                )}
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </CardContent>
        </Card>
    );
}

export function ResumeImmeubles({ data }: { data: any[] }) {
    if (data.length === 0) return null;
    return (
        <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex gap-2"><Building2 className="w-4 h-4" /> Par immeuble</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.map((r, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between font-medium"><span>{r.nom}</span> <Badge variant="outline">{r.count}</Badge></div>
                        <div className="flex justify-between"><span>Dû: <span className="text-destructive font-medium">{formatFCFA(r.due)}</span></span> <span>Payé: <span className="text-success font-medium">{formatFCFA(r.paye)}</span></span></div>
                        <div className="text-warning font-bold">Solde: {formatFCFA(r.solde)}</div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
