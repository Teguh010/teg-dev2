import React from 'react';
import TranslationProvider from '@/app/[locale]/TranslationProvider';
import ManagerMainLayout from "./main-layout";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

const i18nNamespaces = ['translation'];

async function ManagerLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  return (
    <TranslationProvider locale={locale} namespaces={i18nNamespaces}>
      <ManagerMainLayout>{children}</ManagerMainLayout>
    </TranslationProvider>
  );
}

export default ManagerLayout;