'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

const DeveloperAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { models: { user } } = useUser();

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('userData-developer');
      if (!userData) {
        router.replace('/developer/login');
        return;
      }

      try {
        const parsedData = JSON.parse(userData);
        if (!parsedData.token) {
          router.replace('/developer/login');
        }
      } catch (error) {
        console.error('Developer auth check error:', error);
        router.replace('/developer/login');
      }
    };

    checkAuth();
  }, [router, user]);

  return <>{children}</>;
};

export default DeveloperAuthProvider;


