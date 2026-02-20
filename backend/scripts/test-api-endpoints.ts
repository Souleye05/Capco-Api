import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testApiEndpoints() {
  try {
    console.log('🔍 Testing API endpoints...\n');

    // 1. Test getting audiences
    console.log('1. Testing GET /contentieux/audiences');
    const audiencesResponse = await axios.get(`${API_BASE}/contentieux/audiences`);
    console.log('✅ Audiences retrieved:', audiencesResponse.data.data?.length || 0);

    // Find an audience with PASSEE_NON_RENSEIGNEE status
    const audiences = audiencesResponse.data.data || [];
    const audienceToTest = audiences.find((a: any) => a.statut === 'PASSEE_NON_RENSEIGNEE');

    if (!audienceToTest) {
      console.log('❌ No audience with PASSEE_NON_RENSEIGNEE status found for testing');
      return;
    }

    console.log('✅ Found test audience:', audienceToTest.id);

    // 2. Test creating a result
    console.log('\n2. Testing POST /contentieux/audiences/:id/resultat');
    const resultData = {
      type: 'RENVOI',
      nouvelleDate: '2026-03-15',
      motifRenvoi: 'Test API - Demande de report'
    };

    const createResultResponse = await axios.post(
      `${API_BASE}/contentieux/audiences/${audienceToTest.id}/resultat`,
      resultData
    );
    console.log('✅ Result created:', createResultResponse.data);

    // 3. Test getting the audience with result
    console.log('\n3. Testing GET /contentieux/audiences/:id');
    const audienceDetailResponse = await axios.get(
      `${API_BASE}/contentieux/audiences/${audienceToTest.id}`
    );
    console.log('✅ Audience with result:', {
      id: audienceDetailResponse.data.id,
      statut: audienceDetailResponse.data.statut,
      hasResult: !!audienceDetailResponse.data.resultat
    });

    console.log('\n✅ All API endpoints working correctly!');

  } catch (error: any) {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testApiEndpoints();