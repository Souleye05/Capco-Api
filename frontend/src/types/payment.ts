export type PaymentMode = 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';

export interface Encaissement {
  id: string;
  lotId: string;
  moisConcerne: string;
  dateEncaissement: string;
  montantEncaisse: number;
  modePaiement: PaymentMode;
  observation?: string;
  commissionCapco: number;
  netProprietaire: number;
  lotNumero?: string;
  immeubleNom?: string;
  immeubleReference?: string;
  locataireNom?: string;
  createdAt: string;
}

export interface PaymentModeStats {
  count: number;
  total: number;
}

export interface PaymentStatus {
  status: 'good' | 'warning' | 'late' | 'unknown';
  color: 'green' | 'orange' | 'red' | 'gray';
}

export interface MonthlyPaymentData {
  month: string;
  total: number;
  count: number;
  payments: Encaissement[];
}

export interface PaymentStatistics {
  totalPaye: number;
  nombrePaiements: number;
  moyennePaiement: number;
  currentMonthTotal: number;
  currentMonthCount: number;
  paymentStatus: PaymentStatus;
  daysSinceLastPayment: number | null;
}

export interface PaymentFilters {
  selectedPeriod: string;
  selectedMode: string;
  searchTerm: string;
}

export interface PaymentModeConfig {
  [key: string]: {
    label: string;
    icon: any;
  };
}