// contexts/MaintenanceContext/MaintenanceContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface MaintenanceContextProps {
  isMaintenanceMode: boolean;
  statusCode: number | null;
  setMaintenanceMode: (isOpen: boolean, code?: number | null) => void;
}

const MaintenanceContext = createContext<MaintenanceContextProps | undefined>(undefined);

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};

// Utility to allow non-component functions to set the maintenance mode with status code
let setMaintenanceModeGlobal: (isOpen: boolean, code?: number | null) => void;

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMaintenanceMode, setMaintenanceMode] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  // Assign global setter
  setMaintenanceModeGlobal = (isOpen: boolean, code: number | null = null) => {
    setMaintenanceMode(isOpen);
    setStatusCode(code);
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, statusCode, setMaintenanceMode }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

// Function to set maintenance mode globally with status code
export const setMaintenanceModeExternally = (code: number | null, isOpen: boolean) => {
  if (setMaintenanceModeGlobal) {
    setMaintenanceModeGlobal(isOpen, code);
  }
};
