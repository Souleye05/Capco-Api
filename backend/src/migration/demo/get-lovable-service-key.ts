/**
 * Guide pour obtenir la clé de service Supabase depuis Lovable Cloud
 */

console.log(`
🌟 COMMENT OBTENIR LA CLÉ DE SERVICE SUPABASE DEPUIS LOVABLE CLOUD

Lovable Cloud gère automatiquement votre backend Supabase, mais vous pouvez
accéder aux clés d'API pour la migration.

📋 ÉTAPES DÉTAILLÉES:

1. 🖥️  ACCÉDER À L'INTERFACE CLOUD:
   - Ouvrez votre projet Lovable
   - Cliquez sur l'onglet "Cloud" ou "Backend"
   - Cherchez "Database" ou "Supabase Settings"

2. 🔑 TROUVER LES CLÉS API:
   Dans l'interface Cloud, cherchez:
   - "API Keys"
   - "Project Settings" 
   - "Configuration"
   - "Environment Variables"

3. 📝 IDENTIFIER LA BONNE CLÉ:
   Vous devriez voir deux clés:
   
   ✅ anon/public key (déjà dans votre .env):
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa3B5dnlmcXlmZ2tqZ2t6Y3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTM5NzQsImV4cCI6MjA4NDQyOTk3NH0.bDEemn6JEqAP0Qq9s5Vk0qRShMaR-E3v5orIFCtnhc4
   
   🎯 service_role key (celle qu'il nous faut):
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa3B5dnlmcXlmZ2tqZ2t6Y3JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg1Mzk3NCwiZXhwIjoyMDg0NDI5OTc0fQ.SIGNATURE_DIFFÉRENTE_ICI

4. 🔧 METTRE À JOUR LE .ENV:
   Remplacez dans backend/.env:
   
   SUPABASE_SERVICE_ROLE_KEY="LA_VRAIE_CLÉ_SERVICE_ROLE_ICI"

5. ✅ VÉRIFIER LA CLÉ:
   La vraie clé service_role:
   - Commence par "eyJ"
   - Contient "service_role" dans le payload
   - Est différente de la clé anon
   - Fait environ 200+ caractères

🚨 ALTERNATIVES SI VOUS NE TROUVEZ PAS LA CLÉ:

A. 📊 EXPORT MANUEL VIA SQL:
   Dans l'interface Cloud, exécutez ces requêtes:
   
   -- Voir tous les utilisateurs
   SELECT id, email, created_at, email_confirmed_at, last_sign_in_at 
   FROM auth.users;
   
   -- Voir les rôles
   SELECT * FROM user_roles;
   
   -- Export complet
   SELECT 
     u.id, u.email, u.created_at, u.email_confirmed_at, u.last_sign_in_at,
     ur.role
   FROM auth.users u
   LEFT JOIN user_roles ur ON u.id = ur.user_id;

B. 🎫 CONTACTER LE SUPPORT LOVABLE:
   - Demandez l'accès aux clés d'API Supabase
   - Expliquez que vous avez besoin de la "service_role" key
   - Pour la migration de données

C. 🔄 UTILISER L'EXPORT PARTIEL:
   Même sans la clé service_role, vous pouvez:
   - Exporter les rôles via les tables publiques
   - Créer manuellement les utilisateurs dans NestJS
   - Utiliser les données disponibles

📞 SUPPORT:
Si vous avez des difficultés, le script peut fonctionner en mode dégradé
avec les données disponibles dans les tables publiques.

🚀 PROCHAINES ÉTAPES:
Une fois la clé obtenue, lancez:
npx ts-node src/migration/demo/lovable-cloud-user-export.ts
`);

// Fonction pour tester la clé
async function testSupabaseKey() {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ Variables manquantes dans .env');
    return;
  }
  
  console.log('\n🧪 TEST DE LA CLÉ DE SERVICE:');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Clé: ${supabaseServiceKey.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      console.log('   → La clé n\'est probablement pas correcte');
    } else {
      console.log(`✅ Succès: ${data.users.length} utilisateurs trouvés`);
      console.log('   → La clé fonctionne parfaitement !');
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  }
}

// Tester la clé si elle existe
if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
  testSupabaseKey();
} else {
  console.log('\n⚠️  Clé de service non configurée ou incorrecte');
  console.log('   Suivez les instructions ci-dessus pour l\'obtenir');
}