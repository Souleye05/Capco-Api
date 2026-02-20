// Schémas de validation utilisant Zod
// Ces schémas valident les entrées de formulaire avant envoi à l'API

import { z } from 'zod';
import { formatDate } from './date-utils';

/**
 * Validation du rôle d'une partie
 */
const schemaRolePartie = z.enum(['demandeur', 'defendeur', 'conseil_adverse'], {
  errorMap: () => ({ message: 'Rôle invalide' }),
});

/**
 * Schéma de validation d'une partie
 */
const schemaPartie = z.object({
  nom: z.string()
    .min(1, 'Le nom est obligatoire')
    .max(200, 'Maximum 200 caractères')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'Le nom ne peut pas être vide',
    }),
  role: schemaRolePartie,
});

/**
 * Schéma de validation de création d'affaire
 */
export const schemaCreationAffaire = z.object({
  reference: z.string()
    .min(1, 'Le numéro de référence est obligatoire')
    .max(50, 'Maximum 50 caractères')
    .trim()
    .regex(/^[A-Z0-9\-\/]+$/, 'Format invalide (utilisez uniquement des lettres majuscules, chiffres, tirets et slashs)'),
  
  intitule: z.string()
    .min(3, 'L\'intitulé doit contenir au moins 3 caractères')
    .max(200, 'L\'intitulé ne peut pas dépasser 200 caractères')
    .trim(),
  
  parties: z.array(schemaPartie)
    .max(10, 'Maximum 10 parties')
    .optional()
    .default([]),
  
  observations: z.string()
    .max(2000, 'Maximum 2000 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
});

export type DonneesFormulaireCreationAffaire = z.infer<typeof schemaCreationAffaire>;

/**
 * Validation du type d'audience
 */
const schemaTypeAudience = z.enum([
  'MISE_EN_ETAT',
  'PLAIDOIRIE',
  'REFERE',
  'EVOCATION',
  'CONCILIATION',
  'MEDIATION',
  'AUTRE',
], {
  errorMap: () => ({ message: 'Type d\'audience invalide' }),
});

/**
 * Schéma de base pour la validation d'audience
 */
const schemaBaseAudience = z.object({
  affaireId: z.string()
    .uuid('ID d\'affaire invalide'),
  
  date: z.date({
    required_error: 'La date est obligatoire',
    invalid_type_error: 'Date invalide',
  }).refine((date) => {
    const dayOfWeek = date.getDay();
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[dayOfWeek];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = dimanche, 6 = samedi
    
    console.log(`[FRONTEND_WEEKEND_CHECK] Date: ${date.toISOString()} → ${dayName} (jour ${dayOfWeek})`);
    
    if (isWeekend) {
      console.warn(`🚫 [FRONTEND_WEEKEND_REJECTED] Tentative de sélection d'un ${dayName} - REJETÉE`);
      console.warn(`   → Date: ${formatDate(date)}`);
      console.warn(`   → Raison: Les tribunaux ne siègent pas les weekends`);
    } else {
      console.log(`✅ [FRONTEND_WEEKEND_APPROVED] Date ${dayName} acceptée - jour ouvrable`);
    }
    
    return !isWeekend;
  }, {
    message: 'Les audiences ne peuvent pas être programmées les weekends (samedi et dimanche)',
  }),
  
  heure: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)')
    .optional()
    .or(z.literal('')),
  
  type: schemaTypeAudience,
  
  juridiction: z.string()
    .min(1, 'La juridiction est obligatoire')
    .max(100, 'Maximum 100 caractères')
    .trim(),
  
  chambre: z.string()
    .max(100, 'Maximum 100 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  
  ville: z.string()
    .max(100, 'Maximum 100 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  
  notesPreparation: z.string()
    .max(2000, 'Maximum 2000 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  
  rappelEnrolement: z.boolean()
    .optional()
    .default(true),
});

/**
 * Schéma de validation de création d'audience
 */
export const schemaCreationAudience = schemaBaseAudience;

export type DonneesFormulaireCreationAudience = z.infer<typeof schemaCreationAudience>;

/**
 * Schéma de validation de connexion
 */
export const schemaConnexion = z.object({
  email: z.string()
    .min(1, 'L\'email est obligatoire')
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(1, 'Le mot de passe est obligatoire'),
    // Pas de validation stricte pour la connexion
    // L'utilisateur peut avoir un ancien mot de passe
});

export type DonneesFormulaireConnexion = z.infer<typeof schemaConnexion>;

/**
 * Schéma de validation d'inscription
 */
export const schemaInscription = z.object({
  email: z.string()
    .min(1, 'L\'email est obligatoire')
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Maximum 100 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  
  confirmPassword: z.string()
    .min(1, 'Veuillez confirmer le mot de passe'),
  
  nomComplet: z.string()
    .min(2, 'Le nom complet doit contenir au moins 2 caractères')
    .max(100, 'Maximum 100 caractères')
    .trim(),
  
  role: z.enum(['ADMIN', 'COLLABORATEUR'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type DonneesFormulaireInscription = z.infer<typeof schemaInscription>;

/**
 * Schéma de validation de changement de mot de passe
 */
export const schemaChangementMotDePasse = z.object({
  currentPassword: z.string()
    .min(1, 'Le mot de passe actuel est obligatoire'),
  
  newPassword: z.string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Maximum 100 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  
  confirmNewPassword: z.string()
    .min(1, 'Veuillez confirmer le nouveau mot de passe'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Le nouveau mot de passe doit être différent de l\'ancien',
  path: ['newPassword'],
});

export type DonneesFormulaireChangementMotDePasse = z.infer<typeof schemaChangementMotDePasse>;

/**
 * Schéma de validation d'enregistrement de résultat d'audience
 */
export const schemaEnregistrementResultatAudience = z.discriminatedUnion('type', [
  // RENVOI
  z.object({
    type: z.literal('RENVOI'),
    nouvelleDate: z.date({
      required_error: 'La nouvelle date est obligatoire pour un renvoi',
      invalid_type_error: 'Date invalide',
    }),
    motifRenvoi: z.string()
      .min(3, 'Le motif du renvoi doit contenir au moins 3 caractères')
      .max(500, 'Maximum 500 caractères')
      .trim(),
  }),
  // RADIATION
  z.object({
    type: z.literal('RADIATION'),
    motifRadiation: z.string()
      .min(3, 'Le motif de radiation doit contenir au moins 3 caractères')
      .max(500, 'Maximum 500 caractères')
      .trim(),
  }),
  // DELIBERE
  z.object({
    type: z.literal('DELIBERE'),
    texteDelibere: z.string()
      .min(3, 'Le texte du délibéré doit contenir au moins 3 caractères')
      .max(2000, 'Maximum 2000 caractères')
      .trim(),
  }),
]);

export type DonneesFormulaireEnregistrementResultatAudience = z.infer<typeof schemaEnregistrementResultatAudience>;

/**
 * Schéma de validation de mise à jour d'affaire (tous les champs optionnels)
 */
export const schemaMiseAJourAffaire = schemaCreationAffaire.partial();

export type DonneesMiseAJourAffaire = z.infer<typeof schemaMiseAJourAffaire>;

/**
 * Schéma de validation de mise à jour d'audience (tous les champs optionnels)
 */
export const schemaMiseAJourAudience = schemaBaseAudience.partial();

export type DonneesMiseAJourAudience = z.infer<typeof schemaMiseAJourAudience>;

// Alias pour compatibilité avec les anciens composants
export const createCaseSchema = schemaCreationAffaire;
export const createHearingSchema = schemaCreationAudience;
export const loginSchema = schemaConnexion;
export const registerSchema = schemaInscription;
export const changePasswordSchema = schemaChangementMotDePasse;
export const recordHearingResultSchema = schemaEnregistrementResultatAudience;
export const updateCaseSchema = schemaMiseAJourAffaire;
export const updateHearingSchema = schemaMiseAJourAudience;

export type CreateCaseFormData = DonneesFormulaireCreationAffaire;
export type CreateHearingFormData = DonneesFormulaireCreationAudience;
export type LoginFormData = DonneesFormulaireConnexion;
export type RegisterFormData = DonneesFormulaireInscription;
export type ChangePasswordFormData = DonneesFormulaireChangementMotDePasse;
export type RecordHearingResultFormData = DonneesFormulaireEnregistrementResultatAudience;
export type UpdateCaseFormData = DonneesMiseAJourAffaire;
export type UpdateHearingFormData = DonneesMiseAJourAudience;

