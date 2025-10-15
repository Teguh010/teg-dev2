"use client";
import { useEffect, useState } from 'react';
import LayoutLoader from "@/components/layout-loader";
import { usePathname, useRouter } from 'next/navigation';
import { enforceExclusivity } from '@/lib/session';

const withAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const [userData, setUserData] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const pathname = usePathname();
        const router = useRouter();

        // Helper function to validate token
        const isTokenValid = (token) => {
            if (!token) return false;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const currentTime = Date.now() / 1000;
                return payload.exp > currentTime;
            } catch (error) {
                console.error('Error validating token:', error);
                return false;
            }
        };

        useEffect(() => {
            // Clean conflicting keys without redirecting
            try { enforceExclusivity(); } catch (_) {}

            // Determine which storage to use based on path and current role
            const isManagerPath = pathname.includes('/manager');
            const currentRole = localStorage.getItem('current-role');
            
            let storageKey = 'userData-client'; // default
            
            if (isManagerPath) {
                storageKey = 'userData-manager';
            } else if (currentRole === 'manager' && !pathname.includes('/manager')) {
                // If current role is manager but we're not on manager path, 
                // check if we have user data available
                const userData = localStorage.getItem('userData-client');
                if (userData) {
                    storageKey = 'userData-client';
                } else {
                    storageKey = 'userData-manager';
                }
            }
            
            const storedUserData = JSON.parse(localStorage.getItem(storageKey) || 'null');
            
            // Validate token before using it
            if (storedUserData?.token && !isTokenValid(storedUserData.token)) {
                console.warn('Token has expired, clearing data');
                localStorage.removeItem(storageKey);
                localStorage.removeItem('current-role');
                setUserData(null);
                router.push("/auth-login");
                setIsLoading(false);
                return;
            }
            
            setUserData(storedUserData);

            // Validate role and redirect accordingly
            if (pathname.includes('/manager') && !pathname.includes('/manager/login')) {
                if (!storedUserData?.token || storedUserData?.role !== 'manager') {
                    router.push("/manager/login");
                    setIsLoading(false);
                    return;
                }
            } else if (!pathname.includes('/manager/login') && !pathname.includes('/login')) {
                if (!storedUserData?.token) {
                    router.push("/");
                    setIsLoading(false);
                    return;
                }
                // If we're on user path but have manager data, redirect to manager
                if (storedUserData?.role === 'manager' && !pathname.includes('/manager')) {
                    router.push("/manager/dashboard");
                    setIsLoading(false);
                    return;
                }
            }
            
            setIsLoading(false);
        }, [pathname, router]);

        // Handle login pages
        if (pathname.includes('/manager/login') || pathname.includes('/login')) {
            return <WrappedComponent {...props} />;
        }

        // Show loader while checking authentication
        if (isLoading || !userData) {
            return <LayoutLoader />;
        }

        // Render component if authenticated
        return userData?.token ? <WrappedComponent {...props} /> : <LayoutLoader />;
    };

    if (WrappedComponent.getInitialProps) {
        Wrapper.getInitialProps = WrappedComponent.getInitialProps;
    }

    return Wrapper;
};

export default withAuth;

