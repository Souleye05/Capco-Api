import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importCapcoData() {
  console.log('🚀 Début de l\'importation des données CAPCO...');
  
  try {
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, '../data/capco-data-import.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Diviser le contenu en requêtes individuelles
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'));
    
    console.log(`📝 ${queries.length} requêtes SQL à exécuter...`);
    
    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.includes('INSERT INTO') || query.includes('SET session_replication_role')) {
        try {
          await prisma.$executeRawUnsafe(query);
          console.log(`✅ Requête ${i + 1}/${queries.length} exécutée avec succès`);
        } catch (error) {
          console.warn(`⚠️  Requête ${i + 1} ignorée (probablement déjà existante):`, error.message);
        }
      }
    }
    
    // Vérifier les données importées
    const stats = await getImportStats();
    console.log('\n📊 Statistiques d\'importation:');
    console.log(`- Propriétaires: ${stats.proprietaires}`);
    console.log(`- Locataires: ${stats.locataires}`);
    console.log(`- Immeubles: ${stats.immeubles}`);
    console.log(`- Lots: ${stats.lots}`);
    console.log(`- Encaissements: ${stats.encaissements}`);
    console.log(`- Dépenses: ${stats.depenses}`);
    
    console.log('\n🎉 Importation des données CAPCO terminée avec succès!');
    
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
    locataires,
    immeubles,
    lots,
    encaissements,
    depenses
  ] = await Promise.all([
    prisma.proprietaires.count(),
    prisma.locataires.count(),
    prisma.immeubles.count(),
    prisma.lots.count(),
    prisma.encaissementsLoyers.count(),
    prisma.depensesImmeubles.count()
  ]);
  
  return {
    proprietaires,
    locataires,
    immeubles,
    lots,
    encaissements,
    depenses
  };
}

// Exécuter le script si appelé directement
if (require.main === module) {
  importCapcoData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { importCapcoData };