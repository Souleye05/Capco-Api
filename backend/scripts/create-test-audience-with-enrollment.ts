#!/usr/bin/env ts-node

/**
 * Script pour créer une audience de test avec rappel d'enrôlement
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestAudienceWithEnrollment() {
  console.log('🧪 Création d\'une audience de test avec rappel d\'enrôlement...\n');

  try {
    // Récupérer une affaire existante
    const affaire = await prisma.affaires.findFirst();
    
    if (!affaire) {
      console.log('❌ Aucune affaire trouvée. Créez d\'abord une affaire.');
      return;
    }

    console.log(`📁 Affaire trouvée: ${affaire.reference}`);

    // Créer une audience avec rappel d'enrôlement
    const audience = await prisma.audiences.create({
      data: {
        affaireId: affaire.id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        heure: '09:00',
        type: 'PLAIDOIRIE',
        juridiction: 'Tribunal de Grande Instance de Dakar',
        chambre: 'Chambre Civile',
        ville: 'Dakar',
        statut: 'A_VENIR',
        notesPreparation: 'Audience de test avec rappel d\'enrôlement',
        est_preparee: false,
        rappel_enrolement: true,
        date_rappel_enrolement: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
        enrolement_effectue: false,
        createdBy: 'test-script',
      },
      include: {
        affaire: {
          select: {
            reference: true,
            intitule: true,
          },
        },
      },
    });

    console.log('✅ Audience créée avec succès:');
    console.log(`- ID: ${audience.id}`);
    console.log(`- Affaire: ${audience.affaire?.reference}`);
    console.log(`- Date: ${audience.date.toLocaleDateString('fr-FR')}`);
    console.log(`- Rappel enrôlement: ${audience.rappel_enrolement ? 'Oui' : 'Non'}`);
    console.log(`- Date rappel: ${audience.date_rappel_enrolement?.toLocaleDateString('fr-FR')}`);
    console.log(`- Enrôlement effectué: ${audience.enrolement_effectue ? 'Oui' : 'Non'}`);

    // Vérifier que l'audience apparaît dans les rappels
    const audiencesRappel = await prisma.audiences.findMany({
      where: {
        rappel_enrolement: true,
        enrolement_effectue: false,
      },
      include: {
        affaire: {
          select: {
            reference: true,
            intitule: true,
          },
        },
      },
    });

    console.log(`\n📋 Total des audiences nécessitant un rappel: ${audiencesRappel.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createTestAudienceWithEnrollment();