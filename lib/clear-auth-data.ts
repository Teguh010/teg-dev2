/**
 * Centralized function to clear all authentication-related data
 * This ensures consistent cleanup across the entire application
 */
export const clearAllAuthData = () => {
  if (typeof window === 'undefined') return;
  
  console.log('🧹 clearAllAuthData: Starting cleanup...');
  console.log('🧹 localStorage BEFORE clear:', Object.keys(localStorage));
  
  // Clear all role-specific user data
  localStorage.removeItem('userData-client');
  localStorage.removeItem('userData-manager');
  localStorage.removeItem('userData-developer');
  
  // Clear all cookies
  document.cookie = "userData-client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "userData-manager=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "userData-developer=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  
  // Clear common data
  localStorage.removeItem('current-role');
  localStorage.removeItem('is-manager-token');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  
  // Clear app-specific data
  localStorage.removeItem('manager-selected-customer');
  localStorage.removeItem('selected-vehicle');
  
  // Clear all translation cache keys
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('translations_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('🧹 localStorage AFTER clear:', Object.keys(localStorage));
  console.log('🧹 clearAllAuthData: Cleanup complete!');
};
