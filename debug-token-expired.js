// Debug script untuk test token expired
// Jalankan di browser console ketika di halaman manager

// Token expired yang Anda berikan
const EXPIRED_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNzU2MzYxMDg0LCJqdGkiOiJjN2JjZDMxNS1lNmJjLTQ1NTItODlmNS0xZTU3MDVlNGNkMjAiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiZmU4NmMxYjAtMzY0ZS00ZWI0LTg3MmQtZmM0ZWNjYmQwODM1IiwiZXhwIjoxNzU2MzYxNTI0fQ.9GZfVVjB27QUjUjBrkeuQeMaD7pCdMG3yFOL46dkeEk";

// Fungsi untuk set expired token
function setExpiredToken() {
  // Ambil data user yang ada
  const userData = JSON.parse(localStorage.getItem('userData-manager') || '{}');
  
  // Ganti token dengan token expired
  const updatedUserData = {
    ...userData,
    token: EXPIRED_TOKEN
  };
  
  // Simpan ke localStorage
  localStorage.setItem('userData-manager', JSON.stringify(updatedUserData));
  
  console.log('✅ Token expired telah di-set!');
  console.log('📝 Sekarang coba select customer untuk test error handling');
  
  return updatedUserData;
}

// Fungsi untuk restore token asli (jika ada backup)
function restoreOriginalToken() {
  const userData = JSON.parse(localStorage.getItem('userData-manager') || '{}');
  console.log('🔍 Current token:', userData.token);
  console.log('⚠️  Silakan login ulang untuk mendapatkan token yang valid');
}

// Fungsi untuk check token expiration
function checkTokenExpiration() {
  const userData = JSON.parse(localStorage.getItem('userData-manager') || '{}');
  const token = userData.token;
  
  if (!token) {
    console.log('❌ No token found');
    return;
  }
  
  try {
    // Decode JWT token (hanya payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    
    console.log('🔍 Token Info:');
    console.log('- Expires at:', new Date(exp * 1000).toLocaleString());
    console.log('- Current time:', new Date(now * 1000).toLocaleString());
    console.log('- Is expired:', now > exp);
    console.log('- Time until expiry:', exp - now, 'seconds');
    
    return now > exp;
  } catch (error) {
    console.error('❌ Error parsing token:', error);
    return false;
  }
}

// Export functions untuk digunakan di console
window.setExpiredToken = setExpiredToken;
window.restoreOriginalToken = restoreOriginalToken;
window.checkTokenExpiration = checkTokenExpiration;

console.log('🚀 Debug functions loaded!');
console.log('📋 Available commands:');
console.log('  - setExpiredToken()     : Set expired token for testing');
console.log('  - checkTokenExpiration(): Check if current token is expired');
console.log('  - restoreOriginalToken(): Show current token info');
