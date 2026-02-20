// Constantes pour l'application Planning Juridique

import { TypeAudience, StatutAudience, StatutAffaire } from '@/types/api';

/**
 * Labels français pour les types d'audience
 */
export const LABELS_TYPE_AUDIENCE: Record<TypeAudience, string> = {
  MISE_EN_ETAT: 'Mise en état',
  PLAIDOIRIE: 'Plaidoirie',
  REFERE: 'Référé',
  EVOCATION: 'Évocation',
  CONCILIATION: 'Conciliation',
  MEDIATION: 'Médiation',
  AUTRE: 'Autre',
};

/**
 * Labels français pour les statuts d'audience
 */
export const LABELS_STATUT_AUDIENCE: Record<StatutAudience, string> = {
  A_VENIR: 'À venir',
  TENUE: 'Tenue',
  NON_RENSEIGNEE: 'Non renseignée',
};

/**
 * Labels français pour les statuts d'affaire
 */
export const LABELS_STATUT_AFFAIRE: Record<StatutAffaire, string> = {
  ACTIVE: 'Active',
  CLOTUREE: 'Clôturée',
  RADIEE: 'Radiée',
};

/**
 * Options de juridiction
 */
export const OPTIONS_JURIDICTION = [
  'Tribunal de Grande Instance',
  'Tribunal d\'Instance',
  'Tribunal de Commerce',
  'Tribunal de Travail',
  'Cour d\'Appel',
  'Cour de Cassation',
  'Tribunal Administratif',
  'Cour Administrative d\'Appel',
] as const;

/**
 * Options de chambre
 */
export const OPTIONS_CHAMBRE = [
  'Chambre civile',
  'Chambre commerciale',
  'Chambre sociale',
  'Chambre criminelle',
  'Chambre des référés',
  'Chambre correctionnelle',
  'Chambre de l\'instruction',
  'Chambre civile 1',
  'Chambre civile 2',
  'Chambre civile 3',
] as const;

/**
 * Rôles des parties
 */
export const ROLES_PARTIES = {
  DEMANDEUR: 'Demandeur',
  DEFENDEUR: 'Défendeur',
  CONSEIL_ADVERSE: 'Conseil adverse',
} as const;

/**
 * Types de résultat d'audience
 */
export const TYPES_RESULTAT_AUDIENCE = {
  RENVOI: 'Renvoi',
  RADIATION: 'Radiation',
  DELIBERE: 'Délibéré',
} as const;

/**
 * Configuration React Query
 */
export const CONFIG_REQUETES = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  REFETCH_INTERVAL: {
    ALERTES: 60 * 1000, // 1 minute pour les alertes
    TABLEAU_BORD: 5 * 60 * 1000, // 5 minutes pour le tableau de bord
  },
} as const;

/**
 * Limites de pagination
 */
export const PAGINATION = {
  TAILLE_PAGE_DEFAUT: 10,
  TAILLE_PAGE_MAX: 100,
} as const;

/**
 * Délais de debounce (ms)
 */
export const DELAIS_DEBOUNCE = {
  RECHERCHE: 300,
  SAISIE: 500,
} as const;

// Alias pour compatibilité avec les anciens composants
export const HEARING_TYPE_LABELS = LABELS_TYPE_AUDIENCE;
export const HEARING_STATUS_LABELS = LABELS_STATUT_AUDIENCE;
export const CASE_STATUS_LABELS = LABELS_STATUT_AFFAIRE;
export const JURISDICTION_OPTIONS = OPTIONS_JURIDICTION;
export const CHAMBER_OPTIONS = OPTIONS_CHAMBRE;
export const PARTY_ROLES = ROLES_PARTIES;
export const HEARING_RESULT_TYPES = TYPES_RESULTAT_AUDIENCE;
export const QUERY_CONFIG = CONFIG_REQUETES;
export const DEBOUNCE_DELAYS = DELAIS_DEBOUNCE;
