const fetch = require('node-fetch');

async function testArrieragesEndpoint() {
    const baseUrl = 'http://localhost:3001/api';
    
    console.log('🔍 Test de l\'endpoint arriérés...\n');
    
    try {
        // Test 1: Endpoint sans authentification (devrait retourner 401)
        console.log('1. Test sans authentification:');
        const response1 = await fetch(`${baseUrl}/immobilier/arrierages`);
        console.log(`   Status: ${response1.status} ${response1.statusText}`);
        
        if (response1.status === 401) {
            console.log('   ✅ Authentification requise (normal)');
        } else {
            console.log('   ❌ Problème: devrait retourner 401');
        }
        
        // Test 2: Login pour obtenir un token
        console.log('\n2. Tentative de connexion:');
        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@capco.com',
                password: 'admin123'
            })
        });
        
        console.log(`   Status: ${loginResponse.status} ${loginResponse.statusText}`);
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('   ✅ Connexion réussie');
            console.log(`   User: ${loginData.user.email}`);
            console.log(`   Roles: ${loginData.user.roles.join(', ')}`);
            
            // Test 3: Endpoint avec authentification
            console.log('\n3. Test avec authentification:');
            const response3 = await fetch(`${baseUrl}/immobilier/arrierages?limit=10`, {
                headers: {
                    'Authorization': `Bearer ${loginData.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`   Status: ${response3.status} ${response3.statusText}`);
            
            if (response3.ok) {
                const data = await response3.json();
                console.log('   ✅ Endpoint fonctionne');
                console.log(`   Nombre d'arriérés: ${data.data ? data.data.length : 'N/A'}`);
                console.log(`   Structure: ${JSON.stringify(Object.keys(data), null, 2)}`);
                
                if (data.data && data.data.length > 0) {
                    console.log(`   Premier arriéré: ${JSON.stringify(data.data[0], null, 2)}`);
                }
            } else {
                const errorData = await response3.text();
                console.log('   ❌ Erreur avec authentification');
                console.log(`   Réponse: ${errorData}`);
            }
        } else {
            const errorData = await loginResponse.text();
            console.log('   ❌ Échec de connexion');
            console.log(`   Réponse: ${errorData}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

testArrieragesEndpoint();