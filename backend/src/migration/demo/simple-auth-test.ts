import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Test simple de l'authentification avec les utilisateurs migrés
 */

async function testSimpleAuth() {
  console.log('🧪 TEST SIMPLE AUTHENTIFICATION');
  console.log('=' .repeat(50));

  const prisma = new PrismaClient();

  try {
    // Vérifier que les utilisateurs ont été importés
    const users = await prisma.user.findMany({
      include: { userRoles: true }
    });

    console.log(`\n📊 UTILISATEURS IMPORTÉS: ${users.length}`);
    
    for (const user of users) {
      console.log(`\n👤 ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   🌟 Source: ${user.migrationSource}`);
      console.log(`   👑 Rôles: ${user.userRoles.map(r => r.role).join(', ')}`);
      console.log(`   ✅ Email vérifié: ${user.emailVerified ? 'Oui' : 'Non'}`);
      console.log(`   🔄 Reset requis: ${user.resetToken ? 'Oui' : 'Non'}`);
      console.log(`   📅 Créé: ${user.createdAt.toISOString()}`);
      console.log(`   🕐 Dernière connexion: ${user.lastSignIn?.toISOString() || 'Jamais'}`);
    }

    // Test de validation de mot de passe pour le premier utilisateur
    if (users.length > 0) {
      const testUser = users[0];
      const testPassword = 'ea55dc0eb14486fcfcb0c18659d6ea07'; // Mot de passe temporaire du premier utilisateur
      
      console.log(`\n🔐 TEST DE MOT DE PASSE pour ${testUser.email}:`);
      const isPasswordValid = await bcrypt.compare(testPassword, testUser.password);
      console.log(`   ${isPasswordValid ? '✅' : '❌'} Mot de passe temporaire: ${isPasswordValid ? 'Valide' : 'Invalide'}`);
      
      if (testUser.resetToken) {
        console.log(`   🔄 Token de reset présent: Oui`);
        console.log(`   ⏰ Expire le: ${testUser.resetExpiry?.toISOString()}`);
      }
    }

    // Statistiques générales
    console.log('\n📈 STATISTIQUES:');
    const totalUsers = await prisma.user.count();
    const migratedUsers = await prisma.user.count({
      where: { migrationSource: 'lovable_cloud' }
    });
    const usersWithReset = await prisma.user.count({
      where: { 
        resetToken: { not: null },
        resetExpiry: { gt: new Date() }
      }
    });
    const usersWithRoles = await prisma.user.count({
      where: { userRoles: { some: {} } }
    });

    console.log(`   👥 Total utilisateurs: ${totalUsers}`);
    console.log(`   🌟 Utilisateurs Lovable: ${migratedUsers}`);
    console.log(`   🔄 Avec reset actif: ${usersWithReset}`);
    console.log(`   👑 Avec rôles: ${usersWithRoles}`);

    if (migratedUsers === 3 && usersWithRoles === 3 && usersWithReset === 3) {
      console.log('\n✅ MIGRATION RÉUSSIE - Tous les utilisateurs sont correctement importés');
    } else {
      console.log('\n⚠️  MIGRATION PARTIELLE - Vérifiez les données ci-dessus');
    }

  } catch (error) {
    console.error('\n💥 ERREUR:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  testSimpleAuth()
    .then(() => {
      console.log('\n🎉 Test terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test échoué:', error.message);
      process.exit(1);
    });
}

export { testSimpleAuth };