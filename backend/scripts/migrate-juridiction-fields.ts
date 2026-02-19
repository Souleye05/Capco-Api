#!/usr/bin/env ts-node

/**
 * Script de migration pour déplacer les champs juridiction, chambre et ville
 * de la table affaires vers la table audiences
 * 
 * Usage: npm run migrate:juridiction-fields
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Début de la migration des champs juridiction/chambre/ville...');

  try {
    // Étape 1: Migration des données (si nécessaire)
    console.log('📊 Étape 1: Migration des données existantes...');
    const dataMigrationScript = readFileSync(
      join(__dirname, '../prisma/migrations/move_juridiction_fields_to_audiences/data_migration.sql'),
      'utf-8'
    );
    
    await prisma.$executeRawUnsafe(dataMigrationScript);
    console.log('✅ Migration des données terminée');

    // Étape 2: Modification de la structure
    console.log('🔧 Étape 2: Modification de la structure des tables...');
    const structureMigrationScript = readFileSync(
      join(__dirname, '../prisma/migrations/move_juridiction_fields_to_audiences/migration.sql'),
      'utf-8'
    );
    
    await prisma.$executeRawUnsafe(structureMigrationScript);
    console.log('✅ Modification de la structure terminée');

    // Étape 3: Vérification
    console.log('🔍 Étape 3: Vérification de la migration...');
    
    // Vérifier que les colonnes n'existent plus dans affaires
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
      console.log('✅ Les colonnes ont été supprimées de la table affaires');
    }

    // Vérifier que les colonnes existent dans audiences
    const audiencesColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'audiences' 
      AND column_name IN ('juridiction', 'chambre', 'ville')
    ` as Array<{ column_name: string }>;

    console.log('✅ Colonnes présentes dans audiences:', 
      audiencesColumns.map(c => c.column_name).join(', '));

    // Compter les audiences avec des données
    const audiencesWithData = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM audiences 
      WHERE juridiction IS NOT NULL AND juridiction != ''
    ` as Array<{ count: bigint }>;

    console.log(`📈 Nombre d'audiences avec juridiction: ${audiencesWithData[0].count}`);

    console.log('🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  });