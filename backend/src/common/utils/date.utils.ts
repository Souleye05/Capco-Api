/**
 * Utilitaires pour la gestion des dates et timezones
 * Utilise le timezone Africa/Dakar (GMT+0) comme référence (équivalent UTC)
 */

/**
 * Parse une chaîne de date (ISO string) en objet Date
 * @param dateStr Chaîne de date à parser
 * @returns Date parsée
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Parse une chaîne de date optionnelle en objet Date ou null
 * @param dateStr Chaîne de date optionnelle
 * @returns Date parsée ou null
 */
export function parseDateOptional(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  return new Date(dateStr);
}

/**
 * Obtient le début de la journée (00:00:00 UTC) pour une date donnée
 * @param date Date à normaliser
 * @returns Date normalisée au début de la journée en UTC
 */
export function getStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Obtient la fin de la journée (23:59:59.999 UTC) pour une date donnée
 * @param date Date à normaliser
 * @returns Date normalisée à la fin de la journée en UTC
 */
export function getEndOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(23, 59, 59, 999);
  return normalized;
}

/**
 * Obtient le début du jour suivant en UTC
 */
export function getTomorrowStart(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return getStartOfDay(tomorrow);
}

/**
 * Obtient la fin du jour suivant en UTC
 */
export function getTomorrowEnd(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return getEndOfDay(tomorrow);
}

/**
 * Vérifie si deux dates sont le même jour en UTC
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Obtient le début du jour actuel en UTC
 */
export function getTodayStart(): Date {
  return getStartOfDay(new Date());
}

/**
 * Obtient la fin du jour actuel en UTC
 */
export function getTodayEnd(): Date {
  return getEndOfDay(new Date());
}

