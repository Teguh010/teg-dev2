import React from 'react';
import TranslationProvider from '@/app/[locale]/TranslationProvider';
import MainLayout from "./main-layout";

const i18nNamespaces = ['translation'];

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  return (
    <TranslationProvider locale={resolvedParams.locale} namespaces={i18nNamespaces}>
      <MainLayout>{children}</MainLayout>
    </TranslationProvider>
  );
}
