const http = require('http');

// Test du nouveau endpoint de test
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/immobilier/test-depenses?immeubleId=a8c3dd72-d12f-4c8b-94ba-1001e244dd8c',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();