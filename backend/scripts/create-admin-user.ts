import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🚀 Création de l\'utilisateur administrateur...\n');

    // Demander les informations (ou utiliser des valeurs par défaut)
    const email = process.env.ADMIN_EMAIL || 'admin@capco.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@2026!';
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password: ${password.replace(/./g, '*')}\n`);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà.');
      console.log('   Voulez-vous mettre à jour le mot de passe? (Ctrl+C pour annuler)\n');
      
      // Attendre 3 secondes
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Mettre à jour l'utilisateur
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          emailVerified: true,
        },
      });
      
      console.log('✅ Mot de passe mis à jour avec succès!\n');
    } else {
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          emailVerified: true,
        },
      });

      console.log('✅ Utilisateur créé avec succès!');
      console.log(`   ID: ${user.id}\n`);

      // Créer le rôle admin
      await prisma.userRoles.create({
        data: {
          userId: user.id,
          role: 'admin',
        },
      });

      console.log('✅ Rôle administrateur assigné!\n');
    }

    // Vérifier les rôles
    const userWithRoles = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: true,
      },
    });

    console.log('📋 Informations de l\'utilisateur:');
    console.log(`   Email: ${userWithRoles?.email}`);
    console.log(`   Email vérifié: ${userWithRoles?.emailVerified}`);
    console.log(`   Rôles: ${userWithRoles?.userRoles.map(r => r.role).join(', ')}`);
    console.log(`   Créé le: ${userWithRoles?.createdAt}\n`);

    console.log('🎉 Configuration terminée avec succès!\n');
    console.log('📝 Credentials de connexion:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createAdminUser();
