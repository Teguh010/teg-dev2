
"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { firstUpperLetter } from "@/lib/utils";

export const controller = () => {
  const [loading, setLoading] = useState(true);
  const { i18n, t } = useTranslation();
  const currentLocale = i18n.language;
  const router = useRouter();
  const pathname = usePathname();
  
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;

  // Skip auth check for login page
  if (pathname.includes('/manager/login')) {
    return {
      models: {
        user: null,
        loading: false,
        settings: null
      },
      operations: {
        getUserRef
      }
    };
  }

  // Check if user is authenticated and has manager role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = getUserRef();
        
        if (!currentUser?.token) {
          router.push(`/${currentLocale}/manager/login`);
          return;
        }

        // If user is not a manager, redirect to home
        if (currentUser?.role !== 'manager') {
          toast.error(firstUpperLetter(t("error.access_denied")));
          router.push(`/${currentLocale}`);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push(`/${currentLocale}/manager`);
      }
    };

    checkAuth();
  }, [currentLocale, router, getUserRef, t]);

  return {
    models: {
      user,
      loading,
      settings
    },
    operations: {
      getUserRef
    }
  };
};
