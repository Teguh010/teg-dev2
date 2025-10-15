'use client';
import { useState, useEffect, useCallback } from 'react';
import { translationList } from '@/models/translation';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';

// Import local translation files as fallback
import enTranslations from '@/locales/en/translation.json';
import ltTranslations from '@/locales/lt/translation.json';
import frTranslations from '@/locales/fr/translation.json';
import esTranslations from '@/locales/es/translation.json';
import noTranslations from '@/locales/no/translation.json';
import ruTranslations from '@/locales/ru/translation.json';
import idTranslations from '@/locales/id/translation.json';


// Global variable to track if translations have been loaded
let translationsLoaded = false;

// Local translation fallback mapping
const localTranslations = {
  en: enTranslations,
  lt: ltTranslations,
  fr: frTranslations,
  es: esTranslations,
  no: noTranslations,
  ru: ruTranslations,
  id: idTranslations,
};

// Helper function to check if translations object is empty or invalid
const isEmptyTranslations = (translations: unknown): boolean => {
  if (!translations || typeof translations !== 'object') {
    return true;
  }
  return Object.keys(translations).length === 0;
};

// Helper function to get local translations as fallback
const getLocalTranslations = (locale: string): Record<string, unknown> => {
  return localTranslations[locale as keyof typeof localTranslations] || localTranslations.en;
};

export const useTranslationApi = (locale: string) => {
  const [translations, setTranslations] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { models, operations } = useUser();
  const { getUserRef } = operations;

  // Determine translation group ID based on path
  const getTranslationGroupId = useCallback(() => {
    if (pathname.includes('/manager')) {
      return 2; // Manager group
    }
    // Developer and client use the same group (group 1)
    return 1; // Client/Developer group
  }, [pathname]);

  const fetchTranslations = useCallback(async () => {
    try {
      // Skip token check for login pages
      const isLoginPage = pathname.includes('/auth/login') || 
                         pathname.includes('/manager/login') || 
                         pathname === '/';
      if (isLoginPage) {
        // Set default translations for login pages
        setTranslations({});
        setIsLoading(false);
        return;
      }

      // Get translation group ID
      const translationGroupId = getTranslationGroupId();

      // Check if translations exist in localStorage (include groupId in cache key)
      const storageKey = `translations_${locale}_group${translationGroupId}`;
      const cachedTranslations = localStorage.getItem(storageKey);
      
      if (cachedTranslations) {
        try {
          const parsedTranslations = JSON.parse(cachedTranslations);
          // Check if cached translations are not empty
          if (!isEmptyTranslations(parsedTranslations)) {
            // Use cached translations if available and not empty
            setTranslations(parsedTranslations);
            setIsLoading(false);
            translationsLoaded = true;
            return;
          } else {
            // If cached translations are empty, remove from localStorage and continue to API
            localStorage.removeItem(storageKey);
            console.warn('Cached translations are empty, falling back to API or local translations');
          }
        } catch {
          // If parsing fails, remove corrupted cache and continue
          localStorage.removeItem(storageKey);
          console.warn('Failed to parse cached translations, falling back to API or local translations');
        }
      }

      // Get the latest token from UserContext
      const currentUser = getUserRef();
      let token = currentUser?.token;

      // If token not in context yet (during initial load), try to get from localStorage
      if (!token) {
        const isManagerPath = pathname.includes('/manager');
        const isDeveloperPath = pathname.includes('/developer');
        
        const storageKey = isManagerPath 
          ? 'userData-manager' 
          : isDeveloperPath 
            ? 'userData-developer' 
            : 'userData-client';
        
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            token = parsed.token;
          } catch {
            console.warn('Failed to parse stored user data for translations');
          }
        }
      }

      if (!token) {
        throw new Error('No authentication token found');
      }

      try {
        // Use the token (from context or localStorage)
        const translationItems = await translationList(token, locale, translationGroupId);
        
        const formattedTranslations = translationItems.reduce((acc, item) => {
          const keys = item.key.split('.');
          let current = acc;
          
          keys.forEach((key, index) => {
            if (index === keys.length - 1) {
              current[key] = item.val;
            } else {
              current[key] = current[key] || {};
              current = current[key];
            }
          });
          
          return acc;
        }, {} as Record<string, unknown>);

        // Check if API returned empty translations
        if (isEmptyTranslations(formattedTranslations)) {
          console.warn('API returned empty translations, falling back to local translations');
          const localFallback = getLocalTranslations(locale);
          setTranslations(localFallback);
          // Don't save empty translations to localStorage
        } else {
          // Save valid translations to localStorage
          localStorage.setItem(storageKey, JSON.stringify(formattedTranslations));
          setTranslations(formattedTranslations);
        }
        
        setError(null);
        translationsLoaded = true;
      } catch (apiError) {
        // If API fails, use local translations as fallback
        console.warn('API translation fetch failed, using local translations as fallback:', apiError);
        const localFallback = getLocalTranslations(locale);
        setTranslations(localFallback);
        setError(null); // Don't show error since we have fallback
        translationsLoaded = true;
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      
      // Use local translations as fallback when everything fails
      console.warn('All translation methods failed, using local translations as final fallback');
      const localFallback = getLocalTranslations(locale);
      setTranslations(localFallback);
      setError(null); // Don't show error since we have fallback
    } finally {
      setIsLoading(false);
    }
  }, [locale, pathname, getUserRef, getTranslationGroupId]);

  // Clear translations cache when locale changes
  const clearTranslationsCache = useCallback(() => {
    const translationGroupId = getTranslationGroupId();
    localStorage.removeItem(`translations_${locale}_group${translationGroupId}`);
    translationsLoaded = false;
  }, [locale, getTranslationGroupId]);

  // Fetch translations only once after login or when translations are not loaded
  useEffect(() => {
    // Only fetch if translations haven't been loaded yet
    if (!translationsLoaded) {
      fetchTranslations();
    } else {
      // If translations are already loaded, just get them from localStorage
      const translationGroupId = getTranslationGroupId();
      const storageKey = `translations_${locale}_group${translationGroupId}`;
      const cachedTranslations = localStorage.getItem(storageKey);
      
      if (cachedTranslations) {
        try {
          const parsedTranslations = JSON.parse(cachedTranslations);
          // Check if cached translations are not empty
          if (!isEmptyTranslations(parsedTranslations)) {
            setTranslations(parsedTranslations);
            setIsLoading(false);
          } else {
            // If cached translations are empty, use local fallback
            console.warn('Cached translations are empty, using local translations');
            const localFallback = getLocalTranslations(locale);
            setTranslations(localFallback);
            setIsLoading(false);
          }
        } catch {
          // If parsing fails, use local fallback
          console.warn('Failed to parse cached translations, using local translations');
          const localFallback = getLocalTranslations(locale);
          setTranslations(localFallback);
          setIsLoading(false);
        }
      } else {
        // If locale changed and no cache for new locale, fetch new translations
        fetchTranslations();
      }
    }
  }, [fetchTranslations, locale, getTranslationGroupId]);

  // Listen for token changes in UserContext
  useEffect(() => {
    // Re-fetch translations when user token changes (login/logout)
    if (models.user?.token && !translationsLoaded) {
      clearTranslationsCache();
      fetchTranslations();
    }
  }, [models.user?.token, fetchTranslations, clearTranslationsCache]);

  return { 
    translations, 
    isLoading, 
    error, 
    refetch: useCallback(() => {
      clearTranslationsCache();
      return fetchTranslations();
    }, [clearTranslationsCache, fetchTranslations]) 
  };
}; 
