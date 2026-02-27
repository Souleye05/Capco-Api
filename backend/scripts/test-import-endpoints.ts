import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

/**
 * Script pour tester tous les endpoints d'import via API REST
 */

const BASE_URL = 'http://localhost:3000';
const TEST_FILES_DIR = path.join(__dirname, '../test-files');

// Configuration de test
const config = {
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // À remplacer par un vrai token
  }
};

class ImportTester {
  private axios = axios.create(config);

  /**
   * Tester l'authentification
   */
  async testAuth() {
    console.log('🔐 Test d\'authentification...');
    try {
      const response = await this.axios.post('/auth/login', {
        email: 'admin@capco.com', // À adapter selon vos données
        password: 'password123'
      });
      
      if (response.data.access_token) {
        this.axios.defaults.headers['Authorization'] = `Bearer ${response.data.access_token}`;
        console.log('✅ Authentification réussie');
        return true;
      }
    } catch (error) {
      console.log('❌ Erreur d\'authentification:', error.response?.data || error.message);
      console.log('💡 Conseil: Créez un utilisateur admin ou utilisez un token valide');
      return false;
    }
  }

  /**
   * Tester le téléchargement de templates
   */
  async testTemplateDownload() {
    console.log('\n📥 Test de téléchargement de templates...');
    
    const templates = [
      { endpoint: '/immobilier/import/templates/PROPRIETAIRES', name: 'proprietaires' },
      { endpoint: '/immobilier/import/templates/IMMEUBLES', name: 'immeubles' },
      { endpoint: '/immobilier/import/templates/LOCATAIRES', name: 'locataires' },
      { endpoint: '/immobilier/import/templates/LOTS', name: 'lots' },
      { endpoint: '/immobilier/import/templates/multi-sheet', name: 'multi-sheet' }
    ];

    for (const template of templates) {
      try {
        const response = await this.axios.get(template.endpoint, {
          responseType: 'arraybuffer'
        });
        
        if (response.status === 200) {
          console.log(`✅ Template ${template.name}: OK (${response.data.length} bytes)`);
        }
      } catch (error) {
        console.log(`❌ Template ${template.name}: ${error.response?.status || error.message}`);
      }
    }
  }

  /**
   * Tester la validation d'un fichier
   */
  async testValidation(filePath: string, entityType: string) {
    console.log(`\n🔍 Test de validation: ${path.basename(filePath)} (${entityType})`);
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      const response = await this.axios.post(
        `/immobilier/import/validate/${entityType}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          }
        }
      );
      
      const result = response.data;
      console.log(`✅ Validation terminée:`);
      console.log(`   - Total: ${result.totalRows} lignes`);
      console.log(`   - Valides: ${result.validRows} lignes`);
      console.log(`   - Invalides: ${result.invalidRows} lignes`);
      console.log(`   - Erreurs: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log('   Premières erreurs:');
        result.errors.slice(0, 3).forEach(error => {
          console.log(`     - Ligne ${error.row}: ${error.error}`);
        });
      }
      
      return result;
    } catch (error) {
      console.log(`❌ Erreur de validation: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  /**
   * Tester l'import d'un fichier
   */
  async testImport(filePath: string, endpoint: string) {
    console.log(`\n📤 Test d'import: ${path.basename(filePath)} -> ${endpoint}`);
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      const startTime = Date.now();
      const response = await this.axios.post(endpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        }
      });
      const duration = Date.now() - startTime;
      
      const result = response.data;
      console.log(`✅ Import terminé en ${duration}ms:`);
      console.log(`   - Succès: ${result.success}`);
      console.log(`   - Total: ${result.totalRows} lignes`);
      console.log(`   - Réussies: ${result.successfulRows} lignes`);
      console.log(`   - Échouées: ${result.failedRows} lignes`);
      console.log(`   - Temps/ligne: ${result.performanceMetrics?.avgProcessingTimePerRow?.toFixed(2)}ms`);
      
      if (result.errors.length > 0) {
        console.log('   Erreurs:');
        result.errors.slice(0, 3).forEach(error => {
          console.log(`     - Ligne ${error.row}: ${error.error}`);
        });
      }
      
      return result;
    } catch (error) {
      console.log(`❌ Erreur d'import: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  /**
   * Tester la progression d'un import
   */
  async testProgress(importId: string) {
    console.log(`\n📊 Test de progression: ${importId}`);
    
    try {
      const response = await this.axios.get(`/immobilier/import/progress/${importId}`);
      const progress = response.data;
      
      console.log(`✅ Progression récupérée:`);
      console.log(`   - Status: ${progress.status}`);
      console.log(`   - Progression: ${progress.processedRows}/${progress.totalRows}`);
      console.log(`   - Réussies: ${progress.successfulRows}`);
      console.log(`   - Échouées: ${progress.failedRows}`);
      
      return progress;
    } catch (error) {
      console.log(`❌ Erreur de progression: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🚀 Début des tests du service d\'import Excel\n');
    
    // 1. Test d'authentification
    const authSuccess = await this.testAuth();
    if (!authSuccess) {
      console.log('\n❌ Tests interrompus - Authentification échouée');
      return;
    }

    // 2. Test des templates
    await this.testTemplateDownload();

    // Vérifier que les fichiers de test existent
    if (!fs.existsSync(TEST_FILES_DIR)) {
      console.log('\n❌ Dossier de test non trouvé. Exécutez d\'abord create-test-excel-files.ts');
      return;
    }

    // 3. Tests de validation
    const testFiles = [
      { file: 'proprietaires_valide.xlsx', type: 'PROPRIETAIRES' },
      { file: 'proprietaires_avec_erreurs.xlsx', type: 'PROPRIETAIRES' },
      { file: 'immeubles_valide.xlsx', type: 'IMMEUBLES' }
    ];

    for (const test of testFiles) {
      const filePath = path.join(TEST_FILES_DIR, test.file);
      if (fs.existsSync(filePath)) {
        await this.testValidation(filePath, test.type);
      }
    }

    // 4. Tests d'import
    const importTests = [
      { file: 'proprietaires_valide.xlsx', endpoint: '/immobilier/import/proprietaires' },
      { file: 'immeubles_valide.xlsx', endpoint: '/immobilier/import/immeubles' },
      { file: 'import_complet_valide.xlsx', endpoint: '/immobilier/import/all' }
    ];

    for (const test of importTests) {
      const filePath = path.join(TEST_FILES_DIR, test.file);
      if (fs.existsSync(filePath)) {
        const result = await this.testImport(filePath, test.endpoint);
        
        // Test de progression si import réussi
        if (result && result.importId) {
          await this.testProgress(result.importId);
        }
      }
    }

    console.log('\n🎉 Tests terminés !');
  }
}

// Exécuter les tests si appelé directement
if (require.main === module) {
  const tester = new ImportTester();
  tester.runAllTests().catch(console.error);
}

export { ImportTester };