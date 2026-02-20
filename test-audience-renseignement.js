// Script de test pour vérifier le renseignement d'audience
// À exécuter dans la console du navigateur

console.log('🔍 Test de renseignement d\'audience...');

// 1. Vérifier les audiences disponibles
console.log('📋 Audiences dans la base de données:');
fetch('http://localhost:3001/api/contentieux/audiences', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('nestjs_token')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Audiences récupérées:', data);
  
  if (data.data && data.data.length > 0) {
    const audiencesPourRenseignement = data.data.filter(a => a.statut === 'PASSEE_NON_RENSEIGNEE');
    console.log(`✅ ${audiencesPourRenseignement.length} audience(s) peuvent être renseignée(s)`);
    
    audiencesPourRenseignement.forEach((audience, index) => {
      console.log(`${index + 1}. ID: ${audience.id}`);
      console.log(`   Affaire: ${audience.affaire?.reference || 'N/A'}`);
      console.log(`   Date: ${new Date(audience.date).toLocaleDateString('fr-FR')}`);
      console.log(`   Statut: ${audience.statut}`);
      console.log(`   URL: http://localhost:8081/contentieux/audiences/${audience.id}`);
    });
    
    if (audiencesPourRenseignement.length > 0) {
      const testAudience = audiencesPourRenseignement[0];
      console.log(`\n🧪 Test de création de résultat pour l'audience: ${testAudience.id}`);
      
      // Test de création d'un résultat
      fetch(`http://localhost:3001/api/contentieux/audiences/${testAudience.id}/resultat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nestjs_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'DELIBERE',
          texteDelibere: 'Test de délibéré via script de test'
        })
      })
      .then(response => {
        console.log(`Status de la réponse: ${response.status}`);
        return response.json();
      })
      .then(result => {
        if (result.id) {
          console.log('✅ Résultat créé avec succès:', result);
          
          // Nettoyage - supprimer le résultat de test
          fetch(`http://localhost:3001/api/contentieux/audiences/${testAudience.id}/resultat`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('nestjs_token')}`,
              'Content-Type': 'application/json'
            }
          })
          .then(() => {
            console.log('🧹 Résultat de test supprimé');
          });
        } else {
          console.log('❌ Erreur lors de la création:', result);
        }
      })
      .catch(error => {
        console.error('❌ Erreur API:', error);
      });
    }
  } else {
    console.log('❌ Aucune audience trouvée');
  }
})
.catch(error => {
  console.error('❌ Erreur lors de la récupération des audiences:', error);
});

// 2. Vérifier l'état de l'authentification
console.log('\n🔐 État de l\'authentification:');
console.log('Token présent:', !!localStorage.getItem('nestjs_token'));
console.log('Token:', localStorage.getItem('nestjs_token')?.substring(0, 20) + '...');