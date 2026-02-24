// ============================================
// CAPCO Application Types
// ============================================

// User & Authentication
export type UserRole = 'ADMIN' | 'COLLABORATEUR' | 'COMPTA';

export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  actif: boolean;
  createdAt: Date;
}

// Partie pour le module Contentieux (stockée dans parties_affaires)
export type RolePartie = 'DEMANDEUR' | 'DEFENDEUR' | 'CONSEIL_ADVERSE';

export interface PartieAffaire {
  id?: string;
  nom: string;
  role: RolePartie;
  telephone?: string;
  adresse?: string;
}

// Partie pour le module Recouvrement (annuaire global)
export interface Partie {
  id: string;
  type: 'physique' | 'morale';
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  typeRelation: 'creancier' | 'debiteur' | 'proprietaire' | 'locataire' | 'adversaire' | 'demandeur' | 'defendeur';
}

// ============================================
// MODULE CONTENTIEUX
// ============================================

export type StatutAffaire = 'ACTIVE' | 'CLOTUREE' | 'RADIEE';
export type StatutAudience = 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';
export type TypeResultat = 'RENVOI' | 'RADIATION' | 'DELIBERE';
export type ObjetAudience = 'MISE_EN_ETAT' | 'PLAIDOIRIE' | 'REFERE' | 'AUTRE';

export interface AffaireContentieuse {
  id: string;
  reference: string; // AFF-2026-0001
  intitule: string;
  demandeurs: PartieAffaire[];
  defendeurs: PartieAffaire[];
  conseil_adverse?: PartieAffaire[];
  juridiction: string;
  chambre: string;
  statut: StatutAffaire;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Audience {
  id: string;
  affaireId: string;
  affaire?: AffaireContentieuse;
  date: Date;
  heure?: string;
  objet: ObjetAudience;
  statut: StatutAudience;
  notesPreparation?: string;
  resultat?: ResultatAudience;
  createdAt: Date;
  createdBy: string;
}

export interface ResultatAudience {
  id: string;
  audienceId: string;
  type: TypeResultat;
  nouvelleDate?: Date; // Pour RENVOI
  motifRenvoi?: string; // Pour RENVOI
  motifRadiation?: string; // Pour RADIATION
  texteDelibere?: string; // Pour DELIBERE
  createdAt: Date;
  createdBy: string;
}

// ============================================
// MODULE RECOUVREMENT
// ============================================

export type StatutRecouvrement = 'EN_COURS' | 'CLOTURE';
export type TypeAction =
  | 'APPEL_TELEPHONIQUE'
  | 'COURRIER'
  | 'LETTRE_RELANCE'
  | 'MISE_EN_DEMEURE'
  | 'COMMANDEMENT_PAYER'
  | 'ASSIGNATION'
  | 'REQUETE'
  | 'AUDIENCE_PROCEDURE'
  | 'AUTRE';

export type TypeHonoraires = 'FORFAIT' | 'POURCENTAGE' | 'MIXTE';
export type ModePaiement = 'CASH' | 'VIREMENT' | 'CHEQUE' | 'WAVE' | 'OM';

export interface DossierRecouvrement {
  id: string;
  reference: string; // REC-2026-0001
  creancier: Partie;
  debiteur: Partie;
  montantPrincipal: number;
  penalitesInterets?: number;
  totalARecouvrer: number;
  statut: StatutRecouvrement;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ActionRecouvrement {
  id: string;
  dossierId: string;
  date: Date;
  typeAction: TypeAction;
  resume: string;
  prochaineEtape?: string;
  echeanceProchaineEtape?: Date;
  pieceJointe?: string;
  createdAt: Date;
  createdBy: string;
}

export interface PaiementRecouvrement {
  id: string;
  dossierId: string;
  date: Date;
  montant: number;
  mode: ModePaiement;
  reference?: string;
  commentaire?: string;
  createdAt: Date;
  createdBy: string;
}

export interface HonorairesCAPCO {
  id: string;
  dossierId: string;
  type: TypeHonoraires;
  montantPrevu: number;
  montantPaye: number;
  resteAPayer: number;
}

export interface DepenseDossier {
  id: string;
  dossierId: string;
  date: Date;
  nature: string;
  montant: number;
  justificatif?: string;
  createdAt: Date;
  createdBy: string;
}

// ============================================
// MODULE GESTION IMMOBILIERE
// ============================================

export type TypeLot = 'STUDIO' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'MAGASIN' | 'BUREAU' | 'AUTRE';
export type StatutLot = 'LIBRE' | 'OCCUPE';
export type StatutBail = 'ACTIF' | 'INACTIF';
export type TypeDepenseImmeuble =
  | 'PLOMBERIE_ASSAINISSEMENT'
  | 'ELECTRICITE_ECLAIRAGE'
  | 'ENTRETIEN_MAINTENANCE'
  | 'SECURITE_GARDIENNAGE_ASSURANCE'
  | 'AUTRES_DEPENSES';

// Type for dossier expenses
export type TypeDepenseDossier =
  | 'FRAIS_HUISSIER'
  | 'FRAIS_GREFFE'
  | 'TIMBRES_FISCAUX'
  | 'FRAIS_COURRIER'
  | 'FRAIS_DEPLACEMENT'
  | 'FRAIS_EXPERTISE'
  | 'AUTRES';

export interface Proprietaire {
  id: string;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  createdAt: Date;
}

export interface Immeuble {
  id: string;
  proprietaireId: string;
  proprietaire?: Proprietaire;
  nom: string;
  reference: string;
  adresse: string;
  tauxCommissionCAPCO: number; // en %
  notes?: string;
  createdAt: Date;
}

export interface Lot {
  id: string;
  immeubleId: string;
  immeuble?: Immeuble;
  numero: string;
  etage?: string;
  type: TypeLot;
  loyerMensuelAttendu: number;
  statut: StatutLot;
  locataireId?: string;
  locataire?: Locataire;
  createdAt: Date;
}

export interface Locataire {
  id: string;
  nom: string;
  telephone?: string;
  email?: string;
  createdAt: Date;
}

export interface Bail {
  id: string;
  lotId: string;
  lot?: Lot;
  locataireId: string;
  locataire?: Locataire;
  dateDebut: Date;
  montantLoyer: number;
  jourPaiementPrevu: number; // 1-31
  statut: StatutBail;
  createdAt: Date;
}

export interface EncaissementLoyer {
  id: string;
  lotId: string;
  lot?: Lot;
  moisConcerne: string; // 2026-01
  dateEncaissement: Date;
  montantEncaisse: number;
  modePaiement: ModePaiement;
  observation?: string;
  commissionCAPCO: number;
  netProprietaire: number;
  createdAt: Date;
  createdBy: string;
}

export interface DepenseImmeuble {
  id: string;
  immeubleId: string;
  date: Date;
  nature: string;
  description?: string;
  montant: number;
  typeDepense: TypeDepenseImmeuble;
  justificatif?: string;
  createdAt: Date;
  createdBy: string;
}

export interface RapportGestion {
  id: string;
  immeubleId: string;
  immeuble?: Immeuble;
  periodeDebut: Date;
  periodeFin: Date;
  totalLoyers: number;
  totalDepenses: number;
  totalCommissions: number;
  netProprietaire: number;
  dateGeneration: Date;
  genererPar: string;
  statut: 'BROUILLON' | 'GENERE' | 'ENVOYE';
}

// ============================================
// MODULE CONSEILS / ASSISTANCE JURIDIQUE
// ============================================

export type StatutClientConseil = 'ACTIF' | 'SUSPENDU' | 'RESILIE';
export type StatutFacture = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
export type TypeTache = 'CONSULTATION' | 'REDACTION' | 'NEGOCIATION' | 'RECHERCHE' | 'REUNION' | 'APPEL' | 'EMAIL' | 'AUTRE';

export interface ClientConseil {
  id: string;
  reference: string; // CLI-2026-0001
  nom: string;
  type: 'physique' | 'morale';
  telephone?: string;
  email?: string;
  adresse?: string;
  honoraireMensuel: number;
  jourFacturation: number; // 1-31
  statut: StatutClientConseil;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TacheConseil {
  id: string;
  clientId: string;
  client?: ClientConseil;
  date: Date;
  type: TypeTache;
  description: string;
  dureeMinutes?: number;
  moisConcerne: string; // 2026-01
  createdAt: Date;
  createdBy: string;
}

export interface FactureConseil {
  id: string;
  clientId: string;
  client?: ClientConseil;
  reference: string; // FAC-2026-0001
  moisConcerne: string; // 2026-01
  montantHT: number;
  tva?: number;
  montantTTC: number;
  dateEmission: Date;
  dateEcheance: Date;
  statut: StatutFacture;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface PaiementConseil {
  id: string;
  factureId: string;
  facture?: FactureConseil;
  date: Date;
  montant: number;
  mode: ModePaiement;
  reference?: string;
  commentaire?: string;
  createdAt: Date;
  createdBy: string;
}

// ============================================
// Dashboard & Stats
// ============================================

export interface DashboardStats {
  contentieux: {
    audiencesDemain: number;
    audiencesNonRenseignees: number;
    prochainesAudiences: number;
    affairesActives: number;
    honorairesFactures: number;
    honorairesEncaisses: number;
    honorairesEnAttente: number;
  };
  recouvrement: {
    dossiersEnCours: number;
    montantARecouvrer: number;
    totalEncaisse: number;
    dossiersSansAction7j: number;
    dossiersSansAction15j: number;
    dossiersSansAction30j: number;
    honorairesFactures: number;
    honorairesEncaisses: number;
    honorairesEnAttente: number;
  };
  immobilier: {
    loyersAttendusMois: number;
    loyersEncaissesMois: number;
    impayesMois: number;
    depensesMois: number;
    commissionsCAPCO: number;
  };
  conseil: {
    clientsActifs: number;
    facturesEnAttente: number;
    montantFactureMois: number;
    montantEncaisseMois: number;
    tachesMois: number;
  };
}

// ============================================
// Alertes
// ============================================

export type TypeAlerte =
  | 'AUDIENCE_NON_RENSEIGNEE'
  | 'DOSSIER_SANS_ACTION'
  | 'LOYER_IMPAYE'
  | 'ECHEANCE_PROCHE'
  | 'FACTURE_IMPAYEE';

export interface Alerte {
  id: string;
  type: TypeAlerte;
  titre: string;
  description: string;
  lien?: string;
  dateCreation: Date;
  lu: boolean;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
}
