'use client'

import { useTranslationApi } from '@/app/hooks/useTranslationApi';
import initTranslations from '@/app/i18n';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import LayoutLoader from "@/components/layout-loader";


interface TranslationProviderProps {
  children: React.ReactNode;
  locale: string;
  namespaces: string[];
}

export default function TranslationProvider({
  children,
  locale,
  namespaces
}: TranslationProviderProps) {
  const [instance, setInstance] = useState<any>(null);
  const { translations, isLoading } = useTranslationApi(locale);

  useEffect(() => {
    if (!isLoading) {
      const resources = {
        [locale]: {
          translation: translations
        }
      };

      initTranslations(locale, namespaces, undefined, resources)
        .then(({ i18n }) => setInstance(i18n));
    }
  }, [locale, namespaces, translations, isLoading]);

  if (!instance || isLoading) {
    return <LayoutLoader loadingText="Loading..." />;
  }

  return (
    <I18nextProvider i18n={instance}>
      {children}
    </I18nextProvider>
  );
}