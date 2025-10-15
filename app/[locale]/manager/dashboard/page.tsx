'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useSelectedCustomerStore } from '@/store/selected-customer';
import { listCustomers } from '@/models/manager/customers';
import { toast } from 'react-hot-toast';
// import { TokenExpiredTest } from '@/components/debug/TokenExpiredTest';

export default function ManagerDashboard() {
  const { models: { user }, operations: { getUserRef } } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { setCustomers } = useSelectedCustomerStore();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const currentUser = getUserRef();
        if (!currentUser?.token) return;

        const response = await listCustomers(currentUser.token);
        
        if (response?.success) {
          setCustomers(response.data || []);
        } else {
          console.error("Failed to fetch customers:", response?.message);
          toast.error("Failed to fetch customers");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Error fetching customers");
      }
    };

    const timer = setTimeout(() => {
      setIsLoading(false);
      if (user?.token) {
        fetchCustomers();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'manager')) {
      router.push('/manager');
    }
  }, [user, router, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Manager Dashboard</h1>
      
      {/* <div className="mb-8">
        <TokenExpiredTest />
      </div>
       */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-3xl font-bold mt-2">150</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Active Vehicles</h3>
          <p className="text-3xl font-bold mt-2">75</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Total Routes</h3>
          <p className="text-3xl font-bold mt-2">324</p>
        </Card>
      </div>
    </div>
  );
}
