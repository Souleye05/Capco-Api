import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script pour créer des fichiers Excel de test pour le service d'import
 */

// Créer le dossier de test s'il n'existe pas
const testDir = path.join(__dirname, '../test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 1. Fichier de test pour Propriétaires (valide)
const proprietairesData = [
  {
    nom: 'Dupont Jean',
    telephone: '0123456789',
    email: 'jean.dupont@email.com',
    adresse: '123 Rue de la Paix, 75001 Paris'
  },
  {
    nom: 'Martin Sophie',
    telephone: '0987654321',
    email: 'sophie.martin@email.com',
    adresse: '456 Avenue des Champs, 69000 Lyon'
  },
  {
    nom: 'Durand Pierre',
    telephone: '0147258369',
    email: 'pierre.durand@email.com',
    adresse: '789 Boulevard Victor Hugo, 13000 Marseille'
  }
];

// 2. Fichier de test pour Immeubles (valide)
const immeublesData = [
  {
    nom: 'Résidence Les Jardins',
    adresse: '10 Rue des Fleurs, 75015 Paris',
    proprietaire_nom: 'Dupont Jean',
    taux_commission: 5,
    notes: 'Immeuble récent avec ascenseur'
  },
  {
    nom: 'Villa Moderne',
    adresse: '25 Avenue de la République, 69003 Lyon',
    proprietaire_nom: 'Martin Sophie',
    taux_commission: 7,
    notes: 'Villa individuelle avec jardin'
  }
];

// 3. Fichier de test pour Locataires (valide)
const locatairesData = [
  {
    nom: 'Leblanc Marie',
    telephone: '0156789012',
    email: 'marie.leblanc@email.com'
  },
  {
    nom: 'Moreau Paul',
    telephone: '0167890123',
    email: 'paul.moreau@email.com'
  }
];

// 4. Fichier de test pour Lots (valide)
const lotsData = [
  {
    numero: 'A101',
    immeuble_nom: 'Résidence Les Jardins',
    type: 'F3',
    etage: '1',
    loyer_mensuel: 1200,
    locataire_nom: 'Leblanc Marie',
    statut: 'OCCUPE'
  },
  {
    numero: 'A102',
    immeuble_nom: 'Résidence Les Jardins',
    type: 'F2',
    etage: '1',
    loyer_mensuel: 950,
    locataire_nom: '',
    statut: 'LIBRE'
  }
];

// 5. Fichier multi-feuilles complet (valide)
function createMultiSheetFile() {
  const workbook = XLSX.utils.book_new();
  
  // Ajouter chaque feuille
  const proprietairesWS = XLSX.utils.json_to_sheet(proprietairesData);
  XLSX.utils.book_append_sheet(workbook, proprietairesWS, 'Proprietaires');
  
  const immeublesWS = XLSX.utils.json_to_sheet(immeublesData);
  XLSX.utils.book_append_sheet(workbook, immeublesWS, 'Immeubles');
  
  const locatairesWS = XLSX.utils.json_to_sheet(locatairesData);
  XLSX.utils.book_append_sheet(workbook, locatairesWS, 'Locataires');
  
  const lotsWS = XLSX.utils.json_to_sheet(lotsData);
  XLSX.utils.book_append_sheet(workbook, lotsWS, 'Lots');
  
  // Sauvegarder
  XLSX.writeFile(workbook, path.join(testDir, 'import_complet_valide.xlsx'));
}

// 6. Fichiers avec erreurs pour tester la validation
const proprietairesAvecErreurs = [
  {
    nom: '', // Erreur : nom vide
    telephone: 'invalid', // Erreur : téléphone invalide
    email: 'email-invalide', // Erreur : email invalide
    adresse: 'Adresse test'
  },
  {
    nom: 'Dupont Jean', // Erreur : doublon potentiel
    telephone: '0123456789',
    email: 'jean.dupont@email.com',
    adresse: '123 Rue de la Paix'
  }
];

// 7. Fichier de performance (1000 lignes)
function createPerformanceFile() {
  const performanceData = [];
  for (let i = 1; i <= 1000; i++) {
    performanceData.push({
      nom: `Propriétaire Test ${i}`,
      telephone: `012345${String(i).padStart(4, '0')}`,
      email: `test${i}@example.com`,
      adresse: `${i} Rue de Test, 75000 Paris`
    });
  }
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(performanceData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
  XLSX.writeFile(workbook, path.join(testDir, 'test_performance_1000_lignes.xlsx'));
}

// Créer tous les fichiers de test
function createAllTestFiles() {
  console.log('🔄 Création des fichiers Excel de test...');
  
  // Fichiers individuels valides
  let workbook = XLSX.utils.book_new();
  let worksheet = XLSX.utils.json_to_sheet(proprietairesData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
  XLSX.writeFile(workbook, path.join(testDir, 'proprietaires_valide.xlsx'));
  
  workbook = XLSX.utils.book_new();
  worksheet = XLSX.utils.json_to_sheet(immeublesData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Immeubles');
  XLSX.writeFile(workbook, path.join(testDir, 'immeubles_valide.xlsx'));
  
  workbook = XLSX.utils.book_new();
  worksheet = XLSX.utils.json_to_sheet(locatairesData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Locataires');
  XLSX.writeFile(workbook, path.join(testDir, 'locataires_valide.xlsx'));
  
  workbook = XLSX.utils.book_new();
  worksheet = XLSX.utils.json_to_sheet(lotsData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lots');
  XLSX.writeFile(workbook, path.join(testDir, 'lots_valide.xlsx'));
  
  // Fichier multi-feuilles
  createMultiSheetFile();
  
  // Fichier avec erreurs
  workbook = XLSX.utils.book_new();
  worksheet = XLSX.utils.json_to_sheet(proprietairesAvecErreurs);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proprietaires');
  XLSX.writeFile(workbook, path.join(testDir, 'proprietaires_avec_erreurs.xlsx'));
  
  // Fichier de performance
  createPerformanceFile();
  
  // Fichier vide
  workbook = XLSX.utils.book_new();
  worksheet = XLSX.utils.json_to_sheet([]);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vide');
  XLSX.writeFile(workbook, path.join(testDir, 'fichier_vide.xlsx'));
  
  console.log('✅ Fichiers de test créés dans:', testDir);
  console.log('📁 Fichiers disponibles:');
  console.log('  - proprietaires_valide.xlsx (3 propriétaires)');
  console.log('  - immeubles_valide.xlsx (2 immeubles)');
  console.log('  - locataires_valide.xlsx (2 locataires)');
  console.log('  - lots_valide.xlsx (2 lots)');
  console.log('  - import_complet_valide.xlsx (multi-feuilles)');
  console.log('  - proprietaires_avec_erreurs.xlsx (avec erreurs)');
  console.log('  - test_performance_1000_lignes.xlsx (1000 lignes)');
  console.log('  - fichier_vide.xlsx (fichier vide)');
}

// Exécuter si appelé directement
if (require.main === module) {
  createAllTestFiles();
}

export { createAllTestFiles };