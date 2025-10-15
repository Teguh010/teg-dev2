"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootRedirectPage() {
  const router = useRouter();

  // Helper function to validate token
  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check both user and manager data to determine which one to use
    const clientData = typeof window !== 'undefined' ? localStorage.getItem('userData-client') : null;
    const managerData = typeof window !== 'undefined' ? localStorage.getItem('userData-manager') : null;
    const currentRole = typeof window !== 'undefined' ? localStorage.getItem('current-role') : null;
    
    let clientParsed = null;
    let managerParsed = null;
    
    try {
      if (clientData) clientParsed = JSON.parse(clientData);
      if (managerData) managerParsed = JSON.parse(managerData);
    } catch (error) {
      console.error('Error parsing stored data:', error);
      router.replace("/auth-login");
      return;
    }
    
    // Validate tokens and clear expired ones
    let hasValidManagerToken = false;
    let hasValidUserToken = false;
    
    if (managerParsed?.token && managerParsed?.role === 'manager') {
      if (isTokenValid(managerParsed.token)) {
        hasValidManagerToken = true;
      } else {
        console.warn('Manager token has expired, clearing data');
        localStorage.removeItem('userData-manager');
      }
    }
    
    if (clientParsed?.token && clientParsed?.role === 'user') {
      if (isTokenValid(clientParsed.token)) {
        hasValidUserToken = true;
      } else {
        console.warn('User token has expired, clearing data');
        localStorage.removeItem('userData-client');
      }
    }
    
    if (hasValidManagerToken && hasValidUserToken) {
      // If we have both valid tokens, use current role to determine which one to use
      if (currentRole === 'manager') {
        router.replace("/manager/dashboard");
      } else {
        router.replace("/map");
      }
    } else if (hasValidManagerToken) {
      // Only manager token available
      router.replace("/manager/dashboard");
    } else if (hasValidUserToken) {
      // Only user token available
      router.replace("/map");
    } else {
      // No valid tokens, redirect to login
      router.replace("/auth-login");
    }
  }, [router]);

  return null;
}
