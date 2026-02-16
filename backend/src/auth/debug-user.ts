import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: true },
    });

    if (!user) {
      console.log(`❌ User ${email} not found`);
      return;
    }

    console.log(`✅ User found: ${email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email verified: ${user.emailVerified}`);
    console.log(`   Migration source: ${user.migrationSource}`);
    console.log(`   Has reset token: ${!!user.resetToken}`);
    console.log(`   Reset expiry: ${user.resetExpiry}`);
    console.log(`   Reset token active: ${user.resetToken && user.resetExpiry && user.resetExpiry > new Date()}`);
    console.log(`   Last sign in: ${user.lastSignIn}`);
    console.log(`   Roles: ${user.userRoles.map(r => r.role).join(', ')}`);
    console.log(`   Created at: ${user.createdAt}`);
    console.log(`   Updated at: ${user.updatedAt}`);

  } catch (error) {
    console.error(`❌ Error checking user: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Utilisation
const email = process.argv[2] || 's.niang@capco.sn';
debugUser(email);