import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DepenseStatsProps {
    total: number;
    count: number;
}

export function DepenseStats({ total, count }: DepenseStatsProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-wrap gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Total dépenses (filtrées)</p>
                        <p className="text-2xl font-bold text-foreground">{total.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="text-2xl font-bold text-foreground">{count}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
