'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import store from '@/redux/store'; // Pastikan path menuju file store benar
import TanstackProvider from '@/provider/providers.client'; // Client-side TanstackProvider
import AuthProvider from '@/provider/auth.provider'; // Client-side AuthProvider
import Providers from '@/provider/providers';
import { MaintenanceProvider } from '@/context/MaintenanceContext';

interface ClientProvidersProps {
  children: ReactNode
}

const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <TanstackProvider>
          <Providers>
            <MaintenanceProvider>
              {children}
            </MaintenanceProvider>
          </Providers>
        </TanstackProvider>
      </AuthProvider>
    </Provider>
  );
};

export default ClientProviders;
