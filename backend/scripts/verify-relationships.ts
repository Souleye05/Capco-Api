#!/usr/bin/env ts-node

/**
 * Script de vérification des relations selon le diagramme fourni
 * 
 * Relations attendues selon le diagramme :
 * - AFFAIRE "a des" AUDIENCE (1:N)
 * - AFFAIRE "facture" HONORAIRES (1:N) 
 * - AFFAIRE "génère" DEPENSES (1:N)
 * - AUDIENCE "produit" RESULTAT (1:N)
 * - AUDIENCE "peut créer (renvoi)" RESULTAT (1:N)
 * - HONORAIRES "reçoit" PAIEMENTS (1:N)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des relations selon le diagramme...\n');

  try {
    // Test 1: AFFAIRE "a des" AUDIENCES
    console.log('📋 Test 1: Relation AFFAIRE → AUDIENCES (1:N)');
    
    const affaireWithAudiences = await prisma.affaires.findFirst({
      include: {
        audiences: true
      }
    });

    if (affaireWithAudiences) {
      console.log(`✅ Relation AFFAIRE → AUDIENCES: ${affaireWithAudiences.audiences.length} audiences trouvées`);
    } else {
      console.log('ℹ️  Aucune affaire avec audiences trouvée (base vide)');
    }

    // Test 2: AFFAIRE "facture" HONORAIRES
    console.log('\n📋 Test 2: Relation AFFAIRE → HONORAIRES (1:N)');
    
    const affaireWithHonoraires = await prisma.affaires.findFirst({
      include: {
        honorairesContentieuxes: true
      }
    });

    if (affaireWithHonoraires) {
      console.log(`✅ Relation AFFAIRE → HONORAIRES: ${affaireWithHonoraires.honorairesContentieuxes.length} honoraires trouvés`);
    } else {
      console.log('ℹ️  Aucune affaire avec honoraires trouvée (base vide)');
    }

    // Test 3: AFFAIRE "génère" DEPENSES
    console.log('\n📋 Test 3: Relation AFFAIRE → DEPENSES (1:N)');
    
    const affaireWithDepenses = await prisma.affaires.findFirst({
      include: {
        depensesAffaireses: true
      }
    });

    if (affaireWithDepenses) {
      console.log(`✅ Relation AFFAIRE → DEPENSES: ${affaireWithDepenses.depensesAffaireses.length} dépenses trouvées`);
    } else {
      console.log('ℹ️  Aucune affaire avec dépenses trouvée (base vide)');
    }

    // Test 4: AUDIENCE "produit" RESULTAT
    console.log('\n📋 Test 4: Relation AUDIENCE → RESULTAT (1:N)');
    
    const audienceWithResultat = await prisma.audiences.findFirst({
      include: {
        resultat: true
      }
    });

    if (audienceWithResultat) {
      console.log(`✅ Relation AUDIENCE → RESULTAT: ${audienceWithResultat.resultat.length} résultats trouvés`);
    } else {
      console.log('ℹ️  Aucune audience avec résultat trouvée (base vide)');
    }

    // Test 5: HONORAIRES "reçoit" PAIEMENTS
    console.log('\n📋 Test 5: Relation HONORAIRES → PAIEMENTS (1:N)');
    
    const honoraireWithPaiements = await prisma.honorairesContentieux.findFirst({
      include: {
        paiementsHonorairesContentieuxes: true
      }
    });

    if (honoraireWithPaiements) {
      console.log(`✅ Relation HONORAIRES → PAIEMENTS: ${honoraireWithPaiements.paiementsHonorairesContentieuxes.length} paiements trouvés`);
    } else {
      console.log('ℹ️  Aucun honoraire avec paiements trouvé (base vide)');
    }

    // Test de création complète pour valider toutes les relations
    console.log('\n🧪 Test de création complète des relations...');
    
    // Créer une affaire
    const affaire = await prisma.affaires.create({
      data: {
        reference: 'REL-TEST-001',
        intitule: 'Test Relations Complètes',
        statut: 'ACTIVE',
        demandeurs: [],
        defendeurs: [],
        createdBy: 'test-relations'
      }
    });
    console.log('✅ Affaire créée:', affaire.reference);

    // Créer une audience liée à l'affaire
    const audience = await prisma.audiences.create({
      data: {
        affaireId: affaire.id,
        date: new Date('2026-03-15'),
        heure: '10:00',
        type: 'MISE_EN_ETAT',
        juridiction: 'TGI Dakar',
        chambre: 'Chambre 1',
        ville: 'Dakar',
        statut: 'A_VENIR',
        createdBy: 'test-relations'
      }
    });
    console.log('✅ Audience créée pour l\'affaire');

    // Créer un résultat pour l'audience
    const resultat = await prisma.resultatsAudiences.create({
      data: {
        audienceId: audience.id,
        type: 'RENVOI',
        nouvelleDate: new Date('2026-04-15'),
        motifRenvoi: 'Complément d\'enquête',
        createdBy: 'test-relations'
      }
    });
    console.log('✅ Résultat créé pour l\'audience');

    // Créer des honoraires pour l'affaire
    const honoraires = await prisma.honorairesContentieux.create({
      data: {
        affaireId: affaire.id,
        montantFacture: 500000,
        montantEncaisse: 0,
        dateFacturation: new Date(),
        notes: 'Honoraires test relations',
        createdBy: 'test-relations'
      }
    });
    console.log('✅ Honoraires créés pour l\'affaire');

    // Créer un paiement pour les honoraires
    const paiement = await prisma.paiementsHonorairesContentieux.create({
      data: {
        honorairesId: honoraires.id,
        date: new Date(),
        montant: 250000,
        modePaiement: 'VIREMENT',
        notes: 'Paiement partiel test',
        createdBy: 'test-relations'
      }
    });
    console.log('✅ Paiement créé pour les honoraires');

    // Créer des dépenses pour l'affaire
    const depense = await prisma.depensesAffaires.create({
      data: {
        affaireId: affaire.id,
        date: new Date(),
        typeDepense: 'FRAIS_HUISSIER',
        nature: 'Signification',
        montant: 25000,
        description: 'Frais de signification test',
        createdBy: 'test-relations'
      }
    });
    console.log('✅ Dépense créée pour l\'affaire');

    // Vérifier toutes les relations en une seule requête
    console.log('\n🔗 Vérification finale des relations...');
    
    const affaireComplete = await prisma.affaires.findUnique({
      where: { id: affaire.id },
      include: {
        audiences: {
          include: {
            resultat: true
          }
        },
        honorairesContentieuxes: {
          include: {
            paiementsHonorairesContentieuxes: true
          }
        },
        depensesAffaireses: true
      }
    });

    if (affaireComplete) {
      console.log('✅ Relations vérifiées:');
      console.log(`   - Audiences: ${affaireComplete.audiences.length}`);
      console.log(`   - Résultats d'audiences: ${affaireComplete.audiences.reduce((sum, aud) => sum + aud.resultat.length, 0)}`);
      console.log(`   - Honoraires: ${affaireComplete.honorairesContentieuxes.length}`);
      console.log(`   - Paiements: ${affaireComplete.honorairesContentieuxes.reduce((sum, hon) => sum + hon.paiementsHonorairesContentieuxes.length, 0)}`);
      console.log(`   - Dépenses: ${affaireComplete.depensesAffaireses.length}`);
    }

    // Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    await prisma.paiementsHonorairesContentieux.delete({ where: { id: paiement.id } });
    await prisma.honorairesContentieux.delete({ where: { id: honoraires.id } });
    await prisma.depensesAffaires.delete({ where: { id: depense.id } });
    await prisma.resultatsAudiences.delete({ where: { id: resultat.id } });
    await prisma.audiences.delete({ where: { id: audience.id } });
    await prisma.affaires.delete({ where: { id: affaire.id } });
    console.log('✅ Nettoyage terminé');

    console.log('\n🎉 TOUTES LES RELATIONS RESPECTENT LE DIAGRAMME !');
    console.log('\n📊 Résumé des relations validées:');
    console.log('   ✅ AFFAIRE → AUDIENCES (1:N)');
    console.log('   ✅ AFFAIRE → HONORAIRES (1:N)');
    console.log('   ✅ AFFAIRE → DEPENSES (1:N)');
    console.log('   ✅ AUDIENCE → RESULTAT (1:N)');
    console.log('   ✅ HONORAIRES → PAIEMENTS (1:N)');

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