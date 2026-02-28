// Types pour le module Conseil
export type StatutClientConseil = 'ACTIF' | 'SUSPENDU' | 'RESILIE';
export type TypePartie = 'physique' | 'morale';
export type StatutFacture = 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'ANNULEE';
export type TypeTacheConseil = 'CONSULTATION' | 'REDACTION' | 'RECHERCHE' | 'REUNION' | 'AUTRE';
export type ModePaiement = 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'CARTE_BANCAIRE' | 'AUTRE';

// Interfaces pour les clients conseil
export interface ClientConseil {
  id: string;
  reference: string;
  nom: string;
  type: TypePartie;
  telephone?: string;
  email?: string;
  adresse?: string;
  honoraireMensuel: number;
  jourFacturation: number;
  statut: StatutClientConseil;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  _count?: {
    tachesConseils: number;
    facturesConseils: number;
  };
}

// Interfaces pour les tâches conseil
export interface TacheConseil {
  id: string;
  clientId: string;
  date: string;
  type: TypeTacheConseil;
  description: string;
  dureeMinutes?: number;
  moisConcerne: string;
  createdAt: string;
  createdBy: string;
  clientsConseil?: {
    id: string;
    reference: string;
    nom: string;
  };
}

// Interfaces pour les factures conseil
export interface FactureConseil {
  id: string;
  clientId: string;
  reference: string;
  moisConcerne: string;
  montantHt: number;
  tva: number;
  montantTtc: number;
  dateEmission: string;
  dateEcheance: string;
  statut: StatutFacture;
  notes?: string;
  createdAt: string;
  createdBy: string;
  clientsConseil?: {
    id: string;
    reference: string;
    nom: string;
  };
  _count?: {
    paiementsConseils: number;
  };
}

// Interfaces pour les paiements conseil
export interface PaiementConseil {
  id: string;
  factureId: string;
  date: string;
  montant: number;
  mode: ModePaiement;
  reference?: string;
  commentaire?: string;
  createdAt: string;
  createdBy: string;
  facturesConseil?: {
    id: string;
    reference: string;
    moisConcerne: string;
    montantTtc: number;
    clientsConseil: {
      id: string;
      reference: string;
      nom: string;
    };
  };
}

// DTOs pour les requêtes
export interface CreateClientConseilDto {
  nom: string;
  type?: TypePartie;
  telephone?: string;
  email?: string;
  adresse?: string;
  honoraireMensuel?: number;
  jourFacturation?: number;
  statut?: StatutClientConseil;
  notes?: string;
}

export interface UpdateClientConseilDto extends Partial<CreateClientConseilDto> {}

export interface CreateTacheConseilDto {
  clientId: string;
  date: string;
  type: TypeTacheConseil;
  description: string;
  dureeMinutes?: number;
  moisConcerne: string;
}

export interface UpdateTacheConseilDto extends Partial<Omit<CreateTacheConseilDto, 'clientId'>> {}

export interface CreateFactureConseilDto {
  clientId: string;
  moisConcerne: string;
  montantHt: number;
  tva?: number;
  montantTtc: number;
  dateEmission: string;
  dateEcheance: string;
  statut?: StatutFacture;
  notes?: string;
}

export interface UpdateFactureConseilDto extends Partial<Omit<CreateFactureConseilDto, 'clientId'>> {}

export interface CreatePaiementConseilDto {
  factureId: string;
  date: string;
  montant: number;
  mode: ModePaiement;
  reference?: string;
  commentaire?: string;
}

export interface UpdatePaiementConseilDto extends Partial<Omit<CreatePaiementConseilDto, 'factureId'>> {}

// Interfaces pour les requêtes de recherche
export interface ClientsConseilQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  statut?: StatutClientConseil;
  type?: TypePartie;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TachesConseilQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  type?: TypeTacheConseil;
  moisConcerne?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FacturesConseilQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  clientId?: string;
  statut?: StatutFacture;
  moisConcerne?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaiementsConseilQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  factureId?: string;
  mode?: ModePaiement;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interfaces pour les statistiques
export interface StatistiquesClientsConseil {
  total: number;
  actifs: number;
  suspendus: number;
  resilies: number;
  honoraireMoyenMensuel: number;
}

export interface StatistiquesFacturesConseil {
  totalFactures: number;
  montantTotalHt: number;
  montantTotalTtc: number;
  facturesPayees: number;
  facturesEnAttente: number;
  tauxPaiement: number;
}

// Interface pour les réponses paginées
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}