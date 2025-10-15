"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { listManufacturers } from "@/models/manager/modules";
import { listCustomers } from "@/models/manager/customers";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { firstUpperLetter } from "@/lib/utils";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;

  const [loading, setLoading] = useState(false);
  const [isGenerate, setIsGenerate] = useState(false);
  const [dataGenerated, setDataGenerated] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [manufacturerList, setManufacturerList] = useState([]);
  const [ignoreList] = useState([{ title: "id" }]);
  const [styleRowList] = useState([
    {
      title: "is_active",
      value: (val: boolean = false) => val === true && "bg-green-100",
    },
  ]);

  // Fetch data when generate is triggered
  useEffect(() => {
    const fetchData = async () => {
      if (!isGenerate || !selectedCustomerId) return;

      setLoading(true);
      try {
        const currentUser = getUserRef();
        if (!currentUser?.token) {
          throw new Error("No token available");
        }

        const response = await listManufacturers(currentUser.token, selectedCustomerId);
        
        if (response?.success) {
          setManufacturerList(response.data || []);
          setDataGenerated(true);
          toast.success(firstUpperLetter(t("process_completed")));
        } else {
          throw new Error(response?.message || "Failed to generate manufacturer list");
        }
      } catch (error) {
        console.error("Error generating manufacturer list:", error);
        toast.error(firstUpperLetter(t("process_error")));
        setManufacturerList([]);
        setDataGenerated(false);
      } finally {
        setLoading(false);
        setIsGenerate(false);
      }
    };

    fetchData();
  }, [isGenerate, selectedCustomerId]);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      if (getUserRef().token === null) {
        return;
      }

      try {
        const response = await listCustomers(getUserRef().token);
        if (response?.success) {
          setCustomers(response.data || []);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error(firstUpperLetter(t("error.fetch_customers")));
        setCustomers([]);
      }
    };

    const currentUser = getUserRef();
    if (currentUser?.token) {
      fetchCustomers();
    }
  }, [user?.token]);

  const handleCustomerSelect = (customerId: string | null) => {
    setSelectedCustomerId(customerId === 'all' ? null : customerId);
    setDataGenerated(false);
    setManufacturerList([]);
  };

  return {
    models: {
      user,
      loading,
      isGenerate,
      dataGenerated,
      customers,
      selectedCustomerId,
      manufacturerList,
      ignoreList,
      styleRowList
    },
    operations: {
      setIsGenerate,
      handleCustomerSelect
    }
  };
};
