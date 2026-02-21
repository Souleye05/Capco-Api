import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsWorkingDayConstraint implements ValidatorConstraintInterface {
  validate(date: string, args: ValidationArguments) {
    if (!date) return true; // Laisser les autres validateurs gérer les valeurs vides
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = dimanche, 6 = samedi
    
    // Retourne false si c'est un week-end (samedi ou dimanche)
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  }

  defaultMessage(args: ValidationArguments) {
    const date = args.value;
    if (!date) return 'Date invalide';
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayName = dayNames[dayOfWeek];
    
    return `La date sélectionnée correspond à un ${dayName}. Les audiences ne peuvent généralement pas être programmées le week-end. Veuillez choisir un jour ouvrable.`;
  }
}

export function IsWorkingDay(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsWorkingDayConstraint,
    });
  };
}

/**
 * Décorateur pour permettre les week-ends avec un avertissement
 * (pour les cas où on veut juste avertir sans bloquer)
 */
@ValidatorConstraint({ async: false })
export class IsWorkingDayWarningConstraint implements ValidatorConstraintInterface {
  validate(date: string, args: ValidationArguments) {
    // Toujours valide, mais on peut utiliser cette info pour des avertissements
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const date = args.value;
    if (!date) return '';
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const dayName = dayNames[dayOfWeek];
      return `Attention: Cette date correspond à un ${dayName}. Les tribunaux sont généralement fermés le week-end.`;
    }
    
    return '';
  }
}

export function IsWorkingDayWarning(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsWorkingDayWarningConstraint,
    });
  };
}

/**
 * Utilitaires pour les jours ouvrables
 */
export class WorkingDayUtils {
  /**
   * Vérifie si une date est un week-end
   */
  static isWeekend(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Obtient le nom du jour en français
   */
  static getDayName(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return dayNames[dateObj.getDay()];
  }

  /**
   * Obtient le prochain jour ouvrable
   */
  static getNextWorkingDay(date: string | Date): Date {
    const dateObj = new Date(typeof date === 'string' ? date : date);
    
    do {
      dateObj.setDate(dateObj.getDate() + 1);
    } while (this.isWeekend(dateObj));
    
    return dateObj;
  }

  /**
   * Obtient le jour ouvrable précédent
   */
  static getPreviousWorkingDay(date: string | Date): Date {
    const dateObj = new Date(typeof date === 'string' ? date : date);
    
    do {
      dateObj.setDate(dateObj.getDate() - 1);
    } while (this.isWeekend(dateObj));
    
    return dateObj;
  }
}