/***
 * 🌍 DATE UTILITIES - TIMEZONE-SAFE (UTC)
 * 
 * RÈGLE CRITIQUE : Toutes les fonctions utilisent UTC pour garantir
 * que les dates ne changent pas quand l'utilisateur change de timezone.
 * 
 * Le backend stocke les dates en UTC à midi (12:00).
 * Le frontend DOIT toujours interpréter et afficher ces dates en UTC,
 * sinon changer le timezone de l'OS changera les dates affichées.
 */

import { 
  format as dateFnsFormat
} from 'date-fns';

/**
 * Parse une date UTC de l'API vers un objet Date
 * La date reste en UTC (pas de conversion timezone)
 */
export function parseDateFromAPI(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // new Date() avec ISO string (format: "2026-02-15T12:00:00.000Z")
  return new Date(dateString);
}

/**
 * ✅ Compare deux dates en ignorant l'heure (même jour calendrier)
 * UTILISE UTC pour éviter les bugs de timezone
 * 
 * @example
 * const date1 = new Date("2026-02-15T12:00:00.000Z");
 * const date2 = new Date("2026-02-15T18:00:00.000Z");
 * isSameDay(date1, date2); // true (même jour UTC)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * ✅ Formate une date pour l'affichage
 * FORCE UTC pour que la date affichée soit toujours la même
 * 
 * @example
 * formatDate(new Date("2026-02-15T12:00:00.000Z")); // "15 février 2026"
 * formatDate("2026-02-15T12:00:00.000Z"); // "15 février 2026"
 * // Reste "15 février 2026" même si tu changes ton timezone OS!
 */
export function formatDate(date: Date | string, locale: string = 'fr-FR'): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Vérifier si la date est valide
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',  // ✅ CRITIQUE : Force UTC
  }).format(dateObj);
}

/**
 * ✅ Formate une date en format long (avec jour de la semaine)
 * FORCE UTC
 * 
 * @example
 * formatDateLong(new Date("2026-02-15T12:00:00.000Z")); // "dimanche 15 février 2026"
 * formatDateLong("2026-02-15T12:00:00.000Z"); // "dimanche 15 février 2026"
 */
export function formatDateLong(date: Date | string, locale: string = 'fr-FR'): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Vérifier si la date est valide
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }
  
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',  // ✅ CRITIQUE : Force UTC
  }).format(dateObj);
}

/**
 * ✅ Convertit une date en string YYYY-MM-DD
 * UTILISE UTC pour éviter les décalages
 * 
 * @example
 * toDateString(new Date("2026-02-15T12:00:00.000Z")); // "2026-02-15"
 */
export function toDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ✅ Formate une date pour l'envoi à l'API
 * Retourne au format YYYY-MM-DD en UTC
 * 
 * @example
 * formatDateForAPI(new Date("2026-02-15T12:00:00.000Z")); // "2026-02-15"
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ✅ Obtient le début de la journée en UTC
 * 
 * @param date Date à normaliser
 * @returns Nouvelle date au début de la journée UTC (00:00:00)
 */
export function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setUTCHours(0, 0, 0, 0);
  return newDate;
}

/**
 * ✅ Obtient la fin de la journée en UTC
 * 
 * @param date Date à normaliser
 * @returns Nouvelle date à la fin de la journée UTC (23:59:59.999)
 */
export function getEndOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setUTCHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Extrait le jour UTC (1-31)
 */
export function getUTCDay(date: Date): number {
  return date.getUTCDate();
}

/**
 * Extrait le mois UTC (0-11)
 */
export function getUTCMonth(date: Date): number {
  return date.getUTCMonth();
}

/**
 * Extrait l'année UTC
 */
export function getUTCYear(date: Date): number {
  return date.getUTCFullYear();
}

/**
 * Crée une date UTC à partir de composants (année, mois, jour)
 * Le mois est 0-indexed (0 = janvier, 11 = décembre)
 * 
 * @example
 * createUTCDate(2026, 1, 15); // 15 février 2026 à 12:00 UTC
 */
export function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

/**
 * Obtient le jour de la semaine UTC (0 = dimanche, 6 = samedi)
 */
export function getUTCDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

/**
 * Vérifie si une date est un weekend (samedi ou dimanche) en UTC
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
}

/**
 * Ajoute des jours à une date en UTC
 * 
 * @example
 * const today = new Date("2026-02-15T12:00:00.000Z");
 * const tomorrow = addDays(today, 1); // "2026-02-16T12:00:00.000Z"
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Obtient le premier jour du mois en UTC
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1, 12, 0, 0));
}

/**
 * Obtient le dernier jour du mois en UTC
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));
}

/**
 * Formate une date courte (ex: "15 fév 2026")
 * FORCE UTC
 */
export function formatDateShort(date: Date, locale: string = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',  // ✅ CRITIQUE : Force UTC
  }).format(date);
}

/**
 * Formate une date avec jour de la semaine (ex: "lundi 15 février 2026")
 * FORCE UTC
 */
export function formatDateWithWeekday(date: Date, locale: string = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',  // ✅ CRITIQUE : Force UTC
  }).format(date);
}

/**
 * Formate une heure en UTC
 */
export function formatTimeUTC(date: Date, locale: string = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',  // ✅ CRITIQUE : Force UTC
  }).format(date);
}

/**
 * Formate une date et heure complète en UTC
 */
export function formatDateTimeUTC(date: Date, locale: string = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',  // ✅ CRITIQUE : Force UTC
  }).format(date);
}

/**
 * Parse une date string YYYY-MM-DD en Date UTC
 * 
 * @example
 * parseDateString("2026-02-15"); // Date("2026-02-15T12:00:00.000Z")
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return createUTCDate(year, month - 1, day);
}

// ========================================
// 🔧 WRAPPERS UTC POUR DATE-FNS
// ========================================

/**
 * ✅ Wrapper UTC pour date-fns format()
 * Force l'utilisation d'UTC au lieu du timezone local
 */
export function format(date: Date, formatStr: string, options?: any): string {
  // Utilise Intl.DateTimeFormat avec UTC pour un formatage cohérent
  if (formatStr === 'MMMM yyyy') {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC'
    }).format(date);
  }
  
  if (formatStr === 'd') {
    return date.getUTCDate().toString();
  }
  
  if (formatStr === 'EEEE d MMMM yyyy') {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  }
  
  // Fallback pour autres formats
  return dateFnsFormat(date, formatStr, { ...options, timeZone: 'UTC' });
}

/**
 * ✅ Wrapper UTC pour startOfMonth
 */
export function startOfMonth(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return new Date(Date.UTC(year, month, 1, 12, 0, 0));
}

/**
 * ✅ Wrapper UTC pour endOfMonth
 */
export function endOfMonth(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));
}

/**
 * ✅ Wrapper UTC pour startOfWeek
 */
export function startOfWeek(date: Date, options?: { weekStartsOn?: number }): Date {
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const dayOfWeek = date.getUTCDay();
  const diff = (dayOfWeek < weekStartsOn ? 7 : 0) + dayOfWeek - weekStartsOn;
  
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - diff);
  result.setUTCHours(12, 0, 0, 0);
  return result;
}

/**
 * ✅ Wrapper UTC pour endOfWeek
 */
export function endOfWeek(date: Date, options?: { weekStartsOn?: number }): Date {
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const dayOfWeek = date.getUTCDay();
  const diff = (dayOfWeek < weekStartsOn ? -7 : 0) + 6 - (dayOfWeek - weekStartsOn);
  
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + diff);
  result.setUTCHours(12, 0, 0, 0);
  return result;
}

/**
 * ✅ Wrapper UTC pour addMonths
 */
export function addMonths(date: Date, amount: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  const newMonth = month + amount;
  const newYear = year + Math.floor(newMonth / 12);
  const finalMonth = ((newMonth % 12) + 12) % 12;
  
  return new Date(Date.UTC(newYear, finalMonth, day, 12, 0, 0));
}

/**
 * ✅ Wrapper UTC pour subMonths
 */
export function subMonths(date: Date, amount: number): Date {
  return addMonths(date, -amount);
}

/**
 * ✅ Wrapper UTC pour addWeeks
 */
export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}

/**
 * ✅ Wrapper UTC pour subWeeks
 */
export function subWeeks(date: Date, amount: number): Date {
  return addDays(date, -amount * 7);
}

/**
 * ✅ Wrapper UTC pour subDays
 */
export function subDays(date: Date, amount: number): Date {
  return addDays(date, -amount);
}

/**
 * ✅ Wrapper UTC pour isSameMonth
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth()
  );
}

/**
 * ✅ Wrapper UTC pour isToday
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return isSameDay(date, today);
}

/**
 * ✅ Wrapper UTC pour differenceInDays
 */
export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const leftStart = getStartOfDay(dateLeft);
  const rightStart = getStartOfDay(dateRight);
  const diffTime = leftStart.getTime() - rightStart.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * ✅ Wrapper UTC pour isPast
 */
export function isPast(date: Date): boolean {
  const now = new Date();
  return date.getTime() < now.getTime();
}

/**
 * ✅ Wrapper UTC pour isBefore
 */
export function isBefore(date: Date, dateToCompare: Date): boolean {
  return date.getTime() < dateToCompare.getTime();
}