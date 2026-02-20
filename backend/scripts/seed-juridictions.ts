#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Données des juridictions à insérer
const juridictions = [
  { nom: 'Tribunal de Grande Instance', code: 'TGI', ordre: 1 },
  { nom: 'Tribunal de Commerce', code: 'TC', ordre: 2 },
  { nom: 'Tribunal du Travail', code: 'TT', ordre: 3 },
  { nom: 'Tribunal Correctionnel', code: 'TCOR', ordre: 4 },
  { nom: 'Tribunal Administratif', code: 'TA', ordre: 5 },
  { nom: 'Cour d\'Appel', code: 'CA', ordre: 6 },
  { nom: 'Cour de Cassation', code: 'CC', ordre: 7 },
  { nom: 'Cour Suprême', code: 'CS', ordre: 8 },
  { nom: 'Conseil d\'État', code: 'CE', ordre: 9 },
  { nom: 'Tribunal Judiciaire', code: 'TJ', ordre: 10 },
];

async function seedJuridictions() {
  console.log('🌱 Début du seeding des juridictions...');

  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const juridictionData of juridictions) {
      try {
        // Utiliser upsert pour éviter les doublons
        const result = await prisma.juridictions.upsert({
          where: { code: juridictionData.code },
          update: {
            nom: juridictionData.nom,
            ordre: juridictionData.ordre,
            est_actif: true,
          },
          create: {
            nom: juridictionData.nom,
            code: juridictionData.code,
            ordre: juridictionData.ordre,
            est_actif: true,
          },
        });

        // Vérifier si c'est une création ou une mise à jour
        const existing = await prisma.juridictions.findFirst({
          where: { 
            code: juridictionData.code,
            created_at: { lt: new Date(Date.now() - 1000) } // Créé il y a plus d'1 seconde
          }
        });

        if (existing) {
          updated++;
          console.log(`📝 Mis à jour: ${juridictionData.nom} (${juridictionData.code})`);
        } else {
          created++;
          console.log(`✨ Créé: ${juridictionData.nom} (${juridictionData.code})`);
        }

      } catch (error) {
        if (error.code === 'P2002') {
          // Violation de contrainte unique
          console.log(`⚠️  Ignoré (déjà existant): ${juridictionData.nom} (${juridictionData.code})`);
          skipped++;
        } else {
          console.error(`❌ Erreur lors de l'insertion de ${juridictionData.nom}:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n📊 Résumé du seeding:');
    console.log(`   ✨ Créées: ${created}`);
    console.log(`   📝 Mises à jour: ${updated}`);
    console.log(`   ⚠️  Ignorées: ${skipped}`);
    console.log(`   📋 Total traité: ${juridictions.length}`);

    // Afficher toutes les juridictions actives
    const allJuridictions = await prisma.juridictions.findMany({
      where: { est_actif: true },
      orderBy: { ordre: 'asc' },
      select: {
        nom: true,
        code: true,
        ordre: true,
        est_actif: true,
      },
    });

    console.log('\n📋 Juridictions actives dans la base:');
    allJuridictions.forEach((j, index) => {
      console.log(`   ${index + 1}. ${j.nom} (${j.code}) - Ordre: ${j.ordre}`);
    });

    console.log('\n🎉 Seeding des juridictions terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Connexion à la base de données fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedJuridictions()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec du script:', error);
      process.exit(1);
    });
}

export { seedJuridictions };