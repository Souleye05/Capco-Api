// Simple script to test UUID validation and API calls
// Run this in the browser console to debug the issue

console.log('🔍 Debugging UUID validation error...');

// Test UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Test with known audience IDs from database
const testIds = [
  '065785e9-6b9e-4b0b-9256-f8fa9014bad2', // Valid UUID from our test
  '301dc0f7-773a-476c-bf0b-55b28a458c09', // Another valid UUID
  'invalid-id', // Invalid UUID
  '', // Empty string
  undefined, // Undefined
];

console.log('Testing UUID validation:');
testIds.forEach(id => {
  const isValid = id && uuidRegex.test(id);
  console.log(`${id || 'undefined'}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

// Test API call with valid UUID
const validId = '065785e9-6b9e-4b0b-9256-f8fa9014bad2';
console.log(`\n🧪 Testing API call with valid UUID: ${validId}`);

// You can run this in the browser console when on the frontend
if (typeof fetch !== 'undefined') {
  fetch(`http://localhost:3001/api/contentieux/audiences/${validId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('nestjs_token')}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log(`API Response Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('API Response Data:', data);
  })
  .catch(error => {
    console.error('API Error:', error);
  });
}

// Check current URL and extract ID
if (typeof window !== 'undefined') {
  const currentUrl = window.location.href;
  const urlParts = currentUrl.split('/');
  const idFromUrl = urlParts[urlParts.length - 1];
  
  console.log(`\n🌐 Current URL: ${currentUrl}`);
  console.log(`📋 ID from URL: ${idFromUrl}`);
  console.log(`✅ Is valid UUID: ${idFromUrl && uuidRegex.test(idFromUrl)}`);
}