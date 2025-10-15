'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

const ManagerAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { models: { user } } = useUser();

  useEffect(() => {
    const checkAuth = () => {
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
        console.error('Auth check error:', error);
        router.replace('/auth/manager-login');
      }
    };

    checkAuth();
  }, [router, user]);

  // Render children only if authenticated as manager
  if (!user?.token || user.role !== 'manager') {
    return null;
  }

  return <>{children}</>;
};

export default ManagerAuthProvider;
