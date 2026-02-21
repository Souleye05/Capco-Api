// Script de test rapide pour les honoraires et dépenses
const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Test des corrections API Honoraires et Dépenses\n');

  try {
    // Test 1: Login
    console.log('1. Test de connexion...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const { access_token } = await loginResponse.json();
    console.log('✅ Connexion réussie');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    };

    // Test 2: Statistiques honoraires
    console.log('\n2. Test statistiques honoraires...');
    const honorairesStatsResponse = await fetch(`${API_BASE}/contentieux/honoraires/statistiques`, {
      headers
    });

    if (honorairesStatsResponse.ok) {
      const stats = await honorairesStatsResponse.json();
      console.log('✅ Statistiques honoraires:', stats);
    } else {
      console.log('❌ Erreur statistiques honoraires:', honorairesStatsResponse.status);
    }

    // Test 3: Statistiques dépenses
    console.log('\n3. Test statistiques dépenses...');
    const depensesStatsResponse = await fetch(`${API_BASE}/contentieux/depenses/statistiques`, {
      headers
    });

    if (depensesStatsResponse.ok) {
      const stats = await depensesStatsResponse.json();
      console.log('✅ Statistiques dépenses:', stats);
    } else {
      console.log('❌ Erreur statistiques dépenses:', depensesStatsResponse.status);
    }

    // Test 4: Création honoraire avec validation
    console.log('\n4. Test création honoraire...');
    const createHonoraireResponse = await fetch(`${API_BASE}/contentieux/honoraires`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        affaireId: 'b0bfcc10-bfcf-4ea2-ae67-f57af038bfbe', // ID d'affaire existante
        montantFacture: 2000,
        montantEncaisse: 0,
        dateFacturation: '2026-02-20',
        notes: 'Test honoraire via script'
      })
    });

    if (createHonoraireResponse.ok) {
      const honoraire = await createHonoraireResponse.json();
      console.log('✅ Honoraire créé:', honoraire.id);
    } else {
      const error = await createHonoraireResponse.text();
      console.log('❌ Erreur création honoraire:', createHonoraireResponse.status, error);
    }

    // Test 5: Création dépense avec validation
    console.log('\n5. Test création dépense...');
    const createDepenseResponse = await fetch(`${API_BASE}/contentieux/depenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        affaireId: 'b0bfcc10-bfcf-4ea2-ae67-f57af038bfbe',
        date: '2026-02-20',
        typeDepense: 'FRAIS_GREFFE',
        nature: 'Enregistrement',
        montant: 75,
        description: 'Test dépense via script',
        justificatif: 'Reçu greffe n°456'
      })
    });

    if (createDepenseResponse.ok) {
      const depense = await createDepenseResponse.json();
      console.log('✅ Dépense créée:', depense.id);
    } else {
      const error = await createDepenseResponse.text();
      console.log('❌ Erreur création dépense:', createDepenseResponse.status, error);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter les tests si le serveur est démarré
testAPI();