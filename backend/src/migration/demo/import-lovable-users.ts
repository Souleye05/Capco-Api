import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Import des utilisateurs depuis Lovable Cloud vers NestJS
 * 
 * Ce script migre les utilisateurs exportés depuis Lovable Cloud
 * vers le système d'authentification NestJS avec Prisma.
 */

interface LovableUser {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

const LOVABLE_USERS: LovableUser[] = [
  {
    id: '5e01a3d3-cacf-4004-a5ee-20983d49b004',
    email: 'souleyniang99@gmail.com',
    created_at: '2026-01-19T23:55:10.672609Z',
    email_confirmed_at: '2026-01-19T23:55:10.672609Z'
  },
  {
    id: 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c',
    email: 's.niang@capco.sn',
    created_at: '2026-01-20T00:09:39.555106Z',
    email_confirmed_at: '2026-01-20T00:09:39.555106Z'
  },
  {
    id: '9aa7f986-a54a-440e-9b89-b230c7806c75',
    email: 'k.top@capco.sn',
    created_at: '2026-01-20T00:10:19.553334Z',
    email_confirmed_at: '2026-01-20T00:10:19.553334Z'
  }
];

// Mapping des rôles par défaut
const DEFAULT_ROLES = {
  'souleyniang99@gmail.com': 'admin',
  's.niang@capco.sn': 'admin', 
  'k.top@capco.sn': 'collaborateur'
} as const;

async function importLovableUsers() {
  console.log('🚀 IMPORT DES UTILISATEURS LOVABLE CLOUD');
  console.log('=' .repeat(50));

  const prisma = new PrismaClient();
  
  try {
    console.log(`📥 Import de ${LOVABLE_USERS.length} utilisateurs depuis Lovable Cloud`);
    
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const lovableUser of LOVABLE_USERS) {
      try {
        console.log(`\n👤 Traitement: ${lovableUser.email}`);
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email: lovableUser.email }
        });

        if (existingUser) {
          console.log(`   ⚠️  Utilisateur déjà existant, ignoré`);
          skippedCount++;
          continue;
        }

        // Générer un mot de passe temporaire sécurisé
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        // Générer un token de reset pour forcer le changement de mot de passe
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = await bcrypt.hash(resetToken, 10);
        const resetExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

        // Créer l'utilisateur dans le système NestJS
        const newUser = await prisma.user.create({
          data: {
            id: lovableUser.id, // Préserver l'ID original
            email: lovableUser.email,
            password: hashedPassword,
            createdAt: new Date(lovableUser.created_at),
            updatedAt: new Date(lovableUser.updated_at || lovableUser.created_at),
            emailVerified: !!lovableUser.email_confirmed_at,
            lastSignIn: lovableUser.last_sign_in_at ? new Date(lovableUser.last_sign_in_at) : null,
            migrationSource: 'lovable_cloud',
            resetToken: hashedResetToken,
            resetExpiry: resetExpiry,
          }
        });

        console.log(`   ✅ Utilisateur créé: ${newUser.id}`);
        console.log(`   🔑 Mot de passe temporaire: ${tempPassword}`);
        console.log(`   🔄 Token de reset: ${resetToken}`);

        // Assigner le rôle par défaut
        const defaultRole = DEFAULT_ROLES[lovableUser.email as keyof typeof DEFAULT_ROLES] || 'collaborateur';
        
        await prisma.userRoles.create({
          data: {
            userId: newUser.id,
            role: defaultRole as any,
          }
        });

        console.log(`   👑 Rôle assigné: ${defaultRole}`);
        importedCount++;

      } catch (error) {
        console.error(`   ❌ Erreur pour ${lovableUser.email}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 RÉSUMÉ DE L\'IMPORT:');
    console.log(`   ✅ Importés: ${importedCount}`);
    console.log(`   ⚠️  Ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📊 Total: ${LOVABLE_USERS.length}`);

    if (importedCount > 0) {
      console.log('\n🔐 MOTS DE PASSE TEMPORAIRES:');
      console.log('   Les utilisateurs doivent utiliser leurs tokens de reset');
      console.log('   pour définir leurs nouveaux mots de passe.');
      console.log('\n📧 PROCHAINES ÉTAPES:');
      console.log('   1. Envoyer les tokens de reset aux utilisateurs');
      console.log('   2. Tester la connexion avec le système NestJS');
      console.log('   3. Valider que tous les rôles sont corrects');
    }

    // Vérification finale
    console.log('\n🔍 VÉRIFICATION FINALE:');
    const totalUsers = await prisma.user.count();
    const migratedUsers = await prisma.user.count({
      where: { migrationSource: 'lovable_cloud' }
    });
    const usersWithRoles = await prisma.user.count({
      where: {
        migrationSource: 'lovable_cloud',
        userRoles: { some: {} }
      }
    });

    console.log(`   👥 Total utilisateurs: ${totalUsers}`);
    console.log(`   🌟 Utilisateurs Lovable: ${migratedUsers}`);
    console.log(`   👑 Avec rôles: ${usersWithRoles}`);

    if (migratedUsers === importedCount && usersWithRoles === importedCount) {
      console.log('\n✅ IMPORT RÉUSSI - Tous les utilisateurs sont migrés avec leurs rôles');
    } else {
      console.log('\n⚠️  IMPORT PARTIEL - Vérifiez les erreurs ci-dessus');
    }

  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour tester la connexion d'un utilisateur migré
async function testUserLogin(email: string, tempPassword: string) {
  console.log(`\n🧪 TEST DE CONNEXION: ${email}`);
  
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: true }
    });

    if (!user) {
      console.log('   ❌ Utilisateur non trouvé');
      return;
    }

    const isPasswordValid = await bcrypt.compare(tempPassword, user.password);
    
    if (isPasswordValid) {
      console.log('   ✅ Mot de passe temporaire valide');
      console.log(`   👑 Rôles: ${user.userRoles.map(r => r.role).join(', ')}`);
      console.log(`   🔄 Reset requis: ${user.resetToken ? 'Oui' : 'Non'}`);
    } else {
      console.log('   ❌ Mot de passe temporaire invalide');
    }

  } catch (error) {
    console.error(`   💥 Erreur: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') && args[1] && args[2]) {
    // Mode test: node script.js --test email password
    testUserLogin(args[1], args[2]);
  } else {
    // Mode import normal
    importLovableUsers()
      .then(() => {
        console.log('\n🎉 Import terminé avec succès');
        console.log('\n💡 Pour tester une connexion:');
        console.log('   npx ts-node src/migration/demo/import-lovable-users.ts --test email password');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n💥 Import échoué:', error.message);
        process.exit(1);
      });
  }
}

export { importLovableUsers, testUserLogin };