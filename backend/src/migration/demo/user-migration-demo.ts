import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UserMigratorService } from '../services/user-migrator.service';
import { UserMigrationOptions } from '../types/user-migration.types';

/**
 * Démo de migration des utilisateurs depuis Supabase
 * 
 * Ce script démontre l'utilisation du UserMigratorService pour migrer
 * tous les utilisateurs depuis Supabase auth.users vers le nouveau système NestJS.
 * 
 * Fonctionnalités démontrées:
 * - Export de tous les utilisateurs depuis auth.users
 * - Migration avec préservation des IDs et timestamps
 * - Stratégies de migration des mots de passe
 * - Migration des rôles utilisateur
 * - Validation post-migration
 * - Génération de rapports détaillés
 */
async function runUserMigrationDemo() {
  console.log('🚀 Starting User Migration Demo');
  console.log('================================');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userMigrator = app.get(UserMigratorService);

  try {
    // Configuration de la migration
    const migrationOptions: UserMigrationOptions = {
      batchSize: 10, // Traiter par petits batches pour la démo
      passwordMigrationStrategy: 'TEMPORARY_ONLY', // Mots de passe temporaires
      preserveUserIds: true, // Préserver les UUIDs Supabase
      migrateUserProfiles: true, // Migrer les profils si disponibles
      migrateUserRoles: true, // Migrer les rôles utilisateur
      validateAfterMigration: true, // Valider après migration
      sendPasswordResetEmails: false, // Ne pas envoyer d'emails en démo
      continueOnError: true, // Continuer même en cas d'erreur
      dryRun: false, // Exécution réelle (mettre à true pour simulation)
    };

    console.log('📋 Migration Options:');
    console.log(JSON.stringify(migrationOptions, null, 2));
    console.log('');

    // Phase 1: Export des données utilisateur
    console.log('📤 Phase 1: Exporting users from Supabase...');
    const userData = await userMigrator.exportUsersFromSupabase();
    console.log(`✅ Exported ${userData.users.length} users from Supabase`);
    console.log(`   - User profiles: ${userData.userProfiles?.length || 0}`);
    console.log(`   - User roles: ${userData.userRoles?.length || 0}`);
    console.log('');

    // Afficher quelques exemples d'utilisateurs (sans données sensibles)
    if (userData.users.length > 0) {
      console.log('👥 Sample users to migrate:');
      userData.users.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`      Created: ${user.created_at}`);
        console.log(`      Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`      Last sign in: ${user.last_sign_in_at || 'Never'}`);
      });
      if (userData.users.length > 3) {
        console.log(`   ... and ${userData.users.length - 3} more users`);
      }
      console.log('');
    }

    // Phase 2: Migration complète
    console.log('🔄 Phase 2: Starting complete user migration...');
    const migrationReport = await userMigrator.migrateAllUsers(migrationOptions);

    // Affichage du rapport de migration
    console.log('📊 Migration Report:');
    console.log('===================');
    console.log(`Migration ID: ${migrationReport.migrationId}`);
    console.log(`Status: ${migrationReport.status}`);
    console.log(`Duration: ${migrationReport.totalDuration}ms`);
    console.log('');

    console.log('👥 User Migration Summary:');
    console.log(`   Total users: ${migrationReport.totalUsers}`);
    console.log(`   Successfully migrated: ${migrationReport.migratedUsers}`);
    console.log(`   Failed migrations: ${migrationReport.failedUsers}`);
    console.log(`   Requiring password reset: ${migrationReport.usersRequiringPasswordReset}`);
    console.log(`   Requiring manual review: ${migrationReport.usersRequiringManualReview}`);
    console.log('');

    console.log('🔐 Password Migration Summary:');
    console.log(`   Strategy: ${migrationReport.passwordMigrationSummary.migrationStrategy}`);
    console.log(`   Temporary passwords: ${migrationReport.passwordMigrationSummary.temporaryPasswords}`);
    console.log(`   Hash migrated: ${migrationReport.passwordMigrationSummary.hashMigrated}`);
    console.log(`   Reset required: ${migrationReport.passwordMigrationSummary.resetRequired}`);
    console.log('');

    console.log('👤 Role Migration Summary:');
    console.log(`   Total roles: ${migrationReport.roleMigrationSummary.totalRoles}`);
    console.log(`   Successfully migrated: ${migrationReport.roleMigrationSummary.migratedRoles}`);
    console.log(`   Failed roles: ${migrationReport.roleMigrationSummary.failedRoles}`);
    console.log(`   Unique role types: ${migrationReport.roleMigrationSummary.uniqueRoleTypes.join(', ')}`);
    console.log('   Role distribution:');
    Object.entries(migrationReport.roleMigrationSummary.roleDistribution).forEach(([role, count]) => {
      console.log(`     - ${role}: ${count}`);
    });
    console.log('');

    // Validation Results
    if (migrationReport.validationResults) {
      console.log('✅ Validation Results:');
      console.log(`   Total validations: ${migrationReport.validationResults.totalValidations}`);
      console.log(`   Passed: ${migrationReport.validationResults.passedValidations}`);
      console.log(`   Failed: ${migrationReport.validationResults.failedValidations}`);
      console.log('');
    }

    // Détails des résultats par utilisateur (premiers 5)
    if (migrationReport.userResults.length > 0) {
      console.log('📋 Individual User Results (first 5):');
      migrationReport.userResults.slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.email}`);
        console.log(`      Status: ${result.status}`);
        console.log(`      User ID: ${result.userId}`);
        console.log(`      Original ID: ${result.originalId}`);
        console.log(`      Password reset required: ${result.passwordResetRequired ? 'Yes' : 'No'}`);
        console.log(`      Roles migrated: ${result.migratedRoles.join(', ') || 'None'}`);
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
        console.log('');
      });
    }

    // Statistiques finales
    console.log('📈 Final Statistics:');
    const stats = await userMigrator.getMigrationStatistics();
    console.log(`   Total users in system: ${stats.totalUsers}`);
    console.log(`   Migrated from Supabase: ${stats.migratedUsers}`);
    console.log(`   Users with roles: ${stats.usersWithRoles}`);
    console.log(`   Migration percentage: ${stats.migrationPercentage.toFixed(2)}%`);
    console.log('');

    if (migrationReport.status === 'COMPLETED') {
      console.log('🎉 User migration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Review the migration report for any failed users');
      console.log('2. Send password reset emails to migrated users');
      console.log('3. Test authentication with migrated users');
      console.log('4. Validate user permissions and roles');
      console.log('5. Update frontend to use new authentication system');
    } else {
      console.log('❌ User migration failed or incomplete');
      console.log('Please review the errors and retry if necessary');
    }

  } catch (error) {
    console.error('💥 User migration demo failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await app.close();
  }
}

// Exécuter la démo si ce fichier est appelé directement
if (require.main === module) {
  runUserMigrationDemo()
    .then(() => {
      console.log('✅ User migration demo completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User migration demo failed:', error);
      process.exit(1);
    });
}

export { runUserMigrationDemo };