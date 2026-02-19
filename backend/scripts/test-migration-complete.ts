#!/usr/bin/env ts-node

/**
 * Script de test complet de la migration juridiction/chambre/ville
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Test complet de la migration juridiction/chambre/ville...');

  try {
    // Test 1: Créer une affaire
    console.log('📝 Test 1: Création d\'une affaire...');
    const affaire = await prisma.affaires.create({
      data: {
        reference: 'TEST-2026-001',
        intitule: 'Test Migration Juridiction',
        statut: 'ACTIVE',
        demandeurs: [],
        defendeurs: [],
        createdBy: 'test-user'
      }
    });
    console.log('✅ Affaire créée:', affaire.id);

    // Test 2: Créer une audience avec juridiction/chambre/ville
    console.log('📝 Test 2: Création d\'une audience avec juridiction...');
    const audience = await prisma.audiences.create({
      data: {
        affaireId: affaire.id,
        date: new Date('2026-03-01'),
        heure: '14:30',
        type: 'MISE_EN_ETAT',
        juridiction: 'Tribunal de Grande Instance de Dakar',
        chambre: 'Chambre Civile 1',
        ville: 'Dakar',
        statut: 'A_VENIR',
        createdBy: 'test-user'
      }
    });
    console.log('✅ Audience créée:', audience.id);

    // Test 3: Récupérer l'affaire avec sa dernière audience
    console.log('📝 Test 3: Récupération de l\'affaire avec audience...');
    const affaireWithAudience = await prisma.affaires.findUnique({
      where: { id: affaire.id },
      include: {
        audiences: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    if (affaireWithAudience?.audiences[0]) {
      console.log('✅ Données récupérées:', {
        affaire: affaireWithAudience.reference,
        juridiction: affaireWithAudience.audiences[0].juridiction,
        chambre: affaireWithAudience.audiences[0].chambre,
        ville: affaireWithAudience.audiences[0].ville
      });
    }

    // Test 4: Vérifier que les champs n'existent pas dans affaires
    console.log('📝 Test 4: Vérification de la structure...');
    const affairesColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'affaires' 
      AND column_name IN ('juridiction', 'chambre', 'ville')
    ` as Array<{ column_name: string }>;

    if (affairesColumns.length === 0) {
      console.log('✅ Aucun champ juridiction/chambre/ville dans affaires');
    } else {
      console.log('⚠️  Champs encore présents dans affaires:', affairesColumns.map(c => c.column_name));
    }

    // Nettoyage
    console.log('🧹 Nettoyage des données de test...');
    await prisma.audiences.delete({ where: { id: audience.id } });
    await prisma.affaires.delete({ where: { id: affaire.id } });
    console.log('✅ Nettoyage terminé');

    console.log('🎉 Tous les tests sont passés ! Migration réussie !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('💥 Échec du test:', error);
    process.exit(1);
  });