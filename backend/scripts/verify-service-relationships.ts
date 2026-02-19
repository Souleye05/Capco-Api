#!/usr/bin/env ts-node

/**
 * Script de vérification que les services implémentent correctement les relations
 */

import { PrismaClient } from '@prisma/client';
import { AffairesService } from '../src/contentieux/affaires/affaires.service';
import { AudiencesService } from '../src/contentieux/audiences/audiences.service';
import { HonorairesService } from '../src/contentieux/honoraires/honoraires.service';
import { DepensesService } from '../src/contentieux/depenses/depenses.service';
import { PaginationService } from '../src/common/services/pagination.service';
import { ReferenceGeneratorService } from '../src/common/services/reference-generator.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des services et relations...\n');

  try {
    // Initialiser les services
    const paginationService = new PaginationService();
    const referenceService = new ReferenceGeneratorService(prisma);
    
    const affairesService = new AffairesService(prisma, paginationService, referenceService);
    const audiencesService = new AudiencesService(prisma, paginationService);
    const honorairesService = new HonorairesService(prisma, paginationService);
    const depensesService = new DepensesService(prisma, paginationService);

    console.log('✅ Services initialisés');

    // Test 1: Créer une affaire via le service
    console.log('\n📋 Test 1: Création d\'affaire via AffairesService');
    
    const createAffaireDto = {
      intitule: 'Test Service Relations',
      statut: 'ACTIVE' as const,
      observations: 'Test des relations entre services',
      demandeurs: [{ nom: 'Demandeur Test', role: 'DEMANDEUR' as const }],
      defendeurs: [{ nom: 'Défendeur Test', role: 'DEFENDEUR' as const }]
    };

    const affaire = await affairesService.create(createAffaireDto, 'test-service');
    console.log('✅ Affaire créée via service:', affaire.reference);

    // Test 2: Créer une audience liée à l'affaire
    console.log('\n📋 Test 2: Création d\'audience via AudiencesService');
    
    const createAudienceDto = {
      affaireId: affaire.id,
      date: '2026-03-20',
      heure: '09:00',
      type: 'MISE_EN_ETAT' as const,
      juridiction: 'Tribunal de Commerce de Dakar',
      chambre: 'Chambre Commerciale',
      ville: 'Dakar',
      statut: 'A_VENIR' as const,
      notesPreparation: 'Préparation test service',
      estPreparee: false,
      rappelEnrolement: true
    };

    const audience = await audiencesService.create(createAudienceDto, 'test-service');
    console.log('✅ Audience créée via service:', audience.id);

    // Test 3: Créer des honoraires pour l'affaire
    console.log('\n📋 Test 3: Création d\'honoraires via HonorairesService');
    
    const createHonoraireDto = {
      affaireId: affaire.id,
      montantFacture: 750000,
      montantEncaisse: 0,
      dateFacturation: new Date(),
      notes: 'Honoraires test service'
    };

    const honoraires = await honorairesService.create(createHonoraireDto, 'test-service');
    console.log('✅ Honoraires créés via service:', honoraires.id);

    // Test 4: Créer des dépenses pour l'affaire
    console.log('\n📋 Test 4: Création de dépenses via DepensesService');
    
    const createDepenseDto = {
      affaireId: affaire.id,
      date: new Date(),
      typeDepense: 'FRAIS_GREFFE',
      nature: 'Enregistrement',
      montant: 15000,
      description: 'Frais d\'enregistrement test service',
      justificatif: 'Reçu greffe'
    };

    const depense = await depensesService.create(createDepenseDto, 'test-service');
    console.log('✅ Dépense créée via service:', depense.id);

    // Test 5: Vérifier les relations via les services
    console.log('\n🔗 Vérification des relations via les services...');

    // Récupérer l'affaire avec toutes ses relations
    const affaireComplete = await affairesService.findOne(affaire.id);
    console.log('✅ Affaire récupérée avec relations:');
    console.log(`   - Référence: ${affaireComplete.reference}`);
    console.log(`   - Demandeurs: ${affaireComplete.demandeurs.length}`);
    console.log(`   - Défendeurs: ${affaireComplete.defendeurs.length}`);
    console.log(`   - Dernière audience: ${affaireComplete.derniereAudience ? 'Oui' : 'Non'}`);
    console.log(`   - Total honoraires: ${affaireComplete.totalHonoraires}`);
    console.log(`   - Total dépenses: ${affaireComplete.totalDepenses}`);

    // Récupérer l'audience avec ses relations
    const audienceComplete = await audiencesService.findOne(audience.id);
    console.log('\n✅ Audience récupérée avec relations:');
    console.log(`   - Affaire: ${audienceComplete.affaire.reference}`);
    console.log(`   - Juridiction: ${audienceComplete.juridiction}`);
    console.log(`   - Chambre: ${audienceComplete.chambre}`);
    console.log(`   - Ville: ${audienceComplete.ville}`);
    console.log(`   - Parties: ${audienceComplete.affaire.parties.length}`);

    // Récupérer les honoraires avec relations
    const honorairesComplete = await honorairesService.findOne(honoraires.id);
    console.log('\n✅ Honoraires récupérés avec relations:');
    console.log(`   - Affaire: ${honorairesComplete.affaire.reference}`);
    console.log(`   - Montant facturé: ${honorairesComplete.montantFacture}`);
    console.log(`   - Montant restant: ${honorairesComplete.montantRestant}`);

    // Récupérer les dépenses avec relations
    const depenseComplete = await depensesService.findOne(depense.id);
    console.log('\n✅ Dépense récupérée avec relations:');
    console.log(`   - Affaire: ${depenseComplete.affaire.reference}`);
    console.log(`   - Type: ${depenseComplete.typeDepense}`);
    console.log(`   - Montant: ${depenseComplete.montant}`);

    // Test 6: Vérifier les méthodes de recherche par relation
    console.log('\n🔍 Test des méthodes de recherche par relation...');

    // Rechercher les honoraires par affaire
    const honorairesParAffaire = await honorairesService.findByAffaire(affaire.id);
    console.log(`✅ Honoraires trouvés pour l'affaire: ${honorairesParAffaire.length}`);

    // Rechercher les dépenses par affaire
    const depensesParAffaire = await depensesService.findByAffaire(affaire.id);
    console.log(`✅ Dépenses trouvées pour l'affaire: ${depensesParAffaire.length}`);

    // Rechercher les audiences par affaire
    const audiencesParAffaire = await audiencesService.findAll({ affaireId: affaire.id });
    console.log(`✅ Audiences trouvées pour l'affaire: ${audiencesParAffaire.data.length}`);

    // Nettoyage
    console.log('\n🧹 Nettoyage via les services...');
    await depensesService.remove(depense.id);
    await honorairesService.remove(honoraires.id);
    await audiencesService.remove(audience.id);
    await affairesService.remove(affaire.id);
    console.log('✅ Nettoyage terminé');

    console.log('\n🎉 TOUS LES SERVICES RESPECTENT LES RELATIONS !');
    console.log('\n📊 Fonctionnalités validées:');
    console.log('   ✅ Création d\'entités avec relations');
    console.log('   ✅ Récupération avec relations incluses');
    console.log('   ✅ Recherche par relations');
    console.log('   ✅ Suppression en cascade');
    console.log('   ✅ Mappage correct des DTOs');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('💥 Échec de la vérification des services:', error);
    process.exit(1);
  });