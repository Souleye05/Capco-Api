/**
 * Utilitaires pour le formatage des montants en Franc CFA (XOF)
 */

/**
 * Formate un montant en Franc CFA
 * @param amount - Le montant à formater
 * @param options - Options de formatage
 * @returns Le montant formaté en F CFA
 */
export function formatCurrency(amount: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    showSymbol = true
  } = options || {};

  // Formatage avec l'espace insécable pour les milliers
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return showSymbol ? `${formatted} F CFA` : formatted;
}

/**
 * Formate un montant en XOF avec décimales si nécessaire
 * @param amount - Le montant à formater
 * @returns Le montant formaté avec décimales si nécessaire
 */
export function formatCurrencyWithDecimals(amount: number): string {
  // Affiche les décimales seulement si nécessaires
  const hasDecimals = amount % 1 !== 0;
  
  return formatCurrency(amount, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
}

/**
 * Formate un montant pour l'affichage dans les formulaires
 * @param amount - Le montant à formater
 * @returns Le montant formaté sans le symbole de devise
 */
export function formatCurrencyInput(amount: number): string {
  return formatCurrency(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    showSymbol: false
  });
}

/**
 * Parse un montant depuis une chaîne de caractères
 * @param value - La valeur à parser
 * @returns Le montant en nombre
 */
export function parseCurrency(value: string): number {
  // Supprime les espaces, les symboles de devise et remplace les virgules par des points
  const cleaned = value
    .replace(/[^\d,.-]/g, '') // Garde seulement les chiffres, virgules, points et tirets
    .replace(',', '.'); // Remplace la virgule par un point pour les décimales
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Constantes pour les montants typiques en F CFA
 */
export const CURRENCY_EXAMPLES = {
  HONORAIRES: {
    MIN: 50000, // 50 000 F CFA
    TYPICAL: 500000, // 500 000 F CFA
    MAX: 5000000, // 5 000 000 F CFA
  },
  DEPENSES: {
    MIN: 5000, // 5 000 F CFA
    TYPICAL: 50000, // 50 000 F CFA
    MAX: 500000, // 500 000 F CFA
  }
};