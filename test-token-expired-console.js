// Test script untuk token expired - jalankan di browser console
// Pastikan Anda berada di halaman manager dashboard

console.log('🚀 Starting Token Expired Test...');

// Token expired yang Anda berikan
const EXPIRED_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNzU2MzYxMDg0LCJqdGkiOiJjN2JjZDMxNS1lNmJjLTQ1NTItODlmNS0xZTU3MDVlNGNkMjAiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiZmU4NmMxYjAtMzY0ZS00ZWI0LTg3MmQtZmM0ZWNjYmQwODM1IiwiZXhwIjoxNzU2MzYxNTI0fQ.9GZfVVjB27QUjUjBrkeuQeMaD7pCdMG3yFOL46dkeEk";

// Step 1: Backup current token
const currentUserData = JSON.parse(localStorage.getItem('userData-manager') || '{}');
const originalToken = currentUserData.token;

console.log('📋 Step 1: Current token backed up');
console.log('🔍 Original token:', originalToken ? 'Found' : 'Not found');

// Step 2: Set expired token
const updatedUserData = {
  ...currentUserData,
  token: EXPIRED_TOKEN
};
localStorage.setItem('userData-manager', JSON.stringify(updatedUserData));

console.log('✅ Step 2: Expired token set');
console.log('🔍 New token:', EXPIRED_TOKEN);

// Step 3: Verify token is expired
try {
  const payload = JSON.parse(atob(EXPIRED_TOKEN.split('.')[1]));
  const exp = payload.exp;
  const now = Math.floor(Date.now() / 1000);
  const expired = now > exp;
  
  console.log('🔍 Step 3: Token verification');
  console.log('- Expires at:', new Date(exp * 1000).toLocaleString());
  console.log('- Current time:', new Date(now * 1000).toLocaleString());
  console.log('- Is expired:', expired);
  console.log('- Time until expiry:', exp - now, 'seconds');
} catch (error) {
  console.error('❌ Error parsing token:', error);
}

// Step 4: Test instructions
console.log('📋 Step 4: Test Instructions');
console.log('1. Now try to select a customer from the dropdown');
console.log('2. You should see "Session expired. Please login again." toast');
console.log('3. After 1 second, you should be redirected to login page');
console.log('4. If test fails, check browser console for errors');

// Step 5: Restore function
window.restoreOriginalToken = function() {
  if (originalToken) {
    const restoreData = {
      ...currentUserData,
      token: originalToken
    };
    localStorage.setItem('userData-manager', JSON.stringify(restoreData));
    console.log('✅ Original token restored');
  } else {
    console.log('⚠️ No original token to restore');
  }
};

console.log('🛠️ Available commands:');
console.log('- restoreOriginalToken() : Restore original token');
console.log('🎯 Ready to test! Try selecting a customer now.');
