/**
 * Utilitaires pour la gestion des dates et timezones
 * Utilise le timezone Africa/Dakar (GMT+0) comme référence (équivalent UTC)
 */

/**
 * @deprecated Utiliser dateStringToISODateTime() ou new Date(dateStr + 'T00:00:00.000Z') pour un parsing UTC sécurisé
 * Parse une chaîne de date (ISO string) en objet Date
 * @param dateStr Chaîne de date à parser
 * @returns Date parsée
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * @deprecated Utiliser dateStringToISODateTime() ou new Date(dateStr + 'T00:00:00.000Z') pour un parsing UTC sécurisé
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

/**
 * Convertit une chaîne de date en ISO DateTime string pour les requêtes Prisma
 * Utilisé pour les filtres de date dans les requêtes de pagination
 * IMPORTANT: Utilise UTC pour éviter les problèmes de fuseau horaire
 * @param dateStr Chaîne de date (format YYYY-MM-DD)
 * @param isEndOfDay Si true, retourne la fin de la journée, sinon le début
 * @returns ISO DateTime string pour Prisma
 */
export function dateStringToISODateTime(dateStr: string, isEndOfDay: boolean = false): string {
  const date = new Date(dateStr + 'T00:00:00.000Z'); // Force UTC parsing
  if (isEndOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }
  return date.toISOString();
}

/**
 * Utilitaire pour créer des filtres de date pour Prisma
 * @param dateDebut Date de début (optionnelle)
 * @param dateFin Date de fin (optionnelle)
 * @returns Objet de filtre Prisma pour les dates
 */
export function createDateFilter(dateDebut?: string, dateFin?: string): any {
  if (!dateDebut && !dateFin) return undefined;

  const filter: any = {};
  if (dateDebut) {
    filter.gte = dateStringToISODateTime(dateDebut, false);
  }
  if (dateFin) {
    filter.lte = dateStringToISODateTime(dateFin, true);
  }
  return filter;
}
/**
 * Convertit un objet Date en chaîne de date YYYY-MM-DD en UTC
 * Évite les problèmes de fuseau horaire lors de la conversion
 * @param date Objet Date à convertir
 * @returns Chaîne de date au format YYYY-MM-DD
 */
export function dateToUTCDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcule le mois cible courant pour le calcul des impayés (format YYYY-MM)
 * Règle: Si on est avant le 5 du mois, on retourne le mois précédent
 */
export function getCurrentImpayesMonth(): string {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1; // 1-12
  const day = now.getUTCDate();

  if (day < 5) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Retourne le mois actuel au format YYYY-MM en UTC
 */
export function getCurrentMonthYM(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Ajoute (ou soustrait) un nombre de mois à un mois au format YYYY-MM
 */
export function addMonthsToYM(moisYM: string, monthsToAdd: number): string {
  const parts = moisYM.split('-');
  if (parts.length !== 2) return moisYM;

  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);

  month += monthsToAdd;

  while (month <= 0) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}
