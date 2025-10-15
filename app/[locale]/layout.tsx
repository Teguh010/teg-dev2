import { siteConfig } from "@/config/site";
import ClientProviders from '@/provider/client-providers';
import i18nConfig from '@/app/i18nConfig';
import { Inter } from "next/font/google";
import "./assets/scss/globals.scss";
import "./assets/scss/theme.scss";
import "flatpickr/dist/themes/light.css";
import "simplebar-react/dist/simplebar.min.css";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  return (
    <html lang={locale} className="light" suppressHydrationWarning>
      <body 
        className={`dash-tail-app ${inter.className} theme-${siteConfig.theme}`}
        style={{ ['--radius' as any]: `${siteConfig.radius}rem` }}
        suppressHydrationWarning
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
