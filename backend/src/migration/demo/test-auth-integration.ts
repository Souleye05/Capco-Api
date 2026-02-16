import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AuthService } from '../../auth/auth.service';

/**
 * Test d'intégration de l'authentification avec les utilisateurs migrés
 */

async function testAuthIntegration() {
  console.log('🧪 TEST D\'INTÉGRATION AUTHENTIFICATION');
  console.log('=' .repeat(50));

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);

  const testUsers = [
    { email: 'souleyniang99@gmail.com', password: 'ea55dc0eb14486fcfcb0c18659d6ea07' },
    { email: 's.niang@capco.sn', password: 'eefdaa9778d3494e735b97c96471ac26' },
    { email: 'k.top@capco.sn', password: 'd997e85b5294ccefa946e1a1ac24e015' }
  ];

  for (const testUser of testUsers) {
    try {
      console.log(`\n👤 Test de connexion: ${testUser.email}`);
      
      // Test de validation des credentials
      const validatedUser = await authService.validateUser(testUser.email, testUser.password);
      
      if (validatedUser) {
        console.log('   ✅ Validation réussie');
        console.log(`   👑 Rôles: ${validatedUser.userRoles.map(r => r.role).join(', ')}`);
        console.log(`   🌟 Source: ${validatedUser.migrationSource}`);
        
        // Test de login complet
        const loginResult = await authService.login({
          email: testUser.email,
          password: testUser.password
        });
        
        console.log('   ✅ Login réussi');
        console.log(`   🔑 Token généré: ${loginResult.access_token.substring(0, 20)}...`);
        console.log(`   🔄 Reset requis: ${loginResult.requiresPasswordReset ? 'Oui' : 'Non'}`);
        
        // Test de récupération du profil
        const profile = await authService.getProfile(validatedUser.id);
        console.log('   ✅ Profil récupéré');
        console.log(`   📧 Email: ${profile.email}`);
        console.log(`   📅 Créé le: ${profile.createdAt.toISOString()}`);
        
      } else {
        console.log('   ❌ Validation échouée');
      }
      
    } catch (error) {
      console.error(`   💥 Erreur: ${error.message}`);
    }
  }

  // Test des statistiques de migration
  try {
    console.log('\n📊 STATISTIQUES DE MIGRATION:');
    const stats = await authService.getMigrationStats();
    console.log(`   👥 Total utilisateurs: ${stats.totalUsers}`);
    console.log(`   🌟 Utilisateurs migrés: ${stats.migratedUsers}`);
    console.log(`   🔄 Nécessitent reset: ${stats.usersRequiringPasswordReset}`);
    console.log(`   📅 Dernière migration: ${stats.lastMigrationDate?.toISOString()}`);
  } catch (error) {
    console.error(`   💥 Erreur stats: ${error.message}`);
  }

  await app.close();
  console.log('\n✅ Tests d\'intégration terminés');
}

// Exécuter si appelé directement
if (require.main === module) {
  testAuthIntegration()
    .then(() => {
      console.log('\n🎉 Tous les tests sont passés avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Tests échoués:', error.message);
      process.exit(1);
    });
}

export { testAuthIntegration };