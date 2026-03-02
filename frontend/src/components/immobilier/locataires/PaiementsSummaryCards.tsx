import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, Calendar, TrendingUp,
  Clock, AlertTriangle, CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Encaissement } from '@/types/payment';
import { calculatePaymentStatistics, formatDaysSincePayment } from '@/lib/payment-utils';

interface PaiementsSummaryCardsProps {
  encaissements: Encaissement[];
}

export function PaiementsSummaryCards({ encaissements }: PaiementsSummaryCardsProps) {
  const stats = calculatePaymentStatistics(encaissements);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Paid */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Total payé
              </Label>
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(stats.totalPaye)}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.nombrePaiements} paiement{stats.nombrePaiements > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Month */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Ce mois
              </Label>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.currentMonthTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.currentMonthCount} paiement{stats.currentMonthCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Payment */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Moyenne
              </Label>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.moyennePaiement)}
              </p>
              <p className="text-xs text-muted-foreground">
                par paiement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.paymentStatus.color === 'green' ? 'bg-accent/10 text-accent' :
                stats.paymentStatus.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  stats.paymentStatus.color === 'red' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
              }`}>
              {stats.paymentStatus.status === 'good' ? <CheckCircle className="h-5 w-5" /> :
                stats.paymentStatus.status === 'warning' ? <Clock className="h-5 w-5" /> :
                  stats.paymentStatus.status === 'late' ? <AlertTriangle className="h-5 w-5" /> :
                    <Clock className="h-5 w-5" />}
            </div>
            <div>
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Statut
              </Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant={stats.paymentStatus.status === 'good' ? 'default' :
                    stats.paymentStatus.status === 'warning' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {stats.paymentStatus.status === 'good' ? 'À jour' :
                    stats.paymentStatus.status === 'warning' ? 'Attention' :
                      stats.paymentStatus.status === 'late' ? 'En retard' : 'Inconnu'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDaysSincePayment(stats.daysSinceLastPayment)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}