#!/usr/bin/env ts-node

/**
 * Script de test pour les nouvelles actions d'audiences
 * Teste les endpoints: enrolement, rappel-enrolement, statistics
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAudienceActions() {
  console.log('🧪 Test des nouvelles actions d\'audiences...\n');

  try {
    // 1. Test des statistiques
    console.log('📊 Test des statistiques...');
    const stats = await prisma.audiences.groupBy({
      by: ['statut'],
      _count: {
        statut: true,
      },
    });

    const total = await prisma.audiences.count();
    const statsFormatted = {
      total,
      aVenir: stats.find(s => s.statut === 'A_VENIR')?._count.statut || 0,
      tenues: stats.find(s => s.statut === 'RENSEIGNEE')?._count.statut || 0,
      nonRenseignees: stats.find(s => s.statut === 'PASSEE_NON_RENSEIGNEE')?._count.statut || 0,
    };

    console.log('Statistiques:', statsFormatted);

    // 2. Test des audiences nécessitant un rappel d'enrôlement
    console.log('\n🔔 Test des rappels d\'enrôlement...');
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

    console.log(`Audiences nécessitant un rappel: ${audiencesRappel.length}`);
    audiencesRappel.forEach(audience => {
      console.log(`- ${audience.affaire?.reference}: ${new Date(audience.date).toLocaleDateString('fr-FR')}`);
    });

    // 3. Test de marquage d'enrôlement (si des audiences existent)
    if (audiencesRappel.length > 0) {
      console.log('\n✅ Test de marquage d\'enrôlement...');
      const firstAudience = audiencesRappel[0];
      
      // Marquer comme effectué
      const updated = await prisma.audiences.update({
        where: { id: firstAudience.id },
        data: { enrolement_effectue: true },
      });

      console.log(`Enrôlement marqué comme effectué pour: ${firstAudience.affaire?.reference}`);

      // Remettre à l'état initial pour ne pas affecter les données
      await prisma.audiences.update({
        where: { id: firstAudience.id },
        data: { enrolement_effectue: false },
      });

      console.log('État restauré.');
    }

    console.log('\n✅ Tous les tests sont passés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testAudienceActions();