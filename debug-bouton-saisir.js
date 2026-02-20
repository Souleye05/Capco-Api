// Script de débogage pour le bouton "Saisir le résultat"
// À exécuter dans la console du navigateur sur la page de détails d'audience

console.log('🔍 Débogage du bouton "Saisir le résultat"...');

// 1. Vérifier l'URL actuelle pour extraire l'ID de l'audience
const currentUrl = window.location.href;
const urlParts = currentUrl.split('/');
const audienceId = urlParts[urlParts.length - 1];

console.log('📋 URL actuelle:', currentUrl);
console.log('🆔 ID de l\'audience:', audienceId);

// 2. Vérifier si l'ID est valide
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = uuidRegex.test(audienceId);
console.log('✅ UUID valide:', isValidUuid);

if (!isValidUuid) {
  console.log('❌ L\'ID de l\'audience n\'est pas un UUID valide');
  console.log('💡 Essayez avec une URL comme: http://localhost:8081/contentieux/audiences/065785e9-6b9e-4b0b-9256-f8fa9014bad2');
} else {
  // 3. Récupérer les détails de l'audience via l'API
  console.log('🔄 Récupération des détails de l\'audience...');
  
  fetch(`http://localhost:3001/api/contentieux/audiences/${audienceId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('nestjs_token')}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Status de la réponse API:', response.status);
    return response.json();
  })
  .then(data => {
    if (data.error) {
      console.log('❌ Erreur API:', data.error);
    } else {
      console.log('✅ Données de l\'audience:', data);
      
      // 4. Analyser les conditions pour le bouton
      const audience = data;
      const canAddResult = audience.statut === 'PASSEE_NON_RENSEIGNEE';
      const hasResult = audience.statut === 'RENSEIGNEE';
      
      console.log('\n📊 Analyse des conditions:');
      console.log('   Statut actuel:', audience.statut);
      console.log('   canAddResult (statut === "PASSEE_NON_RENSEIGNEE"):', canAddResult);
      console.log('   hasResult (statut === "RENSEIGNEE"):', hasResult);
      
      if (canAddResult) {
        console.log('✅ Le bouton DEVRAIT être visible et cliquable');
        
        // 5. Vérifier si les boutons existent dans le DOM
        const buttons = document.querySelectorAll('button');
        const saisirButtons = Array.from(buttons).filter(btn => 
          btn.textContent && btn.textContent.includes('Saisir le résultat')
        );
        
        console.log(`🔍 ${saisirButtons.length} bouton(s) "Saisir le résultat" trouvé(s) dans le DOM`);
        
        saisirButtons.forEach((btn, index) => {
          console.log(`   Bouton ${index + 1}:`, {
            visible: btn.offsetParent !== null,
            disabled: btn.disabled,
            text: btn.textContent.trim(),
            classes: btn.className
          });
        });
        
        if (saisirButtons.length === 0) {
          console.log('❌ Aucun bouton trouvé dans le DOM - problème de rendu React');
        }
      } else {
        console.log('❌ Le bouton ne devrait PAS être visible');
        console.log('💡 Pour que le bouton soit visible, l\'audience doit avoir le statut "PASSEE_NON_RENSEIGNEE"');
        
        if (audience.statut === 'A_VENIR') {
          console.log('ℹ️  Cette audience est à venir. Changez la date pour qu\'elle soit dans le passé.');
        } else if (audience.statut === 'RENSEIGNEE') {
          console.log('ℹ️  Cette audience est déjà renseignée. Le résultat existe déjà.');
        }
      }
      
      // 6. Vérifier s'il y a déjà un résultat
      fetch(`http://localhost:3001/api/contentieux/audiences/${audienceId}/resultat`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nestjs_token')}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.status === 404) {
          console.log('ℹ️  Aucun résultat existant (normal pour une audience non renseignée)');
        } else if (response.ok) {
          return response.json().then(result => {
            console.log('📋 Résultat existant:', result);
          });
        } else {
          console.log('⚠️  Erreur lors de la vérification du résultat:', response.status);
        }
      });
    }
  })
  .catch(error => {
    console.error('❌ Erreur lors de la récupération:', error);
  });
}

// 7. Vérifier l'authentification
console.log('\n🔐 Vérification de l\'authentification:');
const token = localStorage.getItem('nestjs_token');
console.log('Token présent:', !!token);
if (token) {
  console.log('Token (début):', token.substring(0, 20) + '...');
} else {
  console.log('❌ Pas de token - vous devez vous connecter');
}