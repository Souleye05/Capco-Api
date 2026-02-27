const fetch = require('node-fetch');

async function testArrieresStats() {
    const baseUrl = 'http://localhost:3001/api';
    
    console.log('📊 Test de l\'endpoint statistiques arriérés...\n');
    
    try {
        // Test de connexion
        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 's.niang@capco.sn',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            console.log('❌ Échec de connexion, essayons avec un autre utilisateur...');
            
            // Essayer avec souleyniang99@gmail.com
            const loginResponse2 = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'souleyniang99@gmail.com',
                    password: 'password123'
                })
            });
            
            if (!loginResponse2.ok) {
                console.log('❌ Impossible de se connecter avec les utilisateurs testés');
                return;
            }
            
            const loginData2 = await loginResponse2.json();
            console.log('✅ Connexion réussie avec souleyniang99@gmail.com');
            
            // Test des endpoints
            await testEndpoints(baseUrl, loginData2.access_token);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Connexion réussie avec s.niang@capco.sn');
        
        await testEndpoints(baseUrl, loginData.access_token);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

async function testEndpoints(baseUrl, token) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    // Test 1: Endpoint arriérés
    console.log('\n1. Test endpoint arriérés:');
    const arrieresResponse = await fetch(`${baseUrl}/immobilier/arrierages?limit=10`, { headers });
    console.log(`   Status: ${arrieresResponse.status}`);
    
    if (arrieresResponse.ok) {
        const arrieresData = await arrieresResponse.json();
        console.log(`   ✅ ${arrieresData.data?.length || 0} arriérés trouvés`);
        
        if (arrieresData.data && arrieresData.data.length > 0) {
            const premier = arrieresData.data[0];
            console.log(`   Premier arriéré: ${premier.immeubleNom} ${premier.lotNumero} - ${premier.montantDu} FCFA`);
        }
    } else {
        console.log('   ❌ Erreur arriérés');
    }
    
    // Test 2: Endpoint statistiques
    console.log('\n2. Test endpoint statistiques:');
    const statsResponse = await fetch(`${baseUrl}/immobilier/arrierages/statistics`, { headers });
    console.log(`   Status: ${statsResponse.status}`);
    
    if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('   ✅ Statistiques récupérées');
        console.log(`   Structure: ${JSON.stringify(Object.keys(statsData), null, 2)}`);
        console.log(`   Données: ${JSON.stringify(statsData, null, 2)}`);
    } else {
        const errorData = await statsResponse.text();
        console.log('   ❌ Erreur statistiques');
        console.log(`   Réponse: ${errorData}`);
    }
}

testArrieresStats();