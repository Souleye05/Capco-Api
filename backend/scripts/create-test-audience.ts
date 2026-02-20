import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestAudience() {
  try {
    // Get the first affaire
    const affaire = await prisma.affaires.findFirst();
    
    if (!affaire) {
      console.log('❌ No affaire found to create test audience');
      return;
    }

    // Create an audience with past date (should automatically get PASSEE_NON_RENSEIGNEE status)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

    const audience = await prisma.audiences.create({
      data: {
        affaireId: affaire.id,
        date: pastDate,
        heure: '14:00',
        type: 'PLAIDOIRIE',
        juridiction: 'TGI Paris',
        statut: 'PASSEE_NON_RENSEIGNEE', // Explicitly set for testing
        est_preparee: false,
        createdBy: 'system-test'
      }
    });

    console.log('✅ Test audience created:', {
      id: audience.id,
      affaireId: audience.affaireId,
      date: audience.date,
      statut: audience.statut
    });

  } catch (error) {
    console.error('❌ Error creating test audience:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAudience();