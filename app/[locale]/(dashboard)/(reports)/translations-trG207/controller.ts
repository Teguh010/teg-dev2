"use client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { showConfirmation } from '@/components/CustomConfirmation';
import {
  translationList,
  translationSetBulk
} from "@/models/translation";

interface Translation {
  key: string;
  value: string;
  category: string;
  isNew?: boolean;
}

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [translationInputs, setTranslationInputs] = useState([{ key: '', value: '', category: '' }]);
  const [referenceLanguage, setReferenceLanguageState] = useState('en');
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedTranslations, setUploadedTranslations] = useState<{ k: string; t: string }[]>([]);
  // For client translations, default to group 1 (Client Web)
  const translationGroupId = 1;
  
  // Track previous values to prevent unnecessary refetches
  const prevTokenRef = useRef<string | null>(null);
  const prevLanguageRef = useRef<string>('en');
  const prevUsernameRef = useRef<string | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  // Fetch translations
  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoading(true);
      try {
        const result = await translationList(user?.token || null, currentLanguage, translationGroupId);

        const formattedTranslations = result.map(t => ({
          key: t.key,
          value: t.val, 
          category: extractCategory(t.key),
        }));

        setTranslations(formattedTranslations);
      } catch (error) {
        console.error("Error fetching translations:", error);
        toast.error(t('translation_page.error_fetching_translations'));
        setTranslations([]); 
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a valid user and token
    if (user?.token && user?.username) {
      const shouldFetch = 
        // Initial load
        !hasInitializedRef.current ||
        // Language changed
        prevLanguageRef.current !== currentLanguage ||
        // Username changed (different user login)
        prevUsernameRef.current !== user.username;

      if (shouldFetch) {
        fetchTranslations();
        hasInitializedRef.current = true;
        prevTokenRef.current = user.token;
        prevLanguageRef.current = currentLanguage;
        prevUsernameRef.current = user.username;
      } else {
        // Just update the token reference without refetching
        prevTokenRef.current = user.token;
      }
    }
  }, [user?.token, user?.username, currentLanguage]);

  // Buat fungsi refetch yang bisa digunakan ulang
  const refetchTranslations = async () => {
    setIsLoading(true);
    try {
      // Get the latest token from UserContext
      const latestUser = UserContext.operations.getUserRef();
      const result = await translationList(latestUser?.token || null, currentLanguage, translationGroupId);

      const formattedTranslations = result.map(t => ({
        key: t.key,
        value: t.val, 
        category: extractCategory(t.key),
      }));

      setTranslations(formattedTranslations);
      // Update token reference after successful fetch
      if (latestUser?.token) {
        prevTokenRef.current = latestUser.token;
      }
    } catch (error) {
      console.error("Error fetching translations:", error);
      toast.error(t('translation_page.error_fetching_translations'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateTranslation = async (translations: Translation | Translation[]) => {
    try {
      const formattedTranslations = (Array.isArray(translations) ? translations : [translations]).map(t => ({
        k: t.key,
        t: t.value,
      }));

      // Get the latest token from UserContext
      const latestUser = UserContext.operations.getUserRef();
      const result = await translationSetBulk(latestUser?.token || null, currentLanguage, formattedTranslations, translationGroupId);
      
      if (result === true || result === false) {
        toast.success(t('translation_page.translation_updated_successfully'));
        // Refetch setelah update berhasil
        await refetchTranslations();
      } else {
        throw new Error('Failed to update translation');
      }
    } catch (error) {
      console.error("Error updating translation:", error);
      toast.error(t('translation_page.error_updating_translation'));
    }
  };

  const addInputField = () => {
    setTranslationInputs(prev => [...prev, { key: '', value: '', category: '' }]);
  };

  const removeInputField = (index: number) => {
    setTranslationInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (index: number, field: 'key' | 'value', value: string) => {
    setTranslationInputs(prev => 
      prev.map((input, i) => 
        i === index ? { ...input, [field]: value } : input
      )
    );
  };

  const addTranslations = async () => {
    if (translationInputs.length === 0) {
      toast.error(t('translation_page.at_least_one_translation_required'));
      return;
    }

    for (const input of translationInputs) {
      if (!input.key.trim() || !input.value.trim()) {
        toast.error(t('translation_page.translation_key_value_required'));
        return;
      }
      if (translations.find(t => t.key === input.key)) {
        toast.error(t('translation_page.translation_key_exists', { key: input.key }));
        return;
      }
    }

    const newTranslations = translationInputs.map(input => ({
      k: input.key,
      t: input.value, 
    }));

    try {
      // Get the latest token from UserContext
      const latestUser = UserContext.operations.getUserRef();
      const result = await translationSetBulk(latestUser?.token || null, currentLanguage, newTranslations, translationGroupId);

      if (result === true || result === false) {
        setTranslationInputs([{ key: '', value: '', category: '' }]);
        toast.success(t('translation_page.translation_added_successfully'));
        await refetchTranslations();
      } else {
        throw new Error('Failed to save translations');
      }
    } catch (error) {
      console.error("Error saving translations:", error);
      toast.error(t('translation_page.error_saving_translations'));
    }
  };

  const deleteTranslation = async (key: string) => {
    showConfirmation(t('translation_page.confirm_delete_translation', { key }), async () => {
      try {
        const response = await fetch('/api/translation/translations', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            key,
            language: currentLanguage
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete translation');
        }

        setTranslations(prev => prev.filter(t => t.key !== key));
        
        toast.success(t('translation_page.translation_deleted_successfully'));
      } catch (error) {
        console.error("Error deleting translation:", error);
        toast.error(t('translation_page.error_deleting_translation'));
      }
    });
  };

  const checkMissingKeys = async () => {
    try {
      const response = await fetch(`/api/translation/translations?lang=${referenceLanguage}`);
      if (!response.ok) throw new Error('Failed to fetch reference translations');
      
      const data = await response.json();
      const referenceTranslations = data.translations;

      // Get current language keys
      const currentKeys = translations.map(t => t.key);

      const missing = referenceTranslations.filter(
        t => !currentKeys.includes(t.key)
      );

      setMissingKeys(missing.map(t => t.key));
      
      setTranslationInputs(missing.map(t => ({ key: t.key, value: '', category: '' })));

      if (missing.length === 0) {
        toast.success(t('translation_page.no_missing_keys_found'));
        return;
      }

      toast.success(t('translation_page.missing_keys_checked'));
    } catch (error) {
      console.error("Error checking missing keys:", error);
      toast.error(t('translation_page.error_checking_missing_keys'));
    }
  };

  const setReferenceLanguage = (lang: string) => {
    if (lang === currentLanguage) {
      toast.error(t('translation_page.reference_language_cannot_be_same'));
      return;
    }
    setReferenceLanguageState(lang);
  };

  const extractCategory = (key: string) => {
    const dotParts = key.split('.');
    if (dotParts.length > 1) {
      return dotParts[0]; 
    }

    const underscoreParts = key.split('_');
    if (underscoreParts.length > 1) {
      return underscoreParts[0];
    }

    return ''; 
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      const formattedTranslations: { k: string; t: string }[] = [];
      for (const [category, subcategories] of Object.entries(jsonData)) {
        for (const [subcategory, value] of Object.entries(subcategories as Record<string, string>)) {
          formattedTranslations.push({
            k: `${category}.${subcategory}`, 
            t: value as string, 
          });
        }
      }

      setUploadedTranslations(formattedTranslations);
      toast.success(t('translation_page.file_uploaded_successfully'));
    } catch (error) {
      console.error("Error uploading translations:", error);
      toast.error(t('translation_page.error_uploading_translations'));
    } finally {
      setIsUploading(false); 
    }
  };

  const submitUploadedTranslations = async () => {
    if (uploadedTranslations.length === 0) {
      toast.error(t('translation_page.no_uploaded_translations'));
      return;
    }

    try {
      // Get the latest token from UserContext
      const latestUser = UserContext.operations.getUserRef();
      const result = await translationSetBulk(latestUser?.token || null, currentLanguage, uploadedTranslations, translationGroupId);

      if (result === true || result === false) {
        const newTranslations = uploadedTranslations.map(t => ({
          key: t.k,
          value: t.t,
          category: extractCategory(t.k),
        }));
        setTranslations(prev => [...prev, ...newTranslations]);
        setUploadedTranslations([]); 
        toast.success(t('translation_page.translation_uploaded_successfully'));
      } else {
        throw new Error('Failed to upload translations');
      }
    } catch (error) {
      console.error("Error submitting translations:", error);
      toast.error(t('translation_page.error_submitting_translations'));
    }
  };

  return {
    models: {
      translations,
      currentLanguage,
      availableLanguages: ['en', 'es', 'fr', 'id', 'ru', 'lt', 'no'],
      isLoading,
      translationInputs,
      referenceLanguage,
      missingKeys,
      isUploading,
      uploadedTranslations
    },
    operations: {
      updateTranslation,
      setCurrentLanguage,
      addTranslations,
      addInputField,
      removeInputField,
      handleInputChange,
      deleteTranslation,
      setReferenceLanguage,
      checkMissingKeys,
      handleFileUpload,
      submitUploadedTranslations,
      refetchTranslations
    }
  };
}; 