'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LayoutLoader from '@/components/layout-loader';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

const ClientAccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { operations } = useUser();
  const { setUser } = operations;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupClientAccess = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        
        if (!accessToken) {
          toast.error('No access token provided');
          router.push('/');
          return;
        }
        
        const decoded = jwtDecode(accessToken);
        const expTime = decoded.exp ? decoded.exp * 1000 : null;
        
        if (expTime) {
          const currentTime = Date.now();
          const timeUntilExpiration = expTime - currentTime;
          const expirationMinutes = Math.floor(timeUntilExpiration / 60000);
          
          // Set user data
          const userData = {
            token: accessToken,
            role: 'user' as 'user'
          };
          
          setUser(userData);
          localStorage.setItem('userData-client', JSON.stringify(userData));
          localStorage.setItem('current-role', 'user');
          
          localStorage.setItem('is-manager-token', 'true');
          
         console.warn(`This session will expire in ${expirationMinutes} minutes.`);
          
          router.push('/map');
        } else {
          toast.error('Invalid token');
          router.push('/');
        }
      } catch (error) {
        console.error('Error setting up client access:', error);
        toast.error('Failed to set up client access');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    setupClientAccess();
  }, [router, searchParams, setUser]);
  
  return isLoading ? <LayoutLoader /> : null;
};

export default function ClientAccess() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <ClientAccessContent />
    </Suspense>
  );
}
