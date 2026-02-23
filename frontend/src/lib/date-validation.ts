/**
 * Utilitaires pour la validation des dates d'audiences
 * Utilise UTC pour éviter les problèmes de timezone
 */

import { createUTCDate, getUTCDayOfWeek } from './date-utils';

/**
 * Vérifie si une date correspond à un week-end (en UTC)
 * @param date - La date à vérifier (string au format YYYY-MM-DD ou Date)
 * @returns true si c'est un week-end (samedi ou dimanche)
 */
export function isWeekend(date: string | Date): boolean {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Parse la date string en UTC à midi pour éviter les décalages timezone
    const [year, month, day] = date.split('-').map(Number);
    dateObj = createUTCDate(year, month - 1, day);
  } else {
    dateObj = date;
  }
  
  const dayOfWeek = getUTCDayOfWeek(dateObj); // 0 = dimanche, 6 = samedi
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Obtient le nom du jour de la semaine en français (en UTC)
 * @param date - La date à vérifier
 * @returns Le nom du jour en français
 */
export function getDayName(date: string | Date): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    dateObj = createUTCDate(year, month - 1, day);
  } else {
    dateObj = date;
  }
  
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[getUTCDayOfWeek(dateObj)];
}

/**
 * Vérifie si une date est un jour férié (à personnaliser selon le pays)
 * @param date - La date à vérifier
 * @returns true si c'est un jour férié
 */
export function isHoliday(date: string | Date): boolean {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    dateObj = createUTCDate(year, month - 1, day);
  } else {
    dateObj = date;
  }
  
  const month = dateObj.getUTCMonth() + 1; // getUTCMonth() retourne 0-11
  const day = dateObj.getUTCDate();
  
  // Jours fériés fixes au Sénégal (à adapter selon le contexte)
  const fixedHolidays = [
    { month: 1, day: 1 },   // Nouvel An
    { month: 4, day: 4 },   // Fête de l'Indépendance
    { month: 5, day: 1 },   // Fête du Travail
    { month: 8, day: 15 },  // Assomption
    { month: 11, day: 1 },  // Toussaint
    { month: 12, day: 25 }, // Noël
  ];
  
  return fixedHolidays.some(holiday => 
    holiday.month === month && holiday.day === day
  );
}

/**
 * Obtient le prochain jour ouvrable à partir d'une date donnée (en UTC)
 * @param date - La date de départ
 * @returns La prochaine date de jour ouvrable
 */
export function getNextWorkingDay(date: string | Date): Date {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    dateObj = createUTCDate(year, month - 1, day);
  } else {
    dateObj = new Date(date);
  }
  
  do {
    dateObj.setUTCDate(dateObj.getUTCDate() + 1);
  } while (isWeekend(dateObj) || isHoliday(dateObj));
  
  return dateObj;
}

/**
 * Formate une date pour l'affichage en français (en UTC)
 * @param date - La date à formater
 * @returns La date formatée (ex: "lundi 15 février 2026")
 */
export function formatDateWithDay(date: string | Date): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    dateObj = createUTCDate(year, month - 1, day);
  } else {
    dateObj = date;
  }
  
  return dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // ✅ Force UTC pour éviter les décalages
  });
}

/**
 * Suggestions de dates alternatives pour les week-ends (en UTC)
 * @param date - La date du week-end
 * @returns Un objet avec les suggestions de dates
 */
export function getWeekendAlternatives(date: string | Date) {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    dateObj = createUTCDate(year, month - 1, day);
  } else {
    dateObj = date;
  }
  
  const dayOfWeek = getUTCDayOfWeek(dateObj);
  
  let previousFriday: Date;
  let nextMonday: Date;
  
  if (dayOfWeek === 6) { // Samedi
    previousFriday = new Date(dateObj);
    previousFriday.setUTCDate(dateObj.getUTCDate() - 1);
    
    nextMonday = new Date(dateObj);
    nextMonday.setUTCDate(dateObj.getUTCDate() + 2);
  } else { // Dimanche
    previousFriday = new Date(dateObj);
    previousFriday.setUTCDate(dateObj.getUTCDate() - 2);
    
    nextMonday = new Date(dateObj);
    nextMonday.setUTCDate(dateObj.getUTCDate() + 1);
  }
  
  return {
    previousFriday: {
      date: previousFriday,
      formatted: formatDateWithDay(previousFriday),
      isoString: previousFriday.toISOString().split('T')[0]
    },
    nextMonday: {
      date: nextMonday,
      formatted: formatDateWithDay(nextMonday),
      isoString: nextMonday.toISOString().split('T')[0]
    }
  };
}