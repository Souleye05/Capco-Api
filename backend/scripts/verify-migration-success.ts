#!/usr/bin/env ts-node

/**
 * Script de vérification de la migration des champs juridiction/chambre/ville
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification de la migration des champs juridiction/chambre/ville...');

  try {
    // Vérifier que les colonnes existent dans audiences
    const audiencesColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'audiences' 
      AND column_name IN ('juridiction', 'chambre', 'ville')
    ` as Array<{ column_name: string }>;

    console.log('✅ Colonnes présentes dans audiences:', 
      audiencesColumns.map(c => c.column_name).join(', '));

    // Vérifier que les colonnes n'existent pas dans affaires
    const affairesColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'affaires' 
      AND column_name IN ('juridiction', 'chambre', 'ville')
    ` as Array<{ column_name: string }>;

    if (affairesColumns.length > 0) {
      console.log('⚠️  Attention: Certaines colonnes existent encore dans affaires:', 
        affairesColumns.map(c => c.column_name).join(', '));
    } else {
      console.log('✅ Aucune colonne juridiction/chambre/ville dans affaires');
    }

    // Compter les audiences
    const audiencesCount = await prisma.audiences.count();
    console.log(`📊 Nombre total d'audiences: ${audiencesCount}`);

    // Tester une requête simple
    const sampleAudience = await prisma.audiences.findFirst({
      select: {
        id: true,
        juridiction: true,
        chambre: true,
        ville: true,
        affaire: {
          select: {
            reference: true,
            intitule: true
          }
        }
      }
    });

    if (sampleAudience) {
      console.log('✅ Test de requête réussi - exemple d\'audience:', {
        id: sampleAudience.id,
        juridiction: sampleAudience.juridiction,
        chambre: sampleAudience.chambre,
        ville: sampleAudience.ville,
        affaire: sampleAudience.affaire?.reference
      });
    } else {
      console.log('ℹ️  Aucune audience trouvée dans la base');
    }

    console.log('🎉 Migration vérifiée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('💥 Échec de la vérification:', error);
    process.exit(1);
  });