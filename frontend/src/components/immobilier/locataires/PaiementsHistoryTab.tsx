import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
  DialogDescription
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard, Filter, Download, Eye, Search, Calendar, Wallet, TrendingUp, Info
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

  const filteredEncaissements = filterEncaissements(encaissements as Encaissement[], filters);

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
      <div className="p-8 text-center bg-destructive/5 rounded-[2rem] border border-destructive/10 backdrop-blur-sm">
        <div className="text-destructive">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-black tracking-tight tracking-tight">Erreur de chargement</p>
          <p className="text-sm font-medium opacity-70">Impossible de charger l'historique des paiements.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-[2rem] border border-border/10"></div>
          ))}
        </div>
        <div className="h-96 bg-muted/20 animate-pulse rounded-[2rem] border border-border/10"></div>
      </div>
    );
  }

  return (
    <PaymentErrorBoundary>
      <div className="space-y-8 pb-10">
        <PaiementsSummaryCards encaissements={filteredEncaissements} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <PaiementsChart encaissements={filteredEncaissements} />
          </div>

          <div className="space-y-6">
            <div className="bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-5 w-1 bg-accent rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60">Filtres rapides</h3>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Recherche</Label>
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors z-10" />
                    <Input
                      placeholder="Lot, mois..."
                      value={filters.searchTerm}
                      onChange={(e) => updateFilter('searchTerm', e.target.value)}
                      className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-medium focus:bg-background transition-all shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Période</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-accent transition-colors pointer-events-none" />
                    <SearchableSelect
                      value={filters.selectedPeriod}
                      onValueChange={(value) => updateFilter('selectedPeriod', value)}
                      options={[
                        { value: "all", label: "Toutes les années" },
                        { value: "2026", label: "Année 2026" },
                        { value: "2025", label: "Année 2025" },
                        { value: "2024", label: "Année 2024" }
                      ]}
                      placeholder="Période"
                      className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-accent/5 shadow-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-foreground/70 ml-1">Mode de paiement</Label>
                  <div className="relative group">
                    <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-accent transition-colors pointer-events-none" />
                    <SearchableSelect
                      value={filters.selectedMode}
                      onValueChange={(value) => updateFilter('selectedMode', value)}
                      options={[
                        { value: "all", label: "Tous les modes" },
                        { value: "CASH", label: "Espèces" },
                        { value: "VIREMENT", label: "Virement" },
                        { value: "CHEQUE", label: "Chèque" },
                        { value: "WAVE", label: "Wave" },
                        { value: "OM", label: "Orange Money" }
                      ]}
                      placeholder="Mode"
                      className="h-11 pl-10 rounded-xl bg-muted/20 border-border/40 text-sm font-bold focus:ring-4 focus:ring-accent/5 shadow-none transition-all"
                    />
                  </div>
                </div>

                <Button variant="outline" onClick={handleExport} className="w-full h-11 rounded-xl border-border/40 bg-background/50 hover:bg-accent/5 hover:text-accent transition-all font-black text-[10px] uppercase tracking-widest mt-2">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter (CSV)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {Object.keys(parMode).length > 0 && (
          <div className="bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-black tracking-tight">Répartition par mode</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(parMode).map(([mode, stats]) => {
                const Icon = PAYMENT_MODE_ICONS[mode as PaymentMode] || CreditCard;
                return (
                  <div key={mode} className="p-5 bg-muted/10 rounded-2xl border border-border/10 hover:bg-muted/20 transition-all group overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                      <Icon className="h-16 w-16" />
                    </div>
                    <div className="relative z-10">
                      <Icon className="h-5 w-5 mb-3 text-accent/60 group-hover:text-accent transition-colors" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                        {PAYMENT_MODE_LABELS[mode as PaymentMode] || mode}
                      </p>
                      <p className="text-lg font-black tracking-tight">{formatCurrency(stats.total)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">{stats.count} transaction{stats.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-background/40 backdrop-blur-xl rounded-[2rem] border border-border/40 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-border/10 flex items-center justify-between bg-muted/5">
            <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              Journal des encaissements ({filteredEncaissements.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            {filteredEncaissements.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20 mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-lg font-black tracking-tight">Aucun paiement trouvé</p>
                <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto mt-1">Ajustez vos filtres pour voir d'autres résultats.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/10">
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 pl-6">Date</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70">Période</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70">Lot & Immeuble</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 text-right">Montant</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70">Mode</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-foreground/70 text-center pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEncaissements.map((encaissement) => {
                    const Icon = PAYMENT_MODE_ICONS[encaissement.modePaiement] || CreditCard;
                    return (
                      <TableRow key={encaissement.id} className="hover:bg-accent/[0.02] border-b border-border/5 transition-colors group">
                        <TableCell className="py-4 pl-6">
                          <p className="font-bold text-sm">
                            {format(new Date(encaissement.dateEncaissement), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </TableCell>
                        <TableCell className="py-4">
                          <code className="px-2 py-1 rounded-md bg-muted/20 text-[10px] font-black text-muted-foreground border border-border/5">
                            {encaissement.moisConcerne}
                          </code>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <p className="font-bold text-sm">{encaissement.immeubleNom}</p>
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-tighter">Lot {encaissement.lotNumero}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <p className="font-black text-sm text-accent">
                            {formatCurrency(encaissement.montantEncaisse)}
                          </p>
                          {encaissement.commissionCapco > 0 && (
                            <p className="text-[9px] font-bold text-muted-foreground/50 italic">
                              Com: {formatCurrency(encaissement.commissionCapco)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/20 border border-border/5">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {PAYMENT_MODE_LABELS[encaissement.modePaiement] || encaissement.modePaiement}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center pr-6">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-accent/10 hover:text-accent transition-all">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                              <div className="px-6 py-5 border-b border-border/10 bg-gradient-to-br from-accent/[0.03] to-transparent">
                                <DialogHeader>
                                  <div className="flex items-center gap-2 text-accent/60 mb-1">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Récépissé</span>
                                  </div>
                                  <DialogTitle className="text-lg font-black tracking-tight">Détails de l'encaissement</DialogTitle>
                                  <DialogDescription className="text-xs font-medium opacity-60">
                                    Informations de paiement traitées le {format(new Date(encaissement.createdAt || new Date()), 'dd/MM/yyyy')}
                                  </DialogDescription>
                                </DialogHeader>
                              </div>

                              <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Réception</p>
                                    <p className="font-bold text-sm">
                                      {format(new Date(encaissement.dateEncaissement), 'dd MMMM yyyy', { locale: fr })}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Mois appliqué</p>
                                    <p className="font-bold text-sm uppercase text-accent">{encaissement.moisConcerne}</p>
                                  </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-muted/10 border border-border/10">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2">Location concernée</p>
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border/10 shadow-sm">
                                      <Info className="h-4 w-4 text-accent/60" />
                                    </div>
                                    <p className="font-bold text-sm">{encaissement.immeubleNom} — Lot {encaissement.lotNumero}</p>
                                  </div>
                                </div>

                                <div className="bg-accent/[0.03] p-5 rounded-2xl space-y-4 border border-accent/5">
                                  <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Montant total reçu</p>
                                    <p className="text-xl font-black text-accent tracking-tight">{formatCurrency(encaissement.montantEncaisse)}</p>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <Wallet className="h-3.5 w-3.5 text-muted-foreground/50" />
                                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Mode utilisé</p>
                                    </div>
                                    <p className="font-bold text-xs uppercase opacity-80">{PAYMENT_MODE_LABELS[encaissement.modePaiement] || encaissement.modePaiement}</p>
                                  </div>

                                  {encaissement.commissionCapco > 0 && (
                                    <div className="pt-3 border-t border-border/10 space-y-2">
                                      <div className="flex justify-between items-center opacity-60">
                                        <p className="text-[10px] font-bold uppercase">Commission CAPCO</p>
                                        <p className="font-bold text-xs">{formatCurrency(encaissement.commissionCapco)}</p>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black uppercase text-accent">Revenu Net</p>
                                        <p className="font-black text-sm text-accent">{formatCurrency(encaissement.netProprietaire)}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {encaissement.observation && (
                                  <div className="p-4 rounded-xl bg-muted/5 border border-dashed border-border/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">Observation</p>
                                    <p className="text-xs font-medium italic opacity-80">"{encaissement.observation}"</p>
                                  </div>
                                )}
                              </div>

                              <div className="p-4 bg-muted/5 border-t border-border/10 flex justify-end">
                                <DialogTrigger asChild>
                                  <Button className="rounded-xl h-9 px-6 bg-accent font-black text-[10px] uppercase tracking-widest">Fermer</Button>
                                </DialogTrigger>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </PaymentErrorBoundary>
  );
}