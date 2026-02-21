/**
 * Utilitaires pour la validation des dates d'audiences
 */

/**
 * Vérifie si une date correspond à un week-end
 * @param date - La date à vérifier (string au format YYYY-MM-DD ou Date)
 * @returns true si c'est un week-end (samedi ou dimanche)
 */
export function isWeekend(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = dateObj.getDay(); // 0 = dimanche, 6 = samedi
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Obtient le nom du jour de la semaine en français
 * @param date - La date à vérifier
 * @returns Le nom du jour en français
 */
export function getDayName(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[dateObj.getDay()];
}

/**
 * Vérifie si une date est un jour férié (à personnaliser selon le pays)
 * @param date - La date à vérifier
 * @returns true si c'est un jour férié
 */
export function isHoliday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const month = dateObj.getMonth() + 1; // getMonth() retourne 0-11
  const day = dateObj.getDate();
  
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
 * Obtient le prochain jour ouvrable à partir d'une date donnée
 * @param date - La date de départ
 * @returns La prochaine date de jour ouvrable
 */
export function getNextWorkingDay(date: string | Date): Date {
  const dateObj = new Date(typeof date === 'string' ? date : date);
  
  do {
    dateObj.setDate(dateObj.getDate() + 1);
  } while (isWeekend(dateObj) || isHoliday(dateObj));
  
  return dateObj;
}

/**
 * Formate une date pour l'affichage en français
 * @param date - La date à formater
 * @returns La date formatée (ex: "lundi 15 février 2026")
 */
export function formatDateWithDay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Suggestions de dates alternatives pour les week-ends
 * @param date - La date du week-end
 * @returns Un objet avec les suggestions de dates
 */
export function getWeekendAlternatives(date: string | Date) {
  const dateObj = new Date(typeof date === 'string' ? date : date);
  const dayOfWeek = dateObj.getDay();
  
  let previousFriday: Date;
  let nextMonday: Date;
  
  if (dayOfWeek === 6) { // Samedi
    previousFriday = new Date(dateObj);
    previousFriday.setDate(dateObj.getDate() - 1);
    
    nextMonday = new Date(dateObj);
    nextMonday.setDate(dateObj.getDate() + 2);
  } else { // Dimanche
    previousFriday = new Date(dateObj);
    previousFriday.setDate(dateObj.getDate() - 2);
    
    nextMonday = new Date(dateObj);
    nextMonday.setDate(dateObj.getDate() + 1);
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