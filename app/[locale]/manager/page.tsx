'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { isLocationAllowed } from '@/lib/geo-restriction';

export default function ManagerPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const currentLocale = i18n.language;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccessAndRedirect = async () => {
      try {
        const locationAllowed = await isLocationAllowed();
        
        if (!locationAllowed) {
          router.push(`/${currentLocale}`);
          return;
        }
        
        const userData = localStorage.getItem('userData-manager');
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            if (parsedData.token && parsedData.role === 'manager') {
              router.push(`/${currentLocale}/manager/dashboard`);
              return;
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
        
        router.push(`/${currentLocale}/manager/login`);
      } catch (error) {
        console.error('Error checking access:', error);
        router.push(`/${currentLocale}`);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAccessAndRedirect();
  }, [router, currentLocale, t]);

  // Tampilkan loading selama pemeriksaan
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return null;
}
