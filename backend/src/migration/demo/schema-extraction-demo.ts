import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SchemaExtractorService } from '../services/schema-extractor.service';
import { PrismaSchemaGeneratorService } from '../services/prisma-schema-generator.service';

/**
 * Démonstration de l'extraction du schéma Supabase et génération du schéma Prisma
 * 
 * Ce script :
 * 1. Extrait le schéma depuis les fichiers de migration Supabase
 * 2. Génère un nouveau schéma Prisma avec toutes les tables métier
 * 3. Sauvegarde l'ancien schéma comme backup
 * 4. Affiche un résumé des tables extraites
 */
async function runSchemaExtractionDemo() {
  console.log('🚀 Démarrage de la démonstration d\'extraction du schéma Supabase...\n');

  try {
    // Initialiser l'application NestJS
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Obtenir les services
    const schemaExtractor = app.get(SchemaExtractorService);
    const schemaGenerator = app.get(PrismaSchemaGeneratorService);

    console.log('📁 Étape 1: Extraction du schéma depuis les fichiers de migration...');
    
    // Extraire le schéma depuis les fichiers de migration
    const extractedSchema = await schemaExtractor.extractCompleteSchema('frontend/supabase/migrations');
    
    console.log(`✅ Schéma extrait avec succès !`);
    console.log(`   📊 Tables trouvées: ${extractedSchema.tables.length}`);
    console.log(`   🏷️  Enums trouvés: ${extractedSchema.enums.length}`);
    console.log(`   ⚙️  Fonctions trouvées: ${extractedSchema.functions.length}`);
    console.log(`   📄 Fichiers de migration: ${extractedSchema.migrationFiles.length}\n`);

    // Afficher les tables trouvées
    console.log('📋 Tables extraites:');
    extractedSchema.tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.name} (${table.columns.length} colonnes)`);
    });
    console.log('');

    // Afficher les enums trouvés
    console.log('🏷️ Enums extraits:');
    extractedSchema.enums.forEach((enumDef, index) => {
      console.log(`   ${index + 1}. ${enumDef.name} (${enumDef.values.length} valeurs: ${enumDef.values.join(', ')})`);
    });
    console.log('');

    console.log('📝 Étape 2: Génération du nouveau schéma Prisma...');
    
    // Générer le nouveau schéma Prisma
    const schemaResult = await schemaGenerator.generatePrismaSchema(extractedSchema);
    
    console.log('✅ Nouveau schéma Prisma généré !');
    console.log(`   📏 Taille du schéma: ${schemaResult.schemaContent.length} caractères`);
    console.log(`   🏗️  Modèles générés: ${schemaResult.modelsGenerated.length}`);
    console.log(`   ⚠️  Avertissements: ${schemaResult.warnings.length}\n`);

    console.log('💾 Étape 3: Sauvegarde de l\'ancien schéma...');
    
    // Sauvegarder l'ancien schéma
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join('prisma', `schema.prisma.backup.${timestamp}`);
    
    const currentSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
    fs.writeFileSync(backupPath, currentSchema);
    
    console.log(`✅ Ancien schéma sauvegardé dans: ${backupPath}\n`);

    console.log('🔄 Étape 4: Écriture du nouveau schéma...');
    
    // Écrire le nouveau schéma
    fs.writeFileSync('prisma/schema.prisma', schemaResult.schemaContent);
    
    console.log('✅ Nouveau schéma Prisma écrit avec succès !\n');

    console.log('📊 Résumé de la migration du schéma:');
    console.log(`   🗂️  Tables métier ajoutées: ${extractedSchema.tables.length}`);
    console.log(`   🏷️  Enums ajoutés: ${extractedSchema.enums.length}`);
    console.log(`   🏗️  Modèles Prisma générés: ${schemaResult.modelsGenerated.length}`);
    console.log(`   📄 Fichiers de migration traités: ${extractedSchema.migrationFiles.length}`);
    console.log(`   ⚠️  Avertissements: ${schemaResult.warnings.length}`);
    console.log(`   💾 Backup de l'ancien schéma: ${backupPath}`);
    console.log('');

    // Afficher les avertissements s'il y en a
    if (schemaResult.warnings.length > 0) {
      console.log('⚠️ Avertissements détectés:');
      schemaResult.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    console.log('🎉 Migration du schéma terminée avec succès !');
    console.log('');
    console.log('📋 Prochaines étapes recommandées:');
    console.log('   1. Vérifiez le nouveau schéma Prisma');
    console.log('   2. Exécutez: npx prisma generate');
    console.log('   3. Exécutez: npx prisma db push (pour synchroniser la DB)');
    console.log('   4. Testez les nouvelles tables avec Prisma Studio');

    await app.close();

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction du schéma:', error.message);
    console.error('');
    console.error('🔧 Solutions possibles:');
    console.error('   1. Vérifiez que les fichiers de migration Supabase existent');
    console.error('   2. Vérifiez les permissions de lecture des fichiers');
    console.error('   3. Vérifiez la configuration dans le .env');
    
    process.exit(1);
  }
}

// Exécuter la démonstration si ce fichier est appelé directement
if (require.main === module) {
  runSchemaExtractionDemo();
}

export { runSchemaExtractionDemo };