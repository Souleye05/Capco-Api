// Types pour l'application Planning Juridique
// Note: Ces types sont pour l'affichage frontend. Les types API sont dans types/api.ts

export type StatutAffaire = 'ACTIVE' | 'CLOTUREE' | 'RADIEE';

export type StatutAudience = 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';

export type TypeAudience = 
  | 'MISE_EN_ETAT' 
  | 'PLAIDOIRIE' 
  | 'REFERE' 
  | 'EVOCATION' 
  | 'CONCILIATION'
  | 'MEDIATION'
  | 'AUTRE';

export type TypeResultatAudience = 'RENVOI' | 'RADIATION' | 'DELIBERE';

// Types d'affichage frontend (transformés depuis l'API)
export interface Partie {
  id: string;
  nom: string;
  role: 'DEMANDEUR' | 'DEFENDEUR' | 'CONSEIL_ADVERSE';
}

export interface Affaire {
  id: string;
  reference: string;
  intitule: string;
  parties: Partie[];
  statut: StatutAffaire;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Audience {
  id: string;
  affaireId: string;
  affaire?: Affaire;
  date: Date;
  heure?: string;
  type: TypeAudience;
  juridiction: string;
  chambre?: string;
  ville?: string;
  statut: StatutAudience;
  notesPreparation?: string;
  estPrepare: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ResultatAudience {
  id: string;
  audienceId: string;
  audience?: Audience;
  type: TypeResultatAudience;
  // Pour RENVOI
  nouvelleDate?: Date;
  motifRenvoi?: string;
  // Pour RADIATION
  motifRadiation?: string;
  // Pour DELIBERE
  texteDelibere?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Utilisateur {
  id: string;
  email: string;
  nomComplet: string;
  role: 'admin' | 'collaborateur';
  createdAt: Date;
}

// Modèles de vue
export interface StatistiquesTableauBord {
  affairesActives: number;
  audiencesAVenir: number;
  audiencesNonRenseignees: number;
  audiencesDemain: number;
}

export interface EvenementCalendrier {
  id: string;
  titre: string;
  date: Date;
  heure?: string;
  referenceAffaire: string;
  parties: string;
  juridiction: string;
  chambre: string;
  statut: StatutAudience;
  type: TypeAudience;
}

// Types de formulaires
export interface FormulaireCreationAffaire {
  intitule: string;
  parties: Partie[];
  observations?: string;
}

export interface FormulaireCreationAudience {
  affaireId: string;
  date: Date;
  heure?: string;
  type: TypeAudience;
  juridiction: string;
  chambre?: string;
  ville?: string;
  notesPreparation?: string;
}

export interface FormulaireResultatAudience {
  audienceId: string;
  type: TypeResultatAudience;
  nouvelleDate?: Date;
  motifRenvoi?: string;
  motifRadiation?: string;
  texteDelibere?: string;
}

// Alias pour compatibilité avec les anciens composants
export type CaseStatus = StatutAffaire;
export type HearingStatus = StatutAudience;
export type HearingType = TypeAudience;
export type HearingResultType = TypeResultatAudience;

export interface Party extends Partie {}
export interface Case extends Affaire {}
export interface Hearing extends Audience {}
export interface HearingResult extends ResultatAudience {}
export interface User extends Utilisateur {}
export interface DashboardStats extends StatistiquesTableauBord {}
export interface CalendarEvent extends EvenementCalendrier {}
export interface CreateCaseForm extends FormulaireCreationAffaire {}
export interface CreateHearingForm extends FormulaireCreationAudience {}
export interface RecordResultForm extends FormulaireResultatAudience {}
