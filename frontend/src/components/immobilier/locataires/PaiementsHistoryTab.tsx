import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard, Filter, Download, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEncaissementsByLocataire } from '@/hooks/useLocataires';
import { PaiementsSummaryCards } from './PaiementsSummaryCards';
import { PaiementsChart } from './PaiementsChart';
import { PaymentErrorBoundary } from './PaymentErrorBoundary';
import { formatCurrency } from '@/lib/utils';
import { Encaissement, PaymentMode, PaymentFilters } from '@/types/payment';
import { PAYMENT_MODE_ICONS, PAYMENT_MODE_LABELS } from '@/lib/payment-constants';
import { filterEncaissements } from '@/lib/payment-utils';

interface PaiementsHistoryTabProps {
  locataireId: string;
}

export function PaiementsHistoryTab({ locataireId }: PaiementsHistoryTabProps) {
  const { data: encaissements = [], isLoading, error } = useEncaissementsByLocataire(locataireId);
  const [filters, setFilters] = useState<PaymentFilters>({
    selectedPeriod: 'all',
    selectedMode: 'all',
    searchTerm: ''
  });

  // Filter encaissements based on selected filters
  const filteredEncaissements = filterEncaissements(encaissements as Encaissement[], filters);

  // Group by payment mode
  const parMode = filteredEncaissements.reduce((acc: Record<string, { count: number; total: number }>, enc) => {
    const mode = enc.modePaiement;
    if (!acc[mode]) {
      acc[mode] = { count: 0, total: 0 };
    }
    acc[mode].count++;
    acc[mode].total += enc.montantEncaisse;
    return acc;
  }, {});

  const handleExport = () => {
    try {
      // TODO: Implement CSV export
      console.log('Export payments history');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const updateFilter = (key: keyof PaymentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (error) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-6 text-center">
          <div className="text-red-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold">Erreur de chargement</p>
            <p className="text-sm">Impossible de charger l'historique des paiements.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl border-border/50">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PaymentErrorBoundary>
      <div className="space-y-6">
        {/* Enhanced Statistics Cards */}
        <PaymentErrorBoundary>
          <PaiementsSummaryCards encaissements={filteredEncaissements} />
        </PaymentErrorBoundary>

        {/* Monthly Chart */}
        <PaymentErrorBoundary>
          <PaiementsChart encaissements={filteredEncaissements} />
        </PaymentErrorBoundary>

      {/* Filters */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Recherche
              </Label>
              <Input
                placeholder="Immeuble, lot, mois..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Période
              </Label>
              <Select value={filters.selectedPeriod} onValueChange={(value) => updateFilter('selectedPeriod', value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Mode de paiement
              </Label>
              <Select value={filters.selectedMode} onValueChange={(value) => updateFilter('selectedMode', value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modes</SelectItem>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="VIREMENT">Virement</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                  <SelectItem value="WAVE">Wave</SelectItem>
                  <SelectItem value="OM">Orange Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleExport} className="rounded-xl">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modes Summary */}
      {Object.keys(parMode).length > 0 && (
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold">Répartition par mode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(parMode).map(([mode, stats]) => {
                const Icon = PAYMENT_MODE_ICONS[mode as PaymentMode] || CreditCard;
                return (
                  <div key={mode} className="text-center p-4 bg-muted/30 rounded-xl border border-border/30">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {PAYMENT_MODE_LABELS[mode as PaymentMode] || mode}
                    </p>
                    <p className="text-lg font-bold">{formatCurrency(stats.total)}</p>
                    <p className="text-xs text-muted-foreground">{stats.count} paiement{stats.count > 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments History Table */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Historique des paiements ({filteredEncaissements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEncaissements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold">Aucun paiement trouvé</p>
              <p className="text-sm">Aucun paiement ne correspond aux critères sélectionnés.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Mois concerné</TableHead>
                    <TableHead className="font-bold">Lot</TableHead>
                    <TableHead className="font-bold">Montant</TableHead>
                    <TableHead className="font-bold">Mode</TableHead>
                    <TableHead className="font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEncaissements.map((encaissement) => {
                    const Icon = PAYMENT_MODE_ICONS[encaissement.modePaiement] || CreditCard;
                    return (
                      <TableRow key={encaissement.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          {format(new Date(encaissement.dateEncaissement), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg">
                            {encaissement.moisConcerne}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{encaissement.immeubleNom}</p>
                            <p className="text-sm text-muted-foreground">Lot {encaissement.lotNumero}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-green-600">
                            {formatCurrency(encaissement.montantEncaisse)}
                          </p>
                          {encaissement.commissionCapco > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Commission: {formatCurrency(encaissement.commissionCapco)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {PAYMENT_MODE_LABELS[encaissement.modePaiement] || encaissement.modePaiement}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="rounded-lg">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-[32px]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <CreditCard className="h-5 w-5" />
                                  Détails du paiement
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                      Date
                                    </Label>
                                    <p className="font-medium">
                                      {format(new Date(encaissement.dateEncaissement), 'dd MMMM yyyy', { locale: fr })}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                      Mois concerné
                                    </Label>
                                    <p className="font-medium">{encaissement.moisConcerne}</p>
                                  </div>
                                </div>
                                <Separator />
                                <div>
                                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Propriété
                                  </Label>
                                  <p className="font-medium">{encaissement.immeubleNom} - Lot {encaissement.lotNumero}</p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                      Montant encaissé
                                    </Label>
                                    <p className="text-lg font-bold text-green-600">
                                      {formatCurrency(encaissement.montantEncaisse)}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                      Mode de paiement
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {PAYMENT_MODE_LABELS[encaissement.modePaiement] || encaissement.modePaiement}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {encaissement.commissionCapco > 0 && (
                                  <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                          Commission CAPCO
                                        </Label>
                                        <p className="font-medium text-orange-600">
                                          {formatCurrency(encaissement.commissionCapco)}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                          Net propriétaire
                                        </Label>
                                        <p className="font-medium text-blue-600">
                                          {formatCurrency(encaissement.netProprietaire)}
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                )}
                                {encaissement.observation && (
                                  <>
                                    <Separator />
                                    <div>
                                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Observation
                                      </Label>
                                      <p className="font-medium">{encaissement.observation}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PaymentErrorBoundary>
  );
}