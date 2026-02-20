// Types API - Interfaces TypeScript strictes pour les réponses API
// Ces types correspondent au schéma Prisma backend (noms de champs français)

/**
 * Rôles utilisateur
 */
export type RoleUtilisateur = 'ADMIN' | 'COLLABORATEUR';

/**
 * Interface utilisateur (depuis le modèle Utilisateur backend)
 */
export interface UtilisateurResponse {
  id: string;
  email: string;
  nomComplet: string;
  role: RoleUtilisateur;
  estActif?: boolean;
  createdAt: string;
  updatedAt: string;
  derniereConnexionAt?: string;
  derniereConnexionIp?: string;
  derniereConnexionUserAgent?: string;
}

/**
 * Réponse d'authentification
 */
export interface ReponseAuth {
  utilisateur: UtilisateurResponse;
  accessToken: string;
  refreshToken: string;
}

/**
 * Réponse de rafraîchissement de token
 */
export interface ReponseRefreshToken {
  accessToken: string;
  refreshToken: string;
}

/**
 * Rôle d'une partie dans une affaire
 */
export type RolePartie = 'DEMANDEUR' | 'DEFENDEUR' | 'CONSEIL_ADVERSE';

/**
 * Interface partie (modèle Partie)
 */
export interface PartieResponse {
  id: string;
  nom: string;
  role: RolePartie;
  affaireId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statuts d'affaire
 */
export type StatutAffaire = 'ACTIVE' | 'CLOTUREE' | 'RADIEE';

/**
 * Interface affaire (modèle Affaire)
 */
export interface AffaireResponse {
  id: string;
  reference: string;
  intitule: string;
  statut: StatutAffaire;
  parties?: PartieResponse[];
  observations?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Types d'audience
 */
export type TypeAudience = 
  | 'MISE_EN_ETAT' 
  | 'PLAIDOIRIE' 
  | 'REFERE' 
  | 'EVOCATION' 
  | 'CONCILIATION'
  | 'MEDIATION'
  | 'AUTRE';

/**
 * Statuts d'audience
 */
export type StatutAudience = 'A_VENIR' | 'PASSEE_NON_RENSEIGNEE' | 'RENSEIGNEE';

/**
 * Types de résultat d'audience
 */
export type TypeResultatAudience = 'RENVOI' | 'RADIATION' | 'DELIBERE';

/**
 * Interface audience (modèle Audience)
 */
export interface AudienceResponse {
  id: string;
  affaireId: string;
  affaire?: AffaireResponse;
  date: string;
  heure?: string;
  type: TypeAudience;
  juridiction: string;
  chambre?: string;
  ville?: string;
  statut: StatutAudience;
  notesPreparation?: string;
  resultatType?: TypeResultatAudience;
  resultatDetails?: string;
  nouvelleDate?: string;
  motifRenvoi?: string;
  motifRadiation?: string;
  texteDelibere?: string;
  resultat?: {
    id: string;
    type: TypeResultatAudience;
    nouvelleDate?: string;
    motifRenvoi?: string;
    motifRadiation?: string;
    texteDelibere?: string;
    audienceId: string;
    createdAt: string;
    createurId: string;
  };
  estPrepare: boolean;
  rappelEnrolement?: boolean;
  dateRappelEnrolement?: string;
  enrolementEffectue?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Interface journal d'audit (modèle JournalAudit)
 */
export interface JournalAuditResponse {
  id: string;
  typeEntite: string;
  idEntite: string;
  action: 'CREATION' | 'MODIFICATION' | 'SUPPRESSION';
  ancienneValeur?: string | null;
  nouvelleValeur?: string | null;
  utilisateurId: string;
  utilisateur: {
    id: string;
    nomComplet: string;
    email: string;
  };
  createdAt: string;
}

/**
 * Interface alerte (modèle Alerte)
 */
export interface AlerteResponse {
  id: string;
  audienceId: string;
  audience?: AudienceResponse;
  type: string;
  message: string;
  estEnvoyee: boolean;
  dateEnvoi?: string;
  createdAt: string;
}

/**
 * Statistiques du tableau de bord
 */
export interface StatistiquesTableauBord {
  totalAffaires: number;
  affairesActives: number;
  audiencesAVenir: number;
  audiencesNonRenseignees: number;
}

/**
 * DTO de création d'affaire
 */
export interface CreateAffaireRequest {
  reference: string;
  intitule: string;
  parties: Array<{
    nom: string;
    role: RolePartie;
  }>;
  observations?: string;
}

/**
 * DTO de mise à jour d'affaire
 */
export interface UpdateAffaireRequest {
  intitule?: string;
  statut?: StatutAffaire;
  observations?: string;
}

/**
 * DTO de création d'audience
 */
export interface CreateAudienceRequest {
  affaireId: string;
  date: string;
  heure?: string;
  type: TypeAudience;
  juridiction: string;
  chambre?: string;
  ville?: string;
  notesPreparation?: string;
  rappelEnrolement?: boolean;
}

/**
 * DTO de mise à jour d'audience
 */
export interface UpdateAudienceRequest {
  date?: string;
  heure?: string;
  type?: TypeAudience;
  notesPreparation?: string;
  estPrepare?: boolean;
}

/**
 * DTO d'enregistrement de résultat d'audience
 */
export interface CreateResultatAudienceRequest {
  type: TypeResultatAudience;
  nouvelleDate?: string;
  motifRenvoi?: string;
  motifRadiation?: string;
  texteDelibere?: string;
  creerRappelRecours?: boolean;
  dateLimiteRecours?: string;
  notesRecours?: string;
}

/**
 * DTO de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * DTO d'inscription
 */
export interface RegisterRequest {
  email: string;
  password: string;
  nomComplet: string;
}

/**
 * DTO de changement de mot de passe
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * DTO de mot de passe oublié
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * DTO de réinitialisation de mot de passe
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * DTO de rafraîchissement de token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Réponse paginée
 */
export interface ReponsePaginee<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Réponse d'erreur API
 */
export interface ErreurAPI {
  statusCode: number;
  message: string;
  error?: string;
}

// Alias pour compatibilité avec les anciens composants
export type UserRole = RoleUtilisateur;
export type User = UtilisateurResponse;
export type AuthResponse = ReponseAuth;
export type RefreshTokenResponse = ReponseRefreshToken;
export type PartyRole = RolePartie;
export type Party = PartieResponse;
export type Case = AffaireResponse;
export type Hearing = AudienceResponse;
export type AuditLog = JournalAuditResponse;
export type Alert = AlerteResponse;
export type DashboardStats = StatistiquesTableauBord;
export type CreateCaseDto = CreateAffaireRequest;
export type UpdateCaseDto = UpdateAffaireRequest;
export type CreateHearingDto = CreateAudienceRequest;
export type UpdateHearingDto = UpdateAudienceRequest;
export type RecordHearingResultDto = CreateResultatAudienceRequest;
export type LoginDto = LoginRequest;
export type RegisterDto = RegisterRequest;
export type ChangePasswordDto = ChangePasswordRequest;
export type ForgotPasswordDto = ForgotPasswordRequest;
export type ResetPasswordDto = ResetPasswordRequest;
export type RefreshTokenDto = RefreshTokenRequest;
export type PaginatedResponse<T> = ReponsePaginee<T>;
export type ApiError = ErreurAPI;

// Re-export des types depuis legal.ts pour commodité
export type { StatutAffaire as CaseStatus, TypeAudience as HearingType, StatutAudience as HearingStatus, TypeResultatAudience as HearingResultType } from './legal';
