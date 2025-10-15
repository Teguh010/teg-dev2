"use client";
import { apiRequest } from "./common";

interface Translation {
  key: string;
  val: string;
}

interface TranslationResponse {
  result: boolean | string[] | Translation[];
}

export const translationList = async (
  token: string | null, 
  languageCode: string,
  translationGroupId?: number
) => {
  const params: { language_code: string; translation_group_id?: number } = {
    language_code: languageCode,
  };

  // Add translation_group_id if provided (for developer context)
  if (translationGroupId !== undefined) {
    params.translation_group_id = translationGroupId;
  }

  try {
    // Determine API base by current path
    const isBrowser = typeof window !== 'undefined';
    const isDeveloperContext = isBrowser && window.location.pathname.includes('/developer');
    const isManagerContext = isBrowser && window.location.pathname.includes('/manager');
    
    // Choose token and API endpoint: /dev for developer, /manager for manager, else /client
    const tokenSource = isDeveloperContext ? "developer" : (isManagerContext ? "manager" : "client");
    const apiEndpoint = isDeveloperContext ? "dev" : "default";
    
    const result: string = await apiRequest(token, "translation.list", params, { tokenSource, apiEndpoint });
    const data = JSON.parse(result);

    if (Array.isArray(data)) {
      return data; 
    } else {
      throw new Error('Invalid response format: expected array of translations');
    }
  } catch (error) {
    console.error('Error fetching translation list:', error);
    throw error;
  }
};

export const translationListForWebUse = async (token: string | null, languageCode: string) => {
  const params = {
    language_code: languageCode,
  };

  try {
    // Determine API base by current path (same rule as translationList)
    const isBrowser = typeof window !== 'undefined';
    const isDeveloperContext = isBrowser && window.location.pathname.includes('/developer');
    const isManagerContext = isBrowser && window.location.pathname.includes('/manager');
    
    const tokenSource = isDeveloperContext ? "developer" : (isManagerContext ? "manager" : "client");
    const apiEndpoint = isDeveloperContext ? "dev" : "default";
    
    const result: string = await apiRequest(token, "translation.list", params, { tokenSource, apiEndpoint });
    const data = JSON.parse(result);

    if (Array.isArray(data)) {
      return data;
    } else {
      throw new Error('Invalid response format: expected array of translations');
    }
  } catch (error) {
    console.error('Error fetching translation list:', error);
    throw error;
  }
};

export const translationLanguagesList = async (token: string | null) => {
  try {
    // Use developer token and dev API for developer translations pages
    const tokenSource = "developer" as const;
    
    const result: string = await apiRequest(token, "translation.languages_list", {}, { tokenSource, apiEndpoint: "dev" });
    const data: TranslationResponse = JSON.parse(result);

    if (Array.isArray(data.result)) {
      return data.result as string[];
    } else {
      throw new Error('Invalid response format: expected array of strings');
    }
  } catch (error) {
    console.error('Error fetching languages list:', error);
    throw error;
  }
};

export const translationSetSingle = async (
  token: string | null,
  languageCode: string,
  translationKey: string,
  translationValue: string,
  translationGroupId: number
) => {
  const params = {
    translation_group_id: translationGroupId,
    language_code: languageCode,
    translation_key: translationKey,
    translation: translationValue,
  };

  try {
    // Use developer token and dev API for developer translations pages
    const tokenSource = "developer" as const;
    
    const result: string = await apiRequest(token, "translation.set", params, { tokenSource, apiEndpoint: "dev" });
    const data: TranslationResponse = JSON.parse(result);
    return data.result as boolean;
  } catch (error) {
    console.error('Error setting single translation:', error);
    throw error;
  }
};

export const translationSetBulk = async (
  token: string | null,
  languageCode: string,
  translations: { k: string; t: string }[],
  translationGroupId: number
) => {
  const params = {
    translation_group_id: translationGroupId,
    language_code: languageCode,
    translation: translations,
  };

  try {
    // Use developer token and dev API for developer translations pages
    const tokenSource = "developer" as const;
    
    const result: string = await apiRequest(token, "translation.set_bulk", params, { tokenSource, apiEndpoint: "dev" });
    const data: TranslationResponse = JSON.parse(result);
    return data.result === true;
  } catch (error) {
    console.error('Error setting bulk translations:', error);
    throw error;
  }
};

export const getTranslationsFromAPI = async (token: string | null, languageCode: string, translationGroupId: number = 1) => {
  try {
    const translationsArray = await translationList(token, languageCode, translationGroupId);    
    const resources = translationsArray.reduce((acc, { key, val }) => {
      const [namespace, ...keyParts] = key.split('.');
      const nestedKey = keyParts.join('.');

      const finalNamespace = namespace || 'translation';
      
      if (!acc[finalNamespace]) {
        acc[finalNamespace] = {};
      }
      
      if (!nestedKey) {
        acc[finalNamespace] = val;
      } else {
        const keys = nestedKey.split('.');
        let currentLevel = acc[finalNamespace];
        
        keys.forEach((k, index) => {
          if (index === keys.length - 1) {
            currentLevel[k] = val;
          } else {
            currentLevel[k] = currentLevel[k] || {};
            currentLevel = currentLevel[k];
          }
        });
      }
      
      return acc;
    }, {});

    return resources;

  } catch (error) {
    console.error('Error processing translations:', error);
    throw error;
  }
}; 