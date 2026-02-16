import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger explicitement le fichier .env
const envPath = path.join(__dirname, '../../../.env');
console.log(`🔧 Chargement du fichier .env depuis: ${envPath}`);
dotenv.config({ path: envPath });

console.log('🌟 TEST DES VARIABLES D\'ENVIRONNEMENT ET EXPORT LOVABLE CLOUD');
console.log('=' .repeat(60));

// Vérifier les variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Variables d\'environnement:');
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ ' + supabaseUrl : '❌ Manquante'}`);
console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ ' + supabaseAnonKey.substring(0, 30) + '...' : '❌ Manquante'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ ' + supabaseServiceKey.substring(0, 30) + '...' : '❌ Manquante'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Variables essentielles manquantes');
  process.exit(1);
}

// Test de connexion avec les clés disponibles
async function testConnection() {
  const { createClient } = await import('@supabase/supabase-js');
  
  console.log('\n🧪 TEST DE CONNEXION SUPABASE:');
  
  // Test avec la clé anon
  console.log('\n1. Test avec la clé ANON:');
  try {
    const supabaseAnon = createClient(supabaseUrl!, supabaseAnonKey!);
    
    // Tester l'accès aux tables publiques
    const { data: rolesData, error: rolesError } = await supabaseAnon
      .from('user_roles')
      .select('*')
      .limit(5);
    
    if (rolesError) {
      console.log(`   ❌ Erreur: ${rolesError.message}`);
    } else {
      console.log(`   ✅ Accès aux rôles: ${rolesData?.length || 0} rôles trouvés`);
      if (rolesData && rolesData.length > 0) {
        console.log(`   📋 Exemple: ${JSON.stringify(rolesData[0], null, 2)}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erreur de connexion: ${error.message}`);
  }
  
  // Test avec la clé service (si disponible)
  if (supabaseServiceKey && supabaseServiceKey.startsWith('eyJ')) {
    console.log('\n2. Test avec la clé SERVICE_ROLE:');
    try {
      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.log(`   ❌ Erreur: ${authError.message}`);
        console.log('   💡 La clé service_role n\'est peut-être pas correcte');
      } else {
        console.log(`   ✅ Accès aux utilisateurs: ${authData.users.length} utilisateurs`);
        if (authData.users.length > 0) {
          const user = authData.users[0];
          console.log(`   📋 Exemple: ${user.email} (${user.id})`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  } else {
    console.log('\n2. Clé SERVICE_ROLE:');
    console.log('   ⚠️  Clé manquante ou incorrecte');
    console.log('   💡 Doit commencer par "eyJ" et être très longue');
  }
}

// Export des données disponibles
async function exportAvailableData() {
  const { createClient } = await import('@supabase/supabase-js');
  const fs = await import('fs-extra');
  
  console.log('\n📊 EXPORT DES DONNÉES DISPONIBLES:');
  
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  const exportData: any = {
    metadata: {
      exportDate: new Date().toISOString(),
      method: 'lovable_cloud_partial',
      supabaseUrl: supabaseUrl
    },
    users: [],
    userRoles: [],
    profiles: [],
    tables: {}
  };
  
  // Essayer d'exporter les rôles utilisateur
  try {
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (!rolesError && rolesData) {
      exportData.userRoles = rolesData;
      console.log(`   ✅ Rôles utilisateur: ${rolesData.length}`);
      
      // Déduire les utilisateurs des rôles
      const uniqueUserIds = [...new Set(rolesData.map((role: any) => role.user_id))];
      exportData.users = uniqueUserIds.map(userId => ({
        id: userId,
        email: `user-${userId.substring(0, 8)}@deduced.com`,
        source: 'deduced_from_roles',
        created_at: new Date().toISOString()
      }));
      console.log(`   📊 Utilisateurs déduits: ${uniqueUserIds.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur rôles: ${error.message}`);
  }
  
  // Essayer d'exporter d'autres tables
  const tablesToTry = ['profiles', 'audit_log', 'alertes'];
  
  for (const tableName of tablesToTry) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10);
      
      if (!error && data) {
        exportData.tables[tableName] = data;
        console.log(`   ✅ Table ${tableName}: ${data.length} enregistrements`);
      }
    } catch (error) {
      console.log(`   ℹ️  Table ${tableName}: non accessible`);
    }
  }
  
  // Sauvegarder
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportPath = path.join(__dirname, '../../../migration-exports', `lovable-partial-export-${timestamp}.json`);
  
  await fs.ensureDir(path.dirname(exportPath));
  await fs.writeJSON(exportPath, exportData, { spaces: 2 });
  
  console.log(`\n💾 Export sauvegardé: ${exportPath}`);
  
  return exportData;
}

// Instructions pour Lovable Cloud
function showLovableInstructions() {
  console.log(`
🌟 INSTRUCTIONS SPÉCIFIQUES LOVABLE CLOUD:

Pour obtenir la vraie clé service_role depuis Lovable:

1. 🖥️  Dans votre projet Lovable:
   - Ouvrez l'onglet "Cloud" ou "Backend"
   - Cherchez "Database Settings" ou "API Keys"

2. 📋 Requêtes SQL alternatives:
   Dans l'interface Cloud SQL, exécutez:
   
   -- Voir tous les utilisateurs
   SELECT id, email, created_at, email_confirmed_at 
   FROM auth.users;
   
   -- Export complet avec rôles
   SELECT 
     u.id, u.email, u.created_at, u.email_confirmed_at,
     ur.role
   FROM auth.users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id;

3. 🔧 Mise à jour du .env:
   Une fois la vraie clé obtenue, remplacez:
   SUPABASE_SERVICE_ROLE_KEY="LA_VRAIE_CLÉ_LONGUE_ICI"

4. 🚀 Migration:
   Avec les données partielles, vous pouvez déjà:
   - Créer les utilisateurs dans NestJS
   - Migrer les rôles
   - Configurer l'authentification
`);
}

// Exécution principale
async function main() {
  await testConnection();
  const exportData = await exportAvailableData();
  
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   Utilisateurs: ${exportData.users.length}`);
  console.log(`   Rôles: ${exportData.userRoles.length}`);
  console.log(`   Tables: ${Object.keys(exportData.tables).length}`);
  
  if (exportData.users.length === 0) {
    console.log('\n⚠️  Aucun utilisateur trouvé');
    showLovableInstructions();
  } else {
    console.log('\n✅ Export partiel réussi !');
    console.log('   Vous pouvez maintenant procéder à la migration avec ces données');
  }
}

main().catch(console.error);