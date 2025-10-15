'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

export function useManagerAuth() {
  const router = useRouter();
  const { models: { user } } = useUser();

  useEffect(() => {
    const checkManagerAuth = () => {
      const userData = localStorage.getItem('userData-manager');
      if (!userData) {
        router.replace('/auth/manager-login');
        return;
      }

      try {
        const parsedData = JSON.parse(userData);
        if (!parsedData.token || parsedData.role !== 'manager') {
          router.replace('/auth/manager-login');
        }
      } catch (error) {
        console.error('Manager auth check error:', error);
        router.replace('/auth/manager-login');
      }
    };

    checkManagerAuth();
  }, [router, user]);

  return user;
}
