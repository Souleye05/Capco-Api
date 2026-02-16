import { UserMigratorService } from '../services/user-migrator.service';
import { PrismaService } from '../../common/services/prisma.service';

/**
 * Export rapide des utilisateurs Supabase
 * 
 * Utilise le UserMigratorService existant pour exporter les utilisateurs
 */
async function quickUserExport() {
  console.log('⚡ EXPORT RAPIDE DES UTILISATEURS SUPABASE');
  console.log('=' .repeat(50));

  const prismaService = new PrismaService();
  const userMigrator = new UserMigratorService(prismaService);

  try {
    console.log('📥 Export des utilisateurs depuis Supabase...');
    
    // Utiliser la méthode existante du UserMigratorService
    const userData = await userMigrator.exportUsersFromSupabase();
    
    console.log('\n✅ EXPORT TERMINÉ');
    console.log(`👥 Utilisateurs: ${userData.users.length}`);
    console.log(`📋 Profils: ${userData.userProfiles?.length || 0}`);
    console.log(`🔐 Rôles: ${userData.userRoles?.length || 0}`);
    
    // Afficher quelques exemples
    if (userData.users.length > 0) {
      console.log('\n📋 APERÇU DES UTILISATEURS:');
      userData.users.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`   Créé: ${new Date(user.created_at).toLocaleDateString('fr-FR')}`);
        console.log(`   Confirmé: ${user.email_confirmed_at ? '✅' : '❌'}`);
      });
      
      if (userData.users.length > 3) {
        console.log(`   ... et ${userData.users.length - 3} autres`);
      }
    }

    return userData;

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
    throw error;
  } finally {
    await prismaService.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  quickUserExport()
    .then(() => {
      console.log('\n🎉 Export terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Export échoué:', error.message);
      process.exit(1);
    });
}

export { quickUserExport };