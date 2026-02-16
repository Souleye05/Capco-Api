export interface SupabaseUser {
  id: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  confirmation_sent_at?: string;
  recovery_sent_at?: string;
  email_change_sent_at?: string;
  new_email?: string;
  invited_at?: string;
  action_link?: string;
  email_change?: string;
  email_change_confirm_status?: number;
  banned_until?: string;
  raw_app_meta_data?: Record<string, any>;
  raw_user_meta_data?: Record<string, any>;
  is_super_admin?: boolean;
  role?: string;
  aud?: string;
  confirmation_token?: string;
  recovery_token?: string;
  email_change_token_new?: string;
  email_change_token_current?: string;
}

export interface UserMigrationData {
  users: SupabaseUser[];
  userProfiles?: UserProfile[];
  userRoles?: UserRoleData[];
  userMetadata?: UserMetadataEntry[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Pour les champs personnalisés
}

export interface UserRoleData {
  id: string;
  user_id: string;
  role: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface UserMetadataEntry {
  user_id: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}

export interface MigratedUser {
  id: string;
  email: string;
  password: string; // Hash temporaire ou migré
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  lastSignIn?: Date;
  migrationSource: string;
  temporaryPassword: boolean;
  resetToken?: string;
  resetExpiry?: Date;
  originalSupabaseId: string;
  migrationMetadata: UserMigrationMetadata;
}

export interface UserMigrationMetadata {
  originalCreatedAt: string;
  originalUpdatedAt: string;
  originalLastSignIn?: string;
  originalEmailConfirmedAt?: string;
  originalRawAppMetaData?: Record<string, any>;
  originalRawUserMetaData?: Record<string, any>;
  migrationTimestamp: Date;
  migrationVersion: string;
  passwordMigrationStrategy: 'TEMPORARY' | 'HASH_MIGRATED' | 'RESET_REQUIRED';
}

export interface UserMigrationResult {
  userId: string;
  originalId: string;
  email: string;
  status: UserMigrationStatus;
  migratedAt: Date;
  error?: string;
  passwordResetRequired: boolean;
  rolesCount: number;
  migratedRoles: string[];
}

export enum UserMigrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REQUIRES_PASSWORD_RESET = 'REQUIRES_PASSWORD_RESET',
  REQUIRES_MANUAL_REVIEW = 'REQUIRES_MANUAL_REVIEW',
}

export interface UserMigrationReport {
  migrationId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  totalUsers: number;
  migratedUsers: number;
  failedUsers: number;
  usersRequiringPasswordReset: number;
  usersRequiringManualReview: number;
  userResults: UserMigrationResult[];
  roleMigrationSummary: RoleMigrationSummary;
  passwordMigrationSummary: PasswordMigrationSummary;
  validationResults?: UserValidationSummary;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
}

export interface RoleMigrationSummary {
  totalRoles: number;
  migratedRoles: number;
  failedRoles: number;
  uniqueRoleTypes: string[];
  roleDistribution: Record<string, number>;
}

export interface PasswordMigrationSummary {
  totalUsers: number;
  temporaryPasswords: number;
  hashMigrated: number;
  resetRequired: number;
  migrationStrategy: 'TEMPORARY_ONLY' | 'HASH_MIGRATION' | 'RESET_REQUIRED' | 'MIXED';
}

export interface UserValidationSummary {
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  authenticationTests: AuthenticationTestSummary;
  roleValidations: RoleValidationSummary;
  dataIntegrityChecks: UserDataIntegrityCheck[];
}

export interface AuthenticationTestSummary {
  totalTests: number;
  successfulLogins: number;
  failedLogins: number;
  passwordResetTests: number;
  jwtValidationTests: number;
}

export interface RoleValidationSummary {
  totalRoleChecks: number;
  preservedRoles: number;
  missingRoles: number;
  incorrectRoles: number;
  roleDiscrepancies: RoleDiscrepancy[];
}

export interface RoleDiscrepancy {
  userId: string;
  email: string;
  expectedRoles: string[];
  actualRoles: string[];
  missingRoles: string[];
  extraRoles: string[];
}

export interface UserDataIntegrityCheck {
  checkType: 'EMAIL_UNIQUENESS' | 'ID_PRESERVATION' | 'TIMESTAMP_ACCURACY' | 'METADATA_PRESERVATION' | 'ROLE_CONSISTENCY';
  userId: string;
  email: string;
  expected: any;
  actual: any;
  passed: boolean;
  details?: string;
}

export interface UserMigrationOptions {
  batchSize?: number;
  passwordMigrationStrategy?: 'TEMPORARY_ONLY' | 'HASH_MIGRATION' | 'RESET_REQUIRED';
  preserveUserIds?: boolean;
  migrateUserProfiles?: boolean;
  migrateUserRoles?: boolean;
  validateAfterMigration?: boolean;
  sendPasswordResetEmails?: boolean;
  continueOnError?: boolean;
  dryRun?: boolean;
}

export interface UserMigrationProgress {
  migrationId: string;
  currentPhase: 'EXPORT' | 'TRANSFORM' | 'IMPORT' | 'ROLES' | 'VALIDATION' | 'NOTIFICATIONS' | 'COMPLETE';
  totalUsers: number;
  processedUsers: number;
  currentBatch: number;
  totalBatches: number;
  currentUser?: {
    email: string;
    status: UserMigrationStatus;
  };
  overallProgress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  phaseProgress: Record<string, number>;
}

export interface UserMigrationCheckpoint {
  checkpointId: string;
  migrationId: string;
  phase: string;
  usersProcessed: number;
  timestamp: Date;
  batchNumber: number;
  lastProcessedUserId?: string;
  metadata: {
    successfulMigrations: number;
    failedMigrations: number;
    passwordResetsSent: number;
    rolesProcessed: number;
  };
}

export interface PasswordResetRequest {
  userId: string;
  email: string;
  resetToken: string;
  expiresAt: Date;
  sentAt: Date;
  migrationRelated: boolean;
}

export interface UserIdMapping {
  originalSupabaseId: string;
  newUserId: string;
  email: string;
  migrationTimestamp: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'REQUIRES_VERIFICATION';
}

export interface UserMigrationFailure {
  originalUserId: string;
  email: string;
  error: string;
  errorCode: string;
  failedAt: Date;
  retryCount: number;
  canRetry: boolean;
  requiresManualIntervention: boolean;
}

export interface BulkPasswordResetResult {
  totalRequests: number;
  successfulSends: number;
  failedSends: number;
  emailFailures: EmailFailure[];
  batchId: string;
  processedAt: Date;
}

export interface EmailFailure {
  userId: string;
  email: string;
  error: string;
  retryable: boolean;
}

// Enhanced role migration types
export interface RoleMigrationResult {
  success: boolean;
  mappedRole?: 'admin' | 'collaborateur' | 'compta';
  roleId?: string;
  error?: string;
  canRetry?: boolean;
  originalRole?: string;
  skipped?: boolean;
  customPermissions?: CustomPermissionMigration[];
}

export interface RoleMigrationFailure {
  originalUserId: string;
  originalRole: string;
  error: string;
  metadata?: Record<string, any>;
  canRetry: boolean;
}

export interface CustomPermissionMigration {
  userId: string;
  originalRole: string;
  permissionType: string;
  permissionValue: any;
  resource?: string;
  actions: string[];
  metadata?: Record<string, any>;
}

export interface UserRoleValidationResult {
  isValid: boolean;
  actualRoles: string[];
  missingRoles: string[];
  extraRoles: string[];
  error?: string;
}

// Detailed migration report types
export interface DetailedMigrationReport {
  migrationId: string;
  generatedAt: Date;
  summary: {
    totalUsers: number;
    totalRoles: number;
    usersBySource: any[];
    roleDistribution: any[];
  };
  roleAnalysis: RoleAnalysis;
  permissionAnalysis: PermissionAnalysis;
  integrityCheck: IntegrityCheckResult;
  migrationLogs: MigrationLogSummary[];
  recommendations: string[];
}

export interface RoleAnalysis {
  totalMigratedUsers: number;
  usersWithRoles: number;
  usersWithoutRoles: number;
  roleDistribution: Record<string, number>;
  multiRoleUsers: number;
  averageRolesPerUser: number;
}

export interface PermissionAnalysis {
  totalUsersWithCustomPermissions: number;
  customPermissionTypes: string[];
  preservationRate: number;
}

export interface IntegrityCheckResult {
  overallPassed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: IntegrityCheck[];
}

export interface IntegrityCheck {
  checkName: string;
  passed: boolean;
  details: string;
}

export interface MigrationLogSummary {
  id: string;
  type: string;
  status: string;
  startTime: Date;
  endTime?: Date | null;
  recordsTotal?: number | null;
  recordsSuccess?: number | null;
  recordsFailed?: number | null;
  hasErrors: boolean;
}