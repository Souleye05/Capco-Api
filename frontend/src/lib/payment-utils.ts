import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Encaissement, PaymentStatus, PaymentStatistics, MonthlyPaymentData } from '@/types/payment';
import { PAYMENT_STATUS_CONFIG } from './payment-constants';

export function calculatePaymentStatus(daysSinceLastPayment: number | null): PaymentStatus {
  if (daysSinceLastPayment === null) {
    return { status: 'unknown', color: 'gray' };
  }
  
  if (daysSinceLastPayment <= PAYMENT_STATUS_CONFIG.GOOD_THRESHOLD) {
    return { status: 'good', color: 'green' };
  }
  
  if (daysSinceLastPayment <= PAYMENT_STATUS_CONFIG.WARNING_THRESHOLD) {
    return { status: 'warning', color: 'orange' };
  }
  
  return { status: 'late', color: 'red' };
}

export function calculatePaymentStatistics(encaissements: Encaissement[]): PaymentStatistics {
  const totalPaye = encaissements.reduce((sum, enc) => sum + enc.montantEncaisse, 0);
  const nombrePaiements = encaissements.length;
  const moyennePaiement = nombrePaiements > 0 ? totalPaye / nombrePaiements : 0;

  // Calculate current month payments
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthPayments = encaissements.filter(enc => 
    enc.moisConcerne.startsWith(currentMonth)
  );
  const currentMonthTotal = currentMonthPayments.reduce((sum, enc) => sum + enc.montantEncaisse, 0);
  const currentMonthCount = currentMonthPayments.length;

  // Calculate last payment info
  const sortedPayments = [...encaissements].sort((a, b) => 
    new Date(b.dateEncaissement).getTime() - new Date(a.dateEncaissement).getTime()
  );
  const lastPayment = sortedPayments[0];
  const daysSinceLastPayment = lastPayment 
    ? differenceInDays(new Date(), new Date(lastPayment.dateEncaissement))
    : null;

  const paymentStatus = calculatePaymentStatus(daysSinceLastPayment);

  return {
    totalPaye,
    nombrePaiements,
    moyennePaiement,
    currentMonthTotal,
    currentMonthCount,
    paymentStatus,
    daysSinceLastPayment,
  };
}

export function groupPaymentsByMonth(encaissements: Encaissement[]): MonthlyPaymentData[] {
  const paymentsByMonth = encaissements.reduce((acc: Record<string, MonthlyPaymentData>, enc) => {
    const month = enc.moisConcerne;
    if (!acc[month]) {
      acc[month] = {
        month,
        total: 0,
        count: 0,
        payments: []
      };
    }
    acc[month].total += enc.montantEncaisse;
    acc[month].count += 1;
    acc[month].payments.push(enc);
    return acc;
  }, {});

  return Object.values(paymentsByMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Show last 12 months
}

export function formatDaysSincePayment(days: number | null): string {
  if (days === null) return 'Aucun paiement';
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
}

export function filterEncaissements(
  encaissements: Encaissement[],
  filters: { selectedPeriod: string; selectedMode: string; searchTerm: string }
): Encaissement[] {
  return encaissements.filter((enc) => {
    const matchesPeriod = filters.selectedPeriod === 'all' || 
      enc.moisConcerne.includes(filters.selectedPeriod);
    
    const matchesMode = filters.selectedMode === 'all' || enc.modePaiement === filters.selectedMode;
    
    const matchesSearch = filters.searchTerm === '' || 
      enc.immeubleNom?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      enc.lotNumero?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      enc.moisConcerne.toLowerCase().includes(filters.searchTerm.toLowerCase());

    return matchesPeriod && matchesMode && matchesSearch;
  });
}