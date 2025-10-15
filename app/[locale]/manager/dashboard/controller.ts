'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { listCustomers } from '@/models/manager/customers';
import { toast } from 'react-hot-toast';
import { firstUpperLetter } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const useController = () => {
  const { t } = useTranslation();
  const { models: { user }, operations: { getUserRef } } = useUser();
  const [loading, setLoading] = useState(true);
  const [customerList, setCustomerList] = useState([]);

  // Fetch customers on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentUser = getUserRef();
        if (!currentUser?.token) {
          throw new Error("No token available");
        }

        const response = await listCustomers(currentUser.token);
        if (response?.success) {
          setCustomerList(response.data || []);
        } else {
          throw new Error(response?.message || "Failed to fetch customers");
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error(firstUpperLetter(t("error.fetch_customers")));
        setCustomerList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.token]);

  return {
    models: {
      user,
      loading,
      customerList
    },
    operations: {}
  };
};