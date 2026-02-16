import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickImportCapcoData() {
  console.log('🚀 Importation rapide des données CAPCO...');
  
  try {
    // Désactiver les contraintes FK temporairement
    await prisma.$executeRaw`SET session_replication_role = 'replica'`;
    
    // 1. USER_ROLES
    console.log('📝 Importation des rôles utilisateurs...');
    await prisma.$executeRaw`
      INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
      ('e66302e1-5cfc-4fc5-bfe4-765c1ee4c2cd', '5e01a3d3-cacf-4004-a5ee-20983d49b004', 'collaborateur', '2026-01-19 23:55:10.672609+00'),
      ('699ebb9a-0c39-4507-87d8-4983978b026f', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c', 'admin', '2026-01-20 00:09:39.555106+00'),
      ('046abc70-e4af-4ba2-9478-b81adf8a71d2', '9aa7f986-a54a-440e-9b89-b230c7806c75', 'compta', '2026-01-20 00:10:19.553334+00')
      ON CONFLICT (id) DO NOTHING
    `;
    
    // 2. PROPRIETAIRES
    console.log('📝 Importation des propriétaires...');
    await prisma.$executeRaw`
      INSERT INTO public.proprietaires (id, nom, telephone, email, adresse, created_at, created_by) VALUES
      ('924f21f1-3a61-4198-b86c-505e42df4873', 'Adja COGNA', '776536739', NULL, 'Patte d''oie Builders, DAKAR', '2026-01-20 03:23:19.610684+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('d6f6ba00-5b00-4db7-9008-746aa1f3213b', 'Adji Mbow TALL', '775649800', NULL, 'Nord foire, DAKAR', '2026-01-20 03:23:19.907277+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('4bce363d-d483-49d4-bd2d-ed80c202a88a', 'Mame Khady SECK', '771561352', NULL, 'Thiaroye azur, DAKAR', '2026-01-20 03:23:20.20236+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('1dd7f518-1c20-4d7c-92e1-56eee2812077', 'Arame DIOUF CISSE', '776158486', NULL, 'USA', '2026-01-20 03:23:20.47438+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('961c0f1e-b2b5-4d49-bfbc-5895b078c3f3', 'FALO BEYE', '13143229700', NULL, 'USA', '2026-01-20 03:23:20.732321+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('a08101af-be2f-46ce-ba0f-0698ee4e6358', 'Fama Isaac SENE', '776390416', NULL, 'Nord foire, DAKAR', '2026-01-20 03:23:20.979303+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('6ad1e686-0225-4de2-bf48-a0fc3dec82fb', 'Hélène WONE', '33661563005', NULL, 'France', '2026-01-20 03:23:21.211387+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('c64fc520-6558-4680-ba17-d95365a65cc5', 'Ibrahima DIOP', '775465663', NULL, 'Italie', '2026-01-20 03:23:21.444417+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('9bf6d292-6d49-4139-bc41-93466a63d915', 'KARA DIOP', NULL, NULL, 'USA', '2026-01-20 03:23:21.682172+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('d6755a4b-3dd9-4bfb-8851-49d1628e9d8c', 'Maniang NIANG', '778762772', NULL, 'Hann Maristes lot D/59, DAKAR', '2026-01-20 03:23:21.914949+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('22394b3c-aaca-441c-8831-a898a9cc7227', 'Moctar SALL', NULL, NULL, 'Italie', '2026-01-20 03:23:22.154268+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('ca924c55-eac8-4637-9e1d-97243a9a083f', 'Ndiaga LO', '776449607', NULL, 'Mbao, DAKAR', '2026-01-20 03:23:22.38794+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
      ('b08c7ebc-40d4-4760-86fc-54820670f103', 'Ousmane Madiagne DIOP', '775590414', NULL, 'Sacré Cœur 3, DAKAR / SUISSE', '2026-01-20 03:23:22.622312+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c')
      ON CONFLICT (id) DO NOTHING
    `;
    
    // 3. DOSSIERS_RECOUVREMENT
    console.log('📝 Importation des dossiers de recouvrement...');
    await prisma.$executeRaw`
      INSERT INTO public.dossiers_recouvrement (id, reference, creancier_nom, debiteur_nom, montant_principal, total_a_recouvrer, statut, notes, created_at, updated_at, created_by) VALUES
      ('69c29e6b-a3f7-42c4-bde2-9798bf0a0bc2', 'REC-2026-0001', 'EFFITRANS SA', 'APACK SA', 7141236.00, 7141236.00, 'EN_COURS', 'Recouvrement de créances suite à des factures impayées', '2026-01-20 22:46:34.836078+00', '2026-01-20 22:46:34.836078+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c')
      ON CONFLICT (id) DO NOTHING
    `;
    
    // 4. PAIEMENTS_RECOUVREMENT
    console.log('📝 Importation des paiements de recouvrement...');
    await prisma.$executeRaw`
      INSERT INTO public.paiements_recouvrement (id, dossier_id, date, montant, mode, commentaire, created_at, created_by) VALUES
      ('a1a8bc1c-5d9e-4724-aee0-d926ac5b8039', '69c29e6b-a3f7-42c4-bde2-9798bf0a0bc2', '2026-01-20', 1500000.00, 'CHEQUE', 'Paiement de la somme de 1500000FCFA effectué par APACK après la réception de la lettre de mise en demeure ', '2026-01-20 22:47:53.806606+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c')
      ON CONFLICT (id) DO NOTHING
    `;
    
    // 5. CLIENTS_CONSEIL
    console.log('📝 Importation des clients conseil...');
    await prisma.$executeRaw`
      INSERT INTO public.clients_conseil (id, reference, nom, type, honoraire_mensuel, jour_facturation, statut, created_at, updated_at, created_by) VALUES
      ('c08d64e0-c2b3-444d-9c87-52d23126a842', '', 'TECHNOLOGIES SERVICES', 'morale', 250000.00, 5, 'ACTIF', '2026-01-22 14:10:49.918709+00', '2026-01-22 14:10:49.918709+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c')
      ON CONFLICT (id) DO NOTHING
    `;
    
    // Réactiver les contraintes FK
    await prisma.$executeRaw`SET session_replication_role = 'origin'`;
    
    // Vérifier les données importées
    const stats = await getImportStats();
    console.log('\n📊 Statistiques d\'importation:');
    console.log(`- Propriétaires: ${stats.proprietaires}`);
    console.log(`- Dossiers recouvrement: ${stats.dossiersRecouvrement}`);
    console.log(`- Paiements recouvrement: ${stats.paiementsRecouvrement}`);
    console.log(`- Clients conseil: ${stats.clientsConseil}`);
    
    console.log('\n🎉 Importation rapide terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function getImportStats() {
  const [
    proprietaires,
    dossiersRecouvrement,
    paiementsRecouvrement,
    clientsConseil
  ] = await Promise.all([
    prisma.proprietaires.count(),
    prisma.dossiersRecouvrement.count(),
    prisma.paiementsRecouvrement.count(),
    prisma.clientsConseil.count()
  ]);
  
  return {
    proprietaires,
    dossiersRecouvrement,
    paiementsRecouvrement,
    clientsConseil
  };
}

// Exécuter le script si appelé directement
if (require.main === module) {
  quickImportCapcoData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { quickImportCapcoData };