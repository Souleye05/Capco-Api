import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { PaymentMode } from '@/types/payment';

export const PAYMENT_MODE_ICONS = {
  CASH: Banknote,
  VIREMENT: CreditCard,
  CHEQUE: CreditCard,
  WAVE: Smartphone,
  OM: Smartphone,
} as const;

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  CASH: 'Espèces',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  WAVE: 'Wave',
  OM: 'Orange Money',
} as const;

export const PAYMENT_STATUS_CONFIG = {
  GOOD_THRESHOLD: 35, // days
  WARNING_THRESHOLD: 60, // days
} as const;

export const CHART_CONFIG = {
  MAX_MONTHS_DISPLAYED: 12,
  MIN_BAR_WIDTH_PERCENTAGE: 2,
} as const;