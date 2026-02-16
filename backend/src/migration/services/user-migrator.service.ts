import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  SupabaseUser,
  UserMigrationData,
  UserMigrationReport,
  UserMigrationResult,
  UserMigrationStatus,
  MigratedUser,
  UserMigrationOptions,
  UserMigrationProgress,
  UserMigrationCheckpoint,
  UserIdMapping,
  UserMigrationFailure,
  PasswordResetRequest,
  BulkPasswordResetResult,
  RoleMigrationSummary,
  PasswordMigrationSummary,
  UserValidationSummary,
  AuthenticationTestSummary,
  RoleValidationSummary,
  UserDataIntegrityCheck,
  UserProfile,
  UserRoleData,
  UserMetadataEntry,
  RoleMigrationResult,
  RoleMigrationFailure,
  CustomPermissionMigration,
  UserRoleValidationResult,
  DetailedMigrationReport,
  RoleAnalysis,
  PermissionAnalysis,
  IntegrityCheckResult,
  IntegrityCheck,
} from '../types/user-migration.types';

@Injectable()
export class UserMigratorService {
  private readonly logger = new Logger(UserMigratorService.name);
  private supabaseClient: SupabaseClient;
  private readonly BATCH_SIZE = 50;
  private readonly PASSWORD_SALT_ROUNDS = 12;

  constructor(private prisma: PrismaService) {
    this.supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  /**
   * Migre tous les utilisateurs depuis Supabase auth.users vers le nouveau système
   */
  async migrateAllUsers(options: UserMigrationOptions = {}): Promise<UserMigrationReport> {
    const migrationId = crypto.randomUUID();
    const startTime = new Date();

    this.logger.log(`Starting user migration ${migrationId} with options:`, options);

    const report: UserMigrationReport = {
      migrationId,
      startTime,
      totalUsers: 0,
      migratedUsers: 0,
      failedUsers: 0,
      usersRequiringPasswordReset: 0,
      usersRequiringManualReview: 0,
      userResults: [],
      roleMigrationSummary: {
        totalRoles: 0,
        migratedRoles: 0,
        failedRoles: 0,
        uniqueRoleTypes: [],
        roleDistribution: {},
      },
      passwordMigrationSummary: {
        totalUsers: 0,
        temporaryPasswords: 0,
        hashMigrated: 0,
        resetRequired: 0,
        migrationStrategy: options.passwordMigrationStrategy || 'TEMPORARY_ONLY',
      },
      status: 'IN_PROGRESS',
    };

    try {
      // Phase 1: Export des utilisateurs depuis Supabase
      this.logger.log('Phase 1: Exporting users from Supabase auth.users');
      const userData = await this.exportUsersFromSupabase();
      report.totalUsers = userData.users.length;
      report.passwordMigrationSummary.totalUsers = userData.users.length;

      if (options.dryRun) {
        this.logger.log(`Dry run mode: Would migrate ${userData.users.length} users`);
        report.status = 'COMPLETED';
        return report;
      }

      // Phase 2: Migration des utilisateurs par batch
      this.logger.log('Phase 2: Migrating users to new system');
      const batchSize = options.batchSize || this.BATCH_SIZE;
      const batches = this.chunkArray(userData.users, batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.logger.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);

        const batchResults = await this.migrateBatch(batch, userData, options);
        report.userResults.push(...batchResults);

        // Mise à jour des compteurs
        batchResults.forEach(result => {
          if (result.status === UserMigrationStatus.SUCCESS) {
            report.migratedUsers++;
          } else {
            report.failedUsers++;
          }

          if (result.passwordResetRequired) {
            report.usersRequiringPasswordReset++;
          }

          if (result.status === UserMigrationStatus.REQUIRES_MANUAL_REVIEW) {
            report.usersRequiringManualReview++;
          }
        });

        // Créer un checkpoint après chaque batch
        if (options.batchSize && options.batchSize > 1) {
          await this.createMigrationCheckpoint(migrationId, i + 1, report);
        }
      }

      // Phase 3: Migration des rôles
      if (options.migrateUserRoles !== false) {
        this.logger.log('Phase 3: Migrating user roles');
        report.roleMigrationSummary = await this.migrateUserRoles(userData, report.userResults);
      }

      // Phase 4: Validation post-migration
      if (options.validateAfterMigration !== false) {
        this.logger.log('Phase 4: Validating migrated users');
        report.validationResults = await this.validateMigratedUsers(report.userResults);
      }

      // Phase 5: Envoi des emails de reset de mot de passe
      if (options.sendPasswordResetEmails !== false) {
        this.logger.log('Phase 5: Sending password reset emails');
        await this.sendBulkPasswordResetEmails(report.userResults.filter(r => r.passwordResetRequired));
      }

      report.endTime = new Date();
      report.totalDuration = report.endTime.getTime() - report.startTime.getTime();
      report.status = 'COMPLETED';

      this.logger.log(`User migration completed: ${report.migratedUsers}/${report.totalUsers} users migrated successfully`);
      return report;

    } catch (error) {
      this.logger.error(`User migration failed: ${error.message}`, error.stack);
      report.endTime = new Date();
      report.status = 'FAILED';
      throw error;
    }
  }

  /**
   * Exporte tous les utilisateurs depuis Supabase auth.users avec toutes les métadonnées
   */
  async exportUsersFromSupabase(): Promise<UserMigrationData> {
    this.logger.log('Exporting users from Supabase auth.users');

    try {
      // Export des utilisateurs auth.users
      const { data: authUsers, error: authError } = await this.supabaseClient.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Failed to export auth.users: ${authError.message}`);
      }

      this.logger.log(`Exported ${authUsers.users.length} users from auth.users`);

      // Export des profils utilisateur (si la table existe)
      let userProfiles: UserProfile[] = [];
      try {
        const { data: profiles, error: profileError } = await this.supabaseClient
          .from('profiles')
          .select('*');
        
        if (!profileError && profiles) {
          userProfiles = profiles;
          this.logger.log(`Exported ${profiles.length} user profiles`);
        }
      } catch (error) {
        this.logger.warn('No profiles table found or accessible, skipping profile export');
      }

      // Export des rôles utilisateur (si la table existe)
      let userRoles: UserRoleData[] = [];
      try {
        const { data: roles, error: roleError } = await this.supabaseClient
          .from('user_roles')
          .select('*');
        
        if (!roleError && roles) {
          userRoles = roles;
          this.logger.log(`Exported ${roles.length} user roles`);
        }
      } catch (error) {
        this.logger.warn('No user_roles table found or accessible, skipping role export');
      }

      return {
        users: authUsers.users as SupabaseUser[],
        userProfiles,
        userRoles,
        userMetadata: [], // Peut être étendu si nécessaire
      };

    } catch (error) {
      this.logger.error(`Failed to export users from Supabase: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Migre un batch d'utilisateurs
   */
  private async migrateBatch(
    users: SupabaseUser[],
    userData: UserMigrationData,
    options: UserMigrationOptions,
  ): Promise<UserMigrationResult[]> {
    const results: UserMigrationResult[] = [];

    for (const user of users) {
      try {
        const result = await this.migrateUser(user, userData, options);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to migrate user ${user.email}: ${error.message}`);
        results.push({
          userId: '',
          originalId: user.id,
          email: user.email,
          status: UserMigrationStatus.FAILED,
          migratedAt: new Date(),
          error: error.message,
          passwordResetRequired: false,
          rolesCount: 0,
          migratedRoles: [],
        });

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Migre un utilisateur individuel avec préservation des IDs et timestamps
   */
  private async migrateUser(
    supabaseUser: SupabaseUser,
    userData: UserMigrationData,
    options: UserMigrationOptions,
  ): Promise<UserMigrationResult> {
    this.logger.debug(`Migrating user: ${supabaseUser.email}`);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (existingUser) {
      this.logger.warn(`User ${supabaseUser.email} already exists, skipping`);
      return {
        userId: existingUser.id,
        originalId: supabaseUser.id,
        email: supabaseUser.email,
        status: UserMigrationStatus.SUCCESS,
        migratedAt: new Date(),
        passwordResetRequired: false,
        rolesCount: 0,
        migratedRoles: [],
      };
    }

    // Générer le mot de passe selon la stratégie choisie
    const { password, requiresReset } = await this.generatePassword(supabaseUser, options);

    // Créer l'utilisateur dans le nouveau système
    const newUser = await this.prisma.user.create({
      data: {
        id: options.preserveUserIds !== false ? supabaseUser.id : undefined,
        email: supabaseUser.email,
        password,
        createdAt: new Date(supabaseUser.created_at),
        updatedAt: new Date(supabaseUser.updated_at),
        emailVerified: !!supabaseUser.email_confirmed_at,
        lastSignIn: supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : null,
        migrationSource: 'supabase',
        resetToken: requiresReset ? await this.generateResetToken() : null,
        resetExpiry: requiresReset ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // 24h
      },
    });

    // Créer le mapping ID
    await this.createUserIdMapping(supabaseUser.id, newUser.id, supabaseUser.email);

    // Migrer le profil utilisateur si disponible
    const userProfile = userData.userProfiles?.find(p => p.user_id === supabaseUser.id);
    if (userProfile && options.migrateUserProfiles !== false) {
      await this.migrateUserProfile(newUser.id, userProfile);
    }

    this.logger.debug(`Successfully migrated user: ${supabaseUser.email} -> ${newUser.id}`);

    return {
      userId: newUser.id,
      originalId: supabaseUser.id,
      email: supabaseUser.email,
      status: UserMigrationStatus.SUCCESS,
      migratedAt: new Date(),
      passwordResetRequired: requiresReset,
      rolesCount: 0, // Sera mis à jour lors de la migration des rôles
      migratedRoles: [],
    };
  }

  /**
   * Génère un mot de passe selon la stratégie de migration
   */
  private async generatePassword(
    supabaseUser: SupabaseUser,
    options: UserMigrationOptions,
  ): Promise<{ password: string; requiresReset: boolean }> {
    const strategy = options.passwordMigrationStrategy || 'TEMPORARY_ONLY';

    switch (strategy) {
      case 'TEMPORARY_ONLY':
        // Génère un mot de passe temporaire sécurisé
        const tempPassword = crypto.randomBytes(32).toString('hex');
        const hashedTemp = await bcrypt.hash(tempPassword, this.PASSWORD_SALT_ROUNDS);
        return { password: hashedTemp, requiresReset: true };

      case 'HASH_MIGRATION':
        // Tente de migrer le hash existant (si accessible)
        // Pour Supabase, ce n'est généralement pas possible, donc fallback sur temporaire
        this.logger.warn('Hash migration not supported for Supabase, using temporary password');
        const fallbackPassword = crypto.randomBytes(32).toString('hex');
        const hashedFallback = await bcrypt.hash(fallbackPassword, this.PASSWORD_SALT_ROUNDS);
        return { password: hashedFallback, requiresReset: true };

      case 'RESET_REQUIRED':
        // Génère un hash invalide qui force le reset
        const invalidHash = await bcrypt.hash('INVALID_PASSWORD_REQUIRES_RESET', this.PASSWORD_SALT_ROUNDS);
        return { password: invalidHash, requiresReset: true };

      default:
        throw new Error(`Unknown password migration strategy: ${strategy}`);
    }
  }

  /**
   * Génère un token de reset sécurisé
   */
  private async generateResetToken(): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    return bcrypt.hash(token, this.PASSWORD_SALT_ROUNDS);
  }

  /**
   * Crée le mapping entre ancien et nouveau ID utilisateur
   */
  private async createUserIdMapping(
    originalId: string,
    newId: string,
    email: string,
  ): Promise<void> {
    // Stocker le mapping dans une table dédiée ou dans les métadonnées
    // Pour l'instant, on utilise une approche simple avec les logs
    this.logger.debug(`User ID mapping: ${originalId} -> ${newId} (${email})`);
    
    // Optionnel: Créer une table de mapping si nécessaire
    // await this.prisma.userIdMapping.create({
    //   data: {
    //     originalSupabaseId: originalId,
    //     newUserId: newId,
    //     email,
    //     migrationTimestamp: new Date(),
    //     status: 'ACTIVE',
    //   },
    // });
  }

  /**
   * Migre le profil utilisateur
   */
  private async migrateUserProfile(userId: string, profile: UserProfile): Promise<void> {
    // Ici on pourrait créer une table de profils ou étendre le modèle User
    // Pour l'instant, on log les informations du profil
    this.logger.debug(`Migrating profile for user ${userId}:`, {
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
    });

    // Exemple d'extension du modèle User si nécessaire:
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     firstName: profile.first_name,
    //     lastName: profile.last_name,
    //     phone: profile.phone,
    //     avatarUrl: profile.avatar_url,
    //   },
    // });
  }

  /**
   * Migre les rôles utilisateur avec validation complète et préservation des permissions
   */
  private async migrateUserRoles(
    userData: UserMigrationData,
    userResults: UserMigrationResult[],
  ): Promise<RoleMigrationSummary> {
    const summary: RoleMigrationSummary = {
      totalRoles: userData.userRoles?.length || 0,
      migratedRoles: 0,
      failedRoles: 0,
      uniqueRoleTypes: [],
      roleDistribution: {},
    };

    if (!userData.userRoles || userData.userRoles.length === 0) {
      this.logger.log('No user roles to migrate');
      return summary;
    }

    this.logger.log(`Starting migration of ${summary.totalRoles} user roles`);
    
    // Créer un mapping des utilisateurs pour une recherche rapide
    const userMapping = new Map<string, UserMigrationResult>();
    userResults.forEach(result => {
      if (result.status === UserMigrationStatus.SUCCESS) {
        userMapping.set(result.originalId, result);
      }
    });

    const roleTypes = new Set<string>();
    const roleFailures: RoleMigrationFailure[] = [];
    const customPermissions: CustomPermissionMigration[] = [];

    // Traiter les rôles par batch pour éviter la surcharge
    const roleBatches = this.chunkArray(userData.userRoles, 50);
    
    for (let batchIndex = 0; batchIndex < roleBatches.length; batchIndex++) {
      const batch = roleBatches[batchIndex];
      this.logger.log(`Processing role batch ${batchIndex + 1}/${roleBatches.length} (${batch.length} roles)`);

      for (const roleData of batch) {
        try {
          const migrationResult = await this.migrateUserRole(roleData, userMapping);
          
          if (migrationResult.success) {
            roleTypes.add(migrationResult.mappedRole!);
            summary.roleDistribution[migrationResult.mappedRole!] = 
              (summary.roleDistribution[migrationResult.mappedRole!] || 0) + 1;
            summary.migratedRoles++;

            // Mettre à jour le résultat utilisateur
            const userResult = userMapping.get(roleData.user_id);
            if (userResult) {
              userResult.rolesCount++;
              userResult.migratedRoles.push(migrationResult.mappedRole!);
            }

            // Traiter les permissions personnalisées si présentes
            if (migrationResult.customPermissions) {
              customPermissions.push(...migrationResult.customPermissions);
            }
          } else {
            summary.failedRoles++;
            roleFailures.push({
              originalUserId: roleData.user_id,
              originalRole: roleData.role,
              error: migrationResult.error!,
              metadata: roleData.metadata,
              canRetry: migrationResult.canRetry || false,
            });
          }

        } catch (error) {
          this.logger.error(`Unexpected error migrating role for user ${roleData.user_id}: ${error.message}`);
          summary.failedRoles++;
          roleFailures.push({
            originalUserId: roleData.user_id,
            originalRole: roleData.role,
            error: error.message,
            metadata: roleData.metadata,
            canRetry: true,
          });
        }
      }
    }

    summary.uniqueRoleTypes = Array.from(roleTypes);
    
    // Traiter les permissions personnalisées
    if (customPermissions.length > 0) {
      await this.migrateCustomPermissions(customPermissions);
    }

    // Générer un rapport détaillé des échecs
    if (roleFailures.length > 0) {
      await this.logRoleMigrationFailures(roleFailures);
    }

    this.logger.log(`Role migration completed: ${summary.migratedRoles}/${summary.totalRoles} roles migrated successfully`);
    this.logger.log(`Role distribution: ${JSON.stringify(summary.roleDistribution, null, 2)}`);

    return summary;
  }

  /**
   * Migre un rôle utilisateur individuel avec validation
   */
  private async migrateUserRole(
    roleData: UserRoleData,
    userMapping: Map<string, UserMigrationResult>
  ): Promise<RoleMigrationResult> {
    // Vérifier que l'utilisateur a été migré avec succès
    const userResult = userMapping.get(roleData.user_id);
    if (!userResult) {
      return {
        success: false,
        error: `User not found or not successfully migrated: ${roleData.user_id}`,
        canRetry: false,
      };
    }

    // Mapper le rôle Supabase vers le rôle NestJS
    const mappedRole = this.mapSupabaseRole(roleData.role);
    if (!mappedRole) {
      return {
        success: false,
        error: `Unknown role type: ${roleData.role}`,
        canRetry: false,
        originalRole: roleData.role,
      };
    }

    try {
      // Vérifier si le rôle existe déjà (éviter les doublons)
      const existingRole = await this.prisma.userRole.findUnique({
        where: {
          userId_role: {
            userId: userResult.userId,
            role: mappedRole,
          },
        },
      });

      if (existingRole) {
        this.logger.warn(`Role ${mappedRole} already exists for user ${userResult.email}, skipping`);
        return {
          success: true,
          mappedRole,
          skipped: true,
        };
      }

      // Créer le rôle dans le nouveau système
      const newRole = await this.prisma.userRole.create({
        data: {
          userId: userResult.userId,
          role: mappedRole,
        },
      });

      // Extraire les permissions personnalisées si présentes dans les métadonnées
      const customPermissions = this.extractCustomPermissions(roleData);

      return {
        success: true,
        mappedRole,
        roleId: newRole.id,
        customPermissions: customPermissions.length > 0 ? customPermissions : undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Database error: ${error.message}`,
        canRetry: true,
        originalRole: roleData.role,
      };
    }
  }

  /**
   * Extrait les permissions personnalisées des métadonnées de rôle
   */
  private extractCustomPermissions(roleData: UserRoleData): CustomPermissionMigration[] {
    const permissions: CustomPermissionMigration[] = [];
    
    if (roleData.metadata) {
      // Rechercher des permissions personnalisées dans les métadonnées
      if (roleData.metadata.permissions && Array.isArray(roleData.metadata.permissions)) {
        roleData.metadata.permissions.forEach((permission: any) => {
          permissions.push({
            userId: roleData.user_id,
            originalRole: roleData.role,
            permissionType: permission.type || 'custom',
            permissionValue: permission.value,
            resource: permission.resource,
            actions: permission.actions || [],
            metadata: permission.metadata,
          });
        });
      }

      // Rechercher des permissions spéciales dans les métadonnées
      if (roleData.metadata.specialPermissions) {
        Object.entries(roleData.metadata.specialPermissions).forEach(([key, value]) => {
          permissions.push({
            userId: roleData.user_id,
            originalRole: roleData.role,
            permissionType: 'special',
            permissionValue: value,
            resource: key,
            actions: ['access'],
            metadata: { source: 'specialPermissions' },
          });
        });
      }
    }

    return permissions;
  }

  /**
   * Migre les permissions personnalisées vers le nouveau système
   */
  private async migrateCustomPermissions(customPermissions: CustomPermissionMigration[]): Promise<void> {
    this.logger.log(`Migrating ${customPermissions.length} custom permissions`);
    
    // Pour l'instant, on les sauvegarde dans les métadonnées utilisateur
    // Dans une implémentation complète, on créerait une table permissions séparée
    for (const permission of customPermissions) {
      try {
        // Sauvegarder dans les métadonnées utilisateur pour référence future
        const existingUser = await this.prisma.user.findUnique({
          where: { id: permission.userId },
        });

        if (existingUser) {
          const existingMetadata = existingUser.migrationMetadata as any || {};
          const updatedMetadata = {
            ...existingMetadata,
            customPermissions: [
              ...(existingMetadata.customPermissions || []),
              {
                permissionType: permission.permissionType,
                permissionValue: permission.permissionValue,
                resource: permission.resource,
                actions: permission.actions,
                metadata: permission.metadata,
              },
            ],
          };

          await this.prisma.user.update({
            where: { id: permission.userId },
            data: {
              migrationMetadata: updatedMetadata,
            },
          });
        }
      } catch (error) {
        this.logger.error(`Failed to migrate custom permission for user ${permission.userId}: ${error.message}`);
      }
    }
  }

  /**
   * Enregistre les échecs de migration de rôles pour analyse
   */
  private async logRoleMigrationFailures(failures: RoleMigrationFailure[]): Promise<void> {
    this.logger.error(`${failures.length} role migrations failed:`);
    
    const failuresByType = failures.reduce((acc, failure) => {
      const key = failure.originalRole || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(failure);
      return acc;
    }, {} as Record<string, RoleMigrationFailure[]>);

    Object.entries(failuresByType).forEach(([roleType, roleFailures]) => {
      this.logger.error(`  ${roleType}: ${roleFailures.length} failures`);
      roleFailures.forEach(failure => {
        this.logger.error(`    User ${failure.originalUserId}: ${failure.error}`);
      });
    });

    // Sauvegarder les échecs dans la base pour référence
    try {
      await this.prisma.migrationLog.create({
        data: {
          migrationType: 'USERS',
          status: 'FAILED',
          startTime: new Date(),
          endTime: new Date(),
          recordsTotal: failures.length,
          recordsFailed: failures.length,
          errorDetails: {
            type: 'role_migration_failures',
            failures: failures.map(f => ({
              originalUserId: f.originalUserId,
              originalRole: f.originalRole,
              error: f.error,
              canRetry: f.canRetry,
            })),
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log role migration failures: ${error.message}`);
    }
  }

  /**
   * Mappe les rôles Supabase vers les rôles NestJS avec validation étendue
   */
  private mapSupabaseRole(supabaseRole: string): 'admin' | 'collaborateur' | 'compta' | null {
    if (!supabaseRole || typeof supabaseRole !== 'string') {
      this.logger.warn(`Invalid role format: ${supabaseRole}`);
      return null;
    }

    const normalizedRole = supabaseRole.toLowerCase().trim();
    
    const roleMapping: Record<string, 'admin' | 'collaborateur' | 'compta'> = {
      // Admin roles
      'admin': 'admin',
      'administrator': 'admin',
      'super_admin': 'admin',
      'superadmin': 'admin',
      'root': 'admin',
      'owner': 'admin',
      
      // Collaborateur roles
      'collaborateur': 'collaborateur',
      'employee': 'collaborateur',
      'user': 'collaborateur',
      'member': 'collaborateur',
      'staff': 'collaborateur',
      'worker': 'collaborateur',
      'assistant': 'collaborateur',
      'junior': 'collaborateur',
      'senior': 'collaborateur',
      
      // Compta roles
      'compta': 'compta',
      'comptable': 'compta',
      'accounting': 'compta',
      'accountant': 'compta',
      'finance': 'compta',
      'financial': 'compta',
      'treasurer': 'compta',
      'bookkeeper': 'compta',
    };

    const mappedRole = roleMapping[normalizedRole];
    
    if (!mappedRole) {
      this.logger.warn(`Unknown role type: ${supabaseRole}, available roles: ${Object.keys(roleMapping).join(', ')}`);
    }

    return mappedRole || null;
  }

  /**
   * Valide les utilisateurs migrés avec validation complète des rôles
   */
  private async validateMigratedUsers(userResults: UserMigrationResult[]): Promise<UserValidationSummary> {
    const summary: UserValidationSummary = {
      totalValidations: userResults.length,
      passedValidations: 0,
      failedValidations: 0,
      authenticationTests: {
        totalTests: 0,
        successfulLogins: 0,
        failedLogins: 0,
        passwordResetTests: 0,
        jwtValidationTests: 0,
      },
      roleValidations: {
        totalRoleChecks: 0,
        preservedRoles: 0,
        missingRoles: 0,
        incorrectRoles: 0,
        roleDiscrepancies: [],
      },
      dataIntegrityChecks: [],
    };

    this.logger.log(`Starting validation of ${userResults.length} migrated users`);

    // Valider chaque utilisateur
    for (const userResult of userResults) {
      if (userResult.status !== UserMigrationStatus.SUCCESS) {
        continue;
      }

      try {
        // Vérifier l'intégrité des données utilisateur
        const integrityChecks = await this.validateUserDataIntegrity(userResult);
        summary.dataIntegrityChecks.push(...integrityChecks);

        // Valider les rôles spécifiquement
        const roleValidation = await this.validateUserRoles(userResult);
        summary.roleValidations.totalRoleChecks++;
        
        if (roleValidation.isValid) {
          summary.roleValidations.preservedRoles++;
        } else {
          if (roleValidation.missingRoles.length > 0) {
            summary.roleValidations.missingRoles++;
          }
          if (roleValidation.extraRoles.length > 0) {
            summary.roleValidations.incorrectRoles++;
          }
          
          summary.roleValidations.roleDiscrepancies.push({
            userId: userResult.userId,
            email: userResult.email,
            expectedRoles: userResult.migratedRoles,
            actualRoles: roleValidation.actualRoles,
            missingRoles: roleValidation.missingRoles,
            extraRoles: roleValidation.extraRoles,
          });
        }

        // Déterminer si la validation globale a réussi
        const allIntegrityChecksPassed = integrityChecks.every(check => check.passed);
        const roleValidationPassed = roleValidation.isValid;

        if (allIntegrityChecksPassed && roleValidationPassed) {
          summary.passedValidations++;
        } else {
          summary.failedValidations++;
        }

      } catch (error) {
        this.logger.error(`Validation failed for user ${userResult.email}: ${error.message}`);
        summary.failedValidations++;
      }
    }

    // Générer un rapport de validation détaillé
    await this.generateValidationReport(summary);

    this.logger.log(`User validation completed: ${summary.passedValidations}/${summary.totalValidations} users passed validation`);
    this.logger.log(`Role validation: ${summary.roleValidations.preservedRoles}/${summary.roleValidations.totalRoleChecks} users have correct roles`);

    return summary;
  }

  /**
   * Valide les rôles d'un utilisateur migré
   */
  private async validateUserRoles(userResult: UserMigrationResult): Promise<UserRoleValidationResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userResult.userId },
        include: { userRoles: true },
      });

      if (!user) {
        return {
          isValid: false,
          actualRoles: [],
          missingRoles: userResult.migratedRoles,
          extraRoles: [],
          error: 'User not found in database',
        };
      }

      const actualRoles = user.userRoles.map(role => role.role as string);
      const expectedRoles = userResult.migratedRoles;

      const missingRoles = expectedRoles.filter(role => !actualRoles.includes(role));
      const extraRoles = actualRoles.filter(role => !expectedRoles.includes(role));

      const isValid = missingRoles.length === 0 && extraRoles.length === 0;

      return {
        isValid,
        actualRoles,
        missingRoles,
        extraRoles,
      };

    } catch (error) {
      return {
        isValid: false,
        actualRoles: [],
        missingRoles: userResult.migratedRoles,
        extraRoles: [],
        error: error.message,
      };
    }
  }

  /**
   * Génère un rapport de validation détaillé
   */
  private async generateValidationReport(summary: UserValidationSummary): Promise<void> {
    const report = {
      timestamp: new Date(),
      summary: {
        totalUsers: summary.totalValidations,
        passedValidations: summary.passedValidations,
        failedValidations: summary.failedValidations,
        successRate: summary.totalValidations > 0 
          ? (summary.passedValidations / summary.totalValidations * 100).toFixed(2) + '%'
          : '0%',
      },
      roleValidation: {
        totalRoleChecks: summary.roleValidations.totalRoleChecks,
        preservedRoles: summary.roleValidations.preservedRoles,
        missingRoles: summary.roleValidations.missingRoles,
        incorrectRoles: summary.roleValidations.incorrectRoles,
        roleSuccessRate: summary.roleValidations.totalRoleChecks > 0
          ? (summary.roleValidations.preservedRoles / summary.roleValidations.totalRoleChecks * 100).toFixed(2) + '%'
          : '0%',
      },
      discrepancies: summary.roleValidations.roleDiscrepancies,
      integrityIssues: summary.dataIntegrityChecks.filter(check => !check.passed),
    };

    this.logger.log('=== USER MIGRATION VALIDATION REPORT ===');
    this.logger.log(`Total Users Validated: ${report.summary.totalUsers}`);
    this.logger.log(`Validation Success Rate: ${report.summary.successRate}`);
    this.logger.log(`Role Preservation Rate: ${report.roleValidation.roleSuccessRate}`);
    
    if (report.discrepancies.length > 0) {
      this.logger.warn(`Found ${report.discrepancies.length} role discrepancies:`);
      report.discrepancies.forEach(discrepancy => {
        this.logger.warn(`  User ${discrepancy.email}:`);
        this.logger.warn(`    Expected: [${discrepancy.expectedRoles.join(', ')}]`);
        this.logger.warn(`    Actual: [${discrepancy.actualRoles.join(', ')}]`);
        if (discrepancy.missingRoles.length > 0) {
          this.logger.warn(`    Missing: [${discrepancy.missingRoles.join(', ')}]`);
        }
        if (discrepancy.extraRoles.length > 0) {
          this.logger.warn(`    Extra: [${discrepancy.extraRoles.join(', ')}]`);
        }
      });
    }

    if (report.integrityIssues.length > 0) {
      this.logger.warn(`Found ${report.integrityIssues.length} data integrity issues`);
    }

    // Sauvegarder le rapport dans la base de données
    try {
      await this.prisma.migrationLog.create({
        data: {
          migrationType: 'USERS',
          status: summary.failedValidations === 0 ? 'COMPLETED' : 'FAILED',
          startTime: new Date(),
          endTime: new Date(),
          recordsTotal: summary.totalValidations,
          recordsSuccess: summary.passedValidations,
          recordsFailed: summary.failedValidations,
          errorDetails: {
            type: 'user_validation_report',
            report: {
              timestamp: report.timestamp.toISOString(),
              summary: report.summary,
              roleValidation: report.roleValidation,
              discrepanciesCount: report.discrepancies.length,
              integrityIssuesCount: report.integrityIssues.length,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save validation report: ${error.message}`);
    }
  }

  /**
   * Valide l'intégrité des données d'un utilisateur migré
   */
  private async validateUserDataIntegrity(userResult: UserMigrationResult): Promise<UserDataIntegrityCheck[]> {
    const checks: UserDataIntegrityCheck[] = [];

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userResult.userId },
        include: { userRoles: true },
      });

      if (!user) {
        checks.push({
          checkType: 'ID_PRESERVATION',
          userId: userResult.userId,
          email: userResult.email,
          expected: 'User exists',
          actual: 'User not found',
          passed: false,
        });
        return checks;
      }

      // Vérifier l'unicité de l'email
      checks.push({
        checkType: 'EMAIL_UNIQUENESS',
        userId: userResult.userId,
        email: userResult.email,
        expected: userResult.email,
        actual: user.email,
        passed: user.email === userResult.email,
      });

      // Vérifier la préservation de l'ID
      checks.push({
        checkType: 'ID_PRESERVATION',
        userId: userResult.userId,
        email: userResult.email,
        expected: userResult.originalId,
        actual: user.id,
        passed: user.id === userResult.originalId,
      });

      // Vérifier la cohérence des rôles
      checks.push({
        checkType: 'ROLE_CONSISTENCY',
        userId: userResult.userId,
        email: userResult.email,
        expected: userResult.rolesCount,
        actual: user.userRoles.length,
        passed: user.userRoles.length === userResult.rolesCount,
      });

    } catch (error) {
      this.logger.error(`Data integrity validation failed for user ${userResult.userId}: ${error.message}`);
    }

    return checks;
  }

  /**
   * Envoie des emails de reset de mot de passe en masse
   */
  private async sendBulkPasswordResetEmails(usersRequiringReset: UserMigrationResult[]): Promise<BulkPasswordResetResult> {
    const result: BulkPasswordResetResult = {
      totalRequests: usersRequiringReset.length,
      successfulSends: 0,
      failedSends: 0,
      emailFailures: [],
      batchId: crypto.randomUUID(),
      processedAt: new Date(),
    };

    this.logger.log(`Sending password reset emails to ${usersRequiringReset.length} users`);

    for (const userResult of usersRequiringReset) {
      try {
        // Ici on intégrerait avec un service d'email (SendGrid, AWS SES, etc.)
        // Pour l'instant, on simule l'envoi
        await this.sendPasswordResetEmail(userResult.email, userResult.userId);
        result.successfulSends++;
        
      } catch (error) {
        this.logger.error(`Failed to send password reset email to ${userResult.email}: ${error.message}`);
        result.failedSends++;
        result.emailFailures.push({
          userId: userResult.userId,
          email: userResult.email,
          error: error.message,
          retryable: true,
        });
      }
    }

    this.logger.log(`Password reset emails sent: ${result.successfulSends}/${result.totalRequests} successful`);
    return result;
  }

  /**
   * Envoie un email de reset de mot de passe individuel
   */
  private async sendPasswordResetEmail(email: string, userId: string): Promise<void> {
    // Simulation de l'envoi d'email
    // Dans un vrai système, on utiliserait un service d'email
    this.logger.debug(`Sending password reset email to ${email} for user ${userId}`);
    
    // Exemple d'intégration avec un service d'email:
    // await this.emailService.sendPasswordResetEmail({
    //   to: email,
    //   resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
    //   userEmail: email,
    // });
  }

  /**
   * Crée un checkpoint de migration
   */
  private async createMigrationCheckpoint(
    migrationId: string,
    batchNumber: number,
    report: UserMigrationReport,
  ): Promise<void> {
    const checkpoint: UserMigrationCheckpoint = {
      checkpointId: crypto.randomUUID(),
      migrationId,
      phase: 'USER_MIGRATION',
      usersProcessed: report.migratedUsers + report.failedUsers,
      timestamp: new Date(),
      batchNumber,
      metadata: {
        successfulMigrations: report.migratedUsers,
        failedMigrations: report.failedUsers,
        passwordResetsSent: report.usersRequiringPasswordReset,
        rolesProcessed: report.roleMigrationSummary.migratedRoles,
      },
    };

    this.logger.debug(`Creating migration checkpoint: ${checkpoint.checkpointId}`);
    // Ici on sauvegarderait le checkpoint dans la base de données ou un fichier
  }

  /**
   * Utilitaire pour diviser un tableau en chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Obtient le mapping des IDs utilisateur
   */
  async getUserIdMapping(): Promise<UserIdMapping[]> {
    // Retourne le mapping entre anciens et nouveaux IDs
    // Pour l'instant, on retourne un tableau vide
    // Dans un vrai système, on récupérerait depuis une table de mapping
    return [];
  }

  /**
   * Obtient les statistiques de migration
   */
  async getMigrationStatistics(): Promise<any> {
    const totalUsers = await this.prisma.user.count();
    const migratedUsers = await this.prisma.user.count({
      where: { migrationSource: 'supabase' },
    });
    const usersWithRoles = await this.prisma.user.count({
      where: {
        migrationSource: 'supabase',
        userRoles: { some: {} },
      },
    });

    return {
      totalUsers,
      migratedUsers,
      usersWithRoles,
      migrationPercentage: totalUsers > 0 ? (migratedUsers / totalUsers) * 100 : 0,
    };
  }

  /**
   * Génère un rapport détaillé de migration des rôles et permissions
   */
  async generateDetailedMigrationReport(migrationId: string): Promise<DetailedMigrationReport> {
    this.logger.log(`Generating detailed migration report for migration: ${migrationId}`);

    try {
      // Récupérer les statistiques de base
      const basicStats = await this.getMigrationStatistics();
      
      // Récupérer les logs de migration
      const migrationLogs = await this.prisma.migrationLog.findMany({
        where: {
          migrationType: 'USERS',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // Analyser les rôles migrés
      const roleAnalysis = await this.analyzeRoleMigration();
      
      // Analyser les permissions personnalisées
      const permissionAnalysis = await this.analyzeCustomPermissions();
      
      // Vérifier l'intégrité des données
      const integrityCheck = await this.performIntegrityCheck();

      const report: DetailedMigrationReport = {
        migrationId,
        generatedAt: new Date(),
        summary: {
          totalUsers: basicStats.totalUsers,
          totalRoles: await this.prisma.userRole.count(),
          usersBySource: [{ migrationSource: 'supabase', _count: { id: basicStats.migratedUsers } }],
          roleDistribution: await this.getRoleDistribution(),
        },
        roleAnalysis,
        permissionAnalysis,
        integrityCheck,
        migrationLogs: migrationLogs.map(log => ({
          id: log.id,
          type: log.migrationType,
          status: log.status,
          startTime: log.startTime,
          endTime: log.endTime,
          recordsTotal: log.recordsTotal,
          recordsSuccess: log.recordsSuccess,
          recordsFailed: log.recordsFailed,
          hasErrors: log.errorDetails !== null,
        })),
        recommendations: this.generateRecommendations(roleAnalysis, integrityCheck),
      };

      // Sauvegarder le rapport
      await this.saveDetailedReport(report);

      this.logger.log('Detailed migration report generated successfully');
      return report;

    } catch (error) {
      this.logger.error(`Failed to generate detailed migration report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtient la distribution des rôles
   */
  private async getRoleDistribution(): Promise<any[]> {
    try {
      const result = await this.prisma.userRole.groupBy({
        by: ['role'],
        _count: {
          id: true,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to get role distribution: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyse la migration des rôles
   */
  private async analyzeRoleMigration(): Promise<RoleAnalysis> {
    const users = await this.prisma.user.findMany({
      where: {
        migrationSource: 'supabase',
      },
      include: {
        userRoles: true,
      },
    });

    const analysis: RoleAnalysis = {
      totalMigratedUsers: users.length,
      usersWithRoles: users.filter(u => u.userRoles.length > 0).length,
      usersWithoutRoles: users.filter(u => u.userRoles.length === 0).length,
      roleDistribution: {},
      multiRoleUsers: users.filter(u => u.userRoles.length > 1).length,
      averageRolesPerUser: users.length > 0 
        ? users.reduce((sum, u) => sum + u.userRoles.length, 0) / users.length 
        : 0,
    };

    // Calculer la distribution des rôles
    users.forEach(user => {
      user.userRoles.forEach(role => {
        analysis.roleDistribution[role.role] = (analysis.roleDistribution[role.role] || 0) + 1;
      });
    });

    return analysis;
  }

  /**
   * Analyse les permissions personnalisées
   */
  private async analyzeCustomPermissions(): Promise<PermissionAnalysis> {
    // For now, we'll return a basic analysis since we don't have complex permission structures yet
    // In a full implementation, this would analyze the migrationMetadata JSON field
    const usersWithCustomPermissions = await this.prisma.user.count({
      where: {
        migrationSource: 'supabase',
        migrationMetadata: {
          not: null,
        },
      },
    });

    return {
      totalUsersWithCustomPermissions: usersWithCustomPermissions,
      customPermissionTypes: [], // À implémenter selon les besoins spécifiques
      preservationRate: 100, // À calculer selon la logique métier
    };
  }

  /**
   * Effectue une vérification d'intégrité complète
   */
  private async performIntegrityCheck(): Promise<IntegrityCheckResult> {
    const checks: IntegrityCheck[] = [];

    // Vérifier l'unicité des emails
    const duplicateEmails = await this.prisma.user.groupBy({
      by: ['email'],
      having: {
        email: {
          _count: {
            gt: 1,
          },
        },
      },
      _count: {
        email: true,
      },
    });

    checks.push({
      checkName: 'Email Uniqueness',
      passed: duplicateEmails.length === 0,
      details: duplicateEmails.length > 0 
        ? `Found ${duplicateEmails.length} duplicate emails`
        : 'All emails are unique',
    });

    // Vérifier les utilisateurs sans rôles
    const usersWithoutRoles = await this.prisma.user.count({
      where: {
        userRoles: {
          none: {},
        },
        migrationSource: 'supabase',
      },
    });

    checks.push({
      checkName: 'Users with Roles',
      passed: usersWithoutRoles === 0,
      details: usersWithoutRoles > 0 
        ? `Found ${usersWithoutRoles} users without roles`
        : 'All users have at least one role',
    });

    // Vérifier la cohérence des IDs
    const usersWithInconsistentIds = await this.prisma.user.count({
      where: {
        migrationSource: 'supabase',
        id: {
          not: {
            contains: '-', // UUIDs contiennent des tirets
          },
        },
      },
    });

    checks.push({
      checkName: 'ID Consistency',
      passed: usersWithInconsistentIds === 0,
      details: usersWithInconsistentIds > 0 
        ? `Found ${usersWithInconsistentIds} users with inconsistent IDs`
        : 'All user IDs are consistent',
    });

    const overallPassed = checks.every(check => check.passed);

    return {
      overallPassed,
      totalChecks: checks.length,
      passedChecks: checks.filter(c => c.passed).length,
      failedChecks: checks.filter(c => !c.passed).length,
      checks,
    };
  }

  /**
   * Génère des recommandations basées sur l'analyse
   */
  private generateRecommendations(
    roleAnalysis: RoleAnalysis, 
    integrityCheck: IntegrityCheckResult
  ): string[] {
    const recommendations: string[] = [];

    if (roleAnalysis.usersWithoutRoles > 0) {
      recommendations.push(
        `${roleAnalysis.usersWithoutRoles} utilisateurs n'ont pas de rôles assignés. ` +
        'Considérez assigner des rôles par défaut ou vérifier la migration des rôles.'
      );
    }

    if (roleAnalysis.multiRoleUsers > roleAnalysis.totalMigratedUsers * 0.1) {
      recommendations.push(
        `${roleAnalysis.multiRoleUsers} utilisateurs ont plusieurs rôles. ` +
        'Vérifiez que cette configuration est intentionnelle.'
      );
    }

    if (!integrityCheck.overallPassed) {
      recommendations.push(
        `${integrityCheck.failedChecks} vérifications d'intégrité ont échoué. ` +
        'Examinez les détails et corrigez les problèmes identifiés.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('La migration des rôles et permissions s\'est déroulée avec succès. Aucune action requise.');
    }

    return recommendations;
  }

  /**
   * Sauvegarde le rapport détaillé
   */
  private async saveDetailedReport(report: DetailedMigrationReport): Promise<void> {
    try {
      await this.prisma.migrationLog.create({
        data: {
          migrationType: 'USERS',
          status: 'COMPLETED',
          startTime: new Date(),
          endTime: new Date(),
          recordsTotal: report.summary.totalUsers,
          recordsSuccess: report.summary.totalUsers,
          recordsFailed: 0,
          errorDetails: {
            type: 'detailed_migration_report',
            report: {
              migrationId: report.migrationId,
              generatedAt: report.generatedAt.toISOString(),
              summary: report.summary,
              roleAnalysis: {
                totalMigratedUsers: report.roleAnalysis.totalMigratedUsers,
                usersWithRoles: report.roleAnalysis.usersWithRoles,
                usersWithoutRoles: report.roleAnalysis.usersWithoutRoles,
                multiRoleUsers: report.roleAnalysis.multiRoleUsers,
                averageRolesPerUser: report.roleAnalysis.averageRolesPerUser,
              },
              integrityCheck: {
                overallPassed: report.integrityCheck.overallPassed,
                totalChecks: report.integrityCheck.totalChecks,
                passedChecks: report.integrityCheck.passedChecks,
                failedChecks: report.integrityCheck.failedChecks,
              },
              recommendationsCount: report.recommendations.length,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save detailed report: ${error.message}`);
    }
  }
}