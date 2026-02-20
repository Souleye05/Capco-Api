import { StatutAudience } from '@/types/api';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const COULEURS_STATUT = {
  A_VENIR: {
    bg: 'bg-info/10',
    border: 'border-info/20',
    text: 'text-info',
    hover: 'hover:bg-info/20',
    button: 'bg-info hover:bg-info/90 border-info',
    buttonHover: 'hover:bg-info/10 hover:text-info hover:border-info/50',
    dot: 'bg-info',
  },
  TENUE: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    text: 'text-success',
    hover: 'hover:bg-success/20',
    button: 'bg-success hover:bg-success/90 border-success',
    buttonHover: 'hover:bg-success/10 hover:text-success hover:border-success/50',
    dot: 'bg-success',
  },
  NON_RENSEIGNEE: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    text: 'text-destructive',
    hover: 'hover:bg-destructive/20',
    button: 'bg-destructive hover:bg-destructive/90 border-destructive',
    buttonHover: 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50',
    dot: 'bg-destructive',
  },
} as const;

export const ICONES_STATUT = {
  A_VENIR: Clock,
  TENUE: CheckCircle,
  NON_RENSEIGNEE: AlertCircle,
} as const;

export const LABELS_STATUT = {
  A_VENIR: 'À venir',
  TENUE: 'Tenue',
  NON_RENSEIGNEE: 'À renseigner',
} as const;

export function getClasseStatut(statut: StatutAudience): string {
  const couleurs = COULEURS_STATUT[statut];
  return `${couleurs.bg} ${couleurs.border} ${couleurs.text} ${couleurs.hover}`;
}

export function getClassePointStatut(statut: StatutAudience): string {
  return COULEURS_STATUT[statut].dot;
}

export function getIconeStatut(statut: StatutAudience, className?: string): JSX.Element {
  const ComposantIcone = ICONES_STATUT[statut];
  return <ComposantIcone className={className} />;
}

export function getLabelStatut(statut: StatutAudience): string {
  return LABELS_STATUT[statut];
}

// Alias pour compatibilité avec les anciens composants
export const STATUS_COLORS = COULEURS_STATUT;
export const STATUS_ICONS = ICONES_STATUT;
export const STATUS_LABELS = LABELS_STATUT;
export const getStatusClassName = getClasseStatut;
export const getStatusDotClassName = getClassePointStatut;
export const getStatusIcon = getIconeStatut;
export const getStatusLabel = getLabelStatut;
