/**
 * Utilitaires pour la gestion des dates et timezones
 * Utilise le timezone Africa/Dakar (GMT+0) comme référence
 */

/**
 * Obtient le début de la journée (00:00:00) pour une date donnée
 * @param date Date à normaliser
 * @returns Date normalisée au début de la journée
 */
export function getStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Obtient la fin de la journée (23:59:59.999) pour une date donnée
 * @param date Date à normaliser
 * @returns Date normalisée à la fin de la journée
 */
export function getEndOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

/**
 * Obtient le début du jour suivant (demain à 00:00:00)
 * @returns Date de demain au début de la journée
 */
export function getTomorrowStart(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getStartOfDay(tomorrow);
}

/**
 * Obtient la fin du jour suivant (demain à 23:59:59.999)
 * @returns Date de demain à la fin de la journée
 */
export function getTomorrowEnd(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getEndOfDay(tomorrow);
}

/**
 * Vérifie si deux dates sont le même jour (ignore les heures)
 * @param date1 Première date
 * @param date2 Deuxième date
 * @returns true si les dates sont le même jour
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Obtient le début du jour actuel (aujourd'hui à 00:00:00)
 * @returns Date d'aujourd'hui au début de la journée
 */
export function getTodayStart(): Date {
  return getStartOfDay(new Date());
}

/**
 * Obtient la fin du jour actuel (aujourd'hui à 23:59:59.999)
 * @returns Date d'aujourd'hui à la fin de la journée
 */
export function getTodayEnd(): Date {
  return getEndOfDay(new Date());
}
