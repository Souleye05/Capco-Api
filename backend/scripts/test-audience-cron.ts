#!/usr/bin/env ts-node

/**
 * Script de test pour le service cron des audiences
 * Ce script permet de tester manuellement la fonctionnalité de mise à jour
 * des statuts d'audiences passées.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AudienceCronService } from '../src/contentieux/audiences/audience-cron.service';

async function testAudienceCron() {
  console.log('🚀 Démarrage du test du service cron des audiences...\n');

  try {
    // Créer l'application NestJS
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Récupérer le service cron
    const audienceCronService = app.get(AudienceCronService);
    
    console.log('📅 Exécution de la mise à jour des statuts d\'audiences...');
    
    // Exécuter la mise à jour manuelle
    await audienceCronService.triggerManualUpdate();
    
    console.log('✅ Mise à jour terminée avec succès!');
    
    // Fermer l'application
    await app.close();
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  testAudienceCron()
    .then(() => {
      console.log('\n🎉 Test terminé avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Échec du test:', error);
      process.exit(1);
    });
}

export { testAudienceCron };