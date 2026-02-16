import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Script d'export des utilisateurs depuis Supabase
 * 
 * Ce script exporte tous les utilisateurs depuis Supabase auth.users
 * et les sauvegarde dans un fichier JSON pour analyse ou migration.
 */

interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  email_change?: string;
  phone_change?: string;
  user_metadata?: any;
  app_metadata?: any;
  identities?: any[];
}

interface UserExportResult {
  success: boolean;
  totalUsers: number;
  exportedUsers: SupabaseUser[];
  exportPath?: string;
  error?: string;
  timestamp: string;
}

async function exportAllUsers(): Promise<UserExportResult> {
  console.log('🚀 EXPORT DES UTILISATEURS SUPABASE');
  console.log('=' .repeat(50));

  const result: UserExportResult = {
    success: false,
    totalUsers: 0,
    exportedUsers: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Variables d\'environnement manquantes:\n' +
        '- SUPABASE_URL: ' + (supabaseUrl ? '✅' : '❌') + '\n' +
        '- SUPABASE_SERVICE_ROLE_KEY: ' + (supabaseServiceKey ? '✅' : '❌') + '\n\n' +
        'Assurez-vous que ces variables sont définies dans votre fichier .env'
      );
    }

    console.log('🔗 Connexion à Supabase...');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

    // Créer le client Supabase avec la clé de service
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('\n📥 Export des utilisateurs depuis auth.users...');

    // Exporter tous les utilisateurs
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Erreur lors de l'export des utilisateurs: ${authError.message}`);
    }

    if (!authData || !authData.users) {
      throw new Error('Aucune donnée utilisateur retournée par Supabase');
    }

    const users = authData.users as SupabaseUser[];
    result.totalUsers = users.length;
    result.exportedUsers = users;

    console.log(`✅ ${users.length} utilisateurs exportés avec succès`);

    // Afficher un aperçu des utilisateurs
    console.log('\n👥 APERÇU DES UTILISATEURS:');
    console.log('-' .repeat(30));
    
    if (users.length > 0) {
      users.slice(0, 5).forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Créé: ${new Date(user.created_at).toLocaleDateString('fr-FR')}`);
        console.log(`   Dernière connexion: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'}`);
        console.log(`   Email confirmé: ${user.email_confirmed_at ? '✅' : '❌'}`);
        console.log();
      });

      if (users.length > 5) {
        console.log(`... et ${users.length - 5} autres utilisateurs`);
      }
    }

    // Statistiques détaillées
    console.log('\n📊 STATISTIQUES:');
    console.log('-' .repeat(20));
    
    const confirmedUsers = users.filter(u => u.email_confirmed_at).length;
    const usersWithLastSignIn = users.filter(u => u.last_sign_in_at).length;
    const usersWithPhone = users.filter(u => u.phone).length;
    const usersWithMetadata = users.filter(u => u.user_metadata && Object.keys(u.user_metadata).length > 0).length;

    console.log(`Total utilisateurs: ${users.length}`);
    console.log(`Emails confirmés: ${confirmedUsers} (${((confirmedUsers / users.length) * 100).toFixed(1)}%)`);
    console.log(`Avec dernière connexion: ${usersWithLastSignIn} (${((usersWithLastSignIn / users.length) * 100).toFixed(1)}%)`);
    console.log(`Avec téléphone: ${usersWithPhone} (${((usersWithPhone / users.length) * 100).toFixed(1)}%)`);
    console.log(`Avec métadonnées: ${usersWithMetadata} (${((usersWithMetadata / users.length) * 100).toFixed(1)}%)`);

    // Sauvegarder dans un fichier JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(process.cwd(), 'migration-exports');
    const exportPath = path.join(exportDir, `users-export-${timestamp}.json`);

    // Créer le dossier s'il n'existe pas
    await fs.ensureDir(exportDir);

    // Préparer les données d'export
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalUsers: users.length,
        supabaseUrl: supabaseUrl,
        statistics: {
          confirmedUsers,
          usersWithLastSignIn,
          usersWithPhone,
          usersWithMetadata
        }
      },
      users: users.map(user => ({
        ...user,
        // Masquer les données sensibles dans l'export
        user_metadata: user.user_metadata ? '[METADATA_PRESENT]' : null,
        app_metadata: user.app_metadata ? '[APP_METADATA_PRESENT]' : null
      }))
    };

    await fs.writeJSON(exportPath, exportData, { spaces: 2 });

    console.log(`\n💾 Export sauvegardé: ${exportPath}`);
    
    result.success = true;
    result.exportPath = exportPath;

    // Export des rôles utilisateur si la table existe
    console.log('\n🔍 Recherche des rôles utilisateur...');
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (!rolesError && rolesData && rolesData.length > 0) {
        console.log(`✅ ${rolesData.length} rôles utilisateur trouvés`);
        
        const rolesExportPath = path.join(exportDir, `user-roles-export-${timestamp}.json`);
        await fs.writeJSON(rolesExportPath, {
          metadata: {
            exportDate: new Date().toISOString(),
            totalRoles: rolesData.length
          },
          roles: rolesData
        }, { spaces: 2 });
        
        console.log(`💾 Rôles sauvegardés: ${rolesExportPath}`);
      } else {
        console.log('ℹ️  Aucun rôle utilisateur trouvé ou table user_roles inexistante');
      }
    } catch (error) {
      console.log('ℹ️  Table user_roles non accessible (normal si elle n\'existe pas)');
    }

    // Export des profils utilisateur si la table existe
    console.log('\n🔍 Recherche des profils utilisateur...');
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (!profilesError && profilesData && profilesData.length > 0) {
        console.log(`✅ ${profilesData.length} profils utilisateur trouvés`);
        
        const profilesExportPath = path.join(exportDir, `user-profiles-export-${timestamp}.json`);
        await fs.writeJSON(profilesExportPath, {
          metadata: {
            exportDate: new Date().toISOString(),
            totalProfiles: profilesData.length
          },
          profiles: profilesData
        }, { spaces: 2 });
        
        console.log(`💾 Profils sauvegardés: ${profilesExportPath}`);
      } else {
        console.log('ℹ️  Aucun profil utilisateur trouvé ou table profiles inexistante');
      }
    } catch (error) {
      console.log('ℹ️  Table profiles non accessible (normal si elle n\'existe pas)');
    }

    console.log('\n✅ EXPORT TERMINÉ AVEC SUCCÈS');
    return result;

  } catch (error) {
    console.error('\n❌ ERREUR LORS DE L\'EXPORT:', error.message);
    result.error = error.message;
    return result;
  }
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log(`
🚀 SCRIPT D'EXPORT DES UTILISATEURS SUPABASE

UTILISATION:
  npx ts-node src/migration/demo/user-export-demo.ts

PRÉREQUIS:
  1. Variables d'environnement dans .env:
     - SUPABASE_URL=https://your-project.supabase.co
     - SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

  2. Clé de service Supabase avec permissions admin

SORTIE:
  - Fichier JSON avec tous les utilisateurs exportés
  - Statistiques détaillées dans la console
  - Fichiers séparés pour les rôles et profils (si disponibles)

SÉCURITÉ:
  - Les métadonnées sensibles sont masquées dans l'export
  - Seules les informations nécessaires à la migration sont exportées
`);
}

// Exécuter si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  exportAllUsers()
    .then(result => {
      if (result.success) {
        console.log(`\n🎉 Export réussi: ${result.totalUsers} utilisateurs exportés`);
        if (result.exportPath) {
          console.log(`📁 Fichier: ${result.exportPath}`);
        }
        process.exit(0);
      } else {
        console.error(`\n💥 Export échoué: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Erreur inattendue:', error.message);
      process.exit(1);
    });
}

export { exportAllUsers, SupabaseUser, UserExportResult };