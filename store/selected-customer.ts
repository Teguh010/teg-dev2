import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectedCustomerStore {
  selectedCustomerId: number | null;
  selectedCustomerName: string | null;
  customers: Array<{ id: number; name: string }>;
  setSelectedCustomer: (id: number | null, name: string | null) => void;
  clearSelectedCustomer: () => void;
  setCustomers: (customers: Array<{ id: number; name: string }>) => void;
}

export const useSelectedCustomerStore = create(
  persist<SelectedCustomerStore>(
    (set) => ({
      selectedCustomerId: null,
      selectedCustomerName: null,
      customers: [],
      setSelectedCustomer: (id, name) => set({ 
        selectedCustomerId: id,
        selectedCustomerName: name
      }),
      clearSelectedCustomer: () => set({ 
        selectedCustomerId: null,
        selectedCustomerName: null
      }),
      setCustomers: (customers) => set({ customers }),
    }),
    {
      name: 'manager-selected-customer', // localStorage key
    }
  )
);
