
"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from "react-i18next";
import i18nConfig from '@/app/i18nConfig';

export const controller = () => {
  const [loading, setLoading] = useState(false);
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const router = useRouter();
  const currentPathname = usePathname();
  const UserContext = useUser();
  const { settings } = UserContext.models;
  const settingsLocale = settings.find((setting: { title: string; }) => setting.title === "language")?.value;
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      const fetchData = async () => {
        try {
          if (!hasRedirected && currentLocale !== settingsLocale) {
            const isDefaultLocale = currentLocale === i18nConfig.defaultLocale;
            const newPathname = isDefaultLocale
              ? `/${settingsLocale}${currentPathname}`
              : currentPathname.replace(`/${currentLocale}`, `/${settingsLocale}`);
            setHasRedirected(true); // Marcar como redirigido
            router.push(newPathname);
            router.refresh();
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      };

      if (!hasRedirected) {
        fetchData();
      } else {
        setLoading(false);
      }
    }
  }, [settings]);

  return {
    models: {
      loading,
    },
  };
};
