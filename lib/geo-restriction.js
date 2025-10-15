export async function isLocationAllowed() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const countryCode = data.country_code;
    
    const blockedCountries = [
      'SG', // Singapore
      'CN'  // China
    ];
    
    const isAllowed = !blockedCountries.includes(countryCode);
    
    return isAllowed;
  } catch (error) {
    console.error('Error checking location:', error);
    return false;
  }
}
