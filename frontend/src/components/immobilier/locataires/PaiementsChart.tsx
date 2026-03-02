import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Encaissement } from '@/types/payment';
import { groupPaymentsByMonth } from '@/lib/payment-utils';
import { CHART_CONFIG } from '@/lib/payment-constants';

interface PaiementsChartProps {
  encaissements: Encaissement[];
}

export function PaiementsChart({ encaissements }: PaiementsChartProps) {
  const monthlyData = groupPaymentsByMonth(encaissements);

  // Find max amount for scaling
  const maxAmount = Math.max(...monthlyData.map((data) => data.total), 0);

  if (monthlyData.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Évolution mensuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-bold">Aucune donnée</p>
          <p className="text-sm">Aucun paiement à afficher.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Évolution mensuelle ({monthlyData.length} mois)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart bars */}
          <div className="space-y-3">
            {monthlyData.map((data) => {
              const percentage = maxAmount > 0 ? (data.total / maxAmount) * 100 : 0;
              const monthLabel = data.month.includes('-')
                ? format(parseISO(data.month + '-01'), 'MMM yyyy', { locale: fr })
                : data.month;

              return (
                <div key={data.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{monthLabel}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {data.count} paiement{data.count > 1 ? 's' : ''}
                      </Badge>
                      <span className="font-bold text-accent">
                        {formatCurrency(data.total)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(percentage, CHART_CONFIG.MIN_BAR_WIDTH_PERCENTAGE)}%` }}
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${monthLabel}: ${formatCurrency(data.total)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          <div className="pt-4 border-t border-border/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total période
                </p>
                <p className="text-lg font-bold text-accent">
                  {formatCurrency(monthlyData.reduce((sum, data) => sum + data.total, 0))}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Moyenne mensuelle
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(monthlyData.reduce((sum, data) => sum + data.total, 0) / monthlyData.length)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Meilleur mois
                </p>
                <p className="text-lg font-bold text-sidebar-primary">
                  {formatCurrency(Math.max(...monthlyData.map((data) => data.total)))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}