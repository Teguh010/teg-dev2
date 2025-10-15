"use client";
import { useEffect, useState } from 'react';
import LayoutLoader from "@/components/layout-loader";
import { usePathname, useRouter } from 'next/navigation';
import { enforceExclusivity } from '@/lib/session';

const withDevAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const [userData, setUserData] = useState(null);
        const [isLoading, setIsLoading] = useState(true);
        const pathname = usePathname();
        const router = useRouter();

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

            const isDeveloperPath = pathname.includes('/developer');
            const storageKey = 'userData-developer';

            const storedUserData = JSON.parse(localStorage.getItem(storageKey) || 'null');

            if (storedUserData?.token && !isTokenValid(storedUserData.token)) {
                console.warn('Token has expired, clearing data');
                localStorage.removeItem(storageKey);
                setUserData(null);
                router.push("/developer/login");
                setIsLoading(false);
                return;
            }

            setUserData(storedUserData);

            if (isDeveloperPath && !pathname.includes('/developer/login')) {
                if (!storedUserData?.token) {
                    router.push("/developer/login");
                    setIsLoading(false);
                    return;
                }
            }

            setIsLoading(false);
        }, [pathname, router]);

        if (pathname.includes('/developer/login')) {
            return <WrappedComponent {...props} />;
        }

        if (isLoading || !userData) {
            return <LayoutLoader />;
        }

        return userData?.token ? <WrappedComponent {...props} /> : <LayoutLoader />;
    };

    if (WrappedComponent.getInitialProps) {
        Wrapper.getInitialProps = WrappedComponent.getInitialProps;
    }

    return Wrapper;
};

export default withDevAuth;


