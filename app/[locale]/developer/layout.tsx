import React from 'react';
import TranslationProvider from '@/app/[locale]/TranslationProvider';
import type { ReactNode } from "react";
import DeveloperMainLayout from '@/app/[locale]/developer/main-layout';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

const i18nNamespaces = ['translation'];

async function DeveloperLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  return (
    <TranslationProvider locale={locale} namespaces={i18nNamespaces}>
      <DeveloperMainLayout>{children}</DeveloperMainLayout>
    </TranslationProvider>
  );
}

export default DeveloperLayout;


