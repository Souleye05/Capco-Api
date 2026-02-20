/**
 * Prisma enums extracted from schema.prisma
 * This file serves as a workaround when Prisma client generation fails
 */

export enum AppRole {
  admin = 'admin',
  collaborateur = 'collaborateur',
  compta = 'compta',
}

// Interface User de base (compatible avec Prisma)
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  migrationSource?: string;
  requiresPasswordReset: boolean;
  lastSignIn?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum StatutAffaire {
  ACTIVE = 'ACTIVE',
  CLOTUREE = 'CLOTUREE',
  RADIEE = 'RADIEE',
}

export enum StatutAudience {
  A_VENIR = 'A_VENIR',
  PASSEE_NON_RENSEIGNEE = 'PASSEE_NON_RENSEIGNEE',
  RENSEIGNEE = 'RENSEIGNEE',
}

export enum TypeAudience {
  MISE_EN_ETAT = 'MISE_EN_ETAT',
  PLAIDOIRIE = 'PLAIDOIRIE',
  REFERE = 'REFERE',
  EVOCATION = 'EVOCATION',
  CONCILIATION = 'CONCILIATION',
  MEDIATION = 'MEDIATION',
  AUTRE = 'AUTRE',
}

export enum TypeResultat {
  RENVOI = 'RENVOI',
  RADIATION = 'RADIATION',
  DELIBERE = 'DELIBERE',
}

export enum RolePartie {
  DEMANDEUR = 'DEMANDEUR',
  DEFENDEUR = 'DEFENDEUR',
  CONSEIL_ADVERSE = 'CONSEIL_ADVERSE',
}

export enum StatutRecouvrement {
  EN_COURS = 'EN_COURS',
  CLOTURE = 'CLOTURE',
}

export enum TypeAction {
  APPEL_TELEPHONIQUE = 'APPEL_TELEPHONIQUE',
  COURRIER = 'COURRIER',
  LETTRE_RELANCE = 'LETTRE_RELANCE',
  MISE_EN_DEMEURE = 'MISE_EN_DEMEURE',
  COMMANDEMENT_PAYER = 'COMMANDEMENT_PAYER',
  ASSIGNATION = 'ASSIGNATION',
  REQUETE = 'REQUETE',
  AUDIENCE_PROCEDURE = 'AUDIENCE_PROCEDURE',
  AUTRE = 'AUTRE',
}

export enum ModePaiement {
  CASH = 'CASH',
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  WAVE = 'WAVE',
  OM = 'OM',
}

export enum TypePartie {
  physique = 'physique',
  morale = 'morale',
}

export enum TypeRelation {
  creancier = 'creancier',
  debiteur = 'debiteur',
  proprietaire = 'proprietaire',
  locataire = 'locataire',
  adversaire = 'adversaire',
  demandeur = 'demandeur',
  defendeur = 'defendeur',
}