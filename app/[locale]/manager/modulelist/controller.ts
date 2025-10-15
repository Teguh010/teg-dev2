"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { listModules } from "@/models/manager/modules";
import { listCustomers } from "@/models/manager/customers";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSelectedCustomerStore } from "@/store/selected-customer";
import { format } from "date-fns";

interface Module {
  id?: number;
  module_registered?: string;
  object_registered?: string;
  last_timestamp?: string;
  [key: string]: any;
}

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const { 
    selectedCustomerId, 
    setSelectedCustomer, 
    setCustomers, 
    customers 
  } = useSelectedCustomerStore();

  const [loading, setLoading] = useState(false);
  const [moduleList, setModuleList] = useState<Module[]>([]);
  const [ignoreList] = useState([{ title: "id" }]);
  const [styleRowList] = useState([
    {
      title: "is_active",
      value: (val: boolean = false) => val === true && "bg-green-100",
    },
  ]);
  const [dataGenerated, setDataGenerated] = useState(false);
  const [searchList] = useState([
      { title: "customer_name" },
      { title: "imei" },
      { title: "module_registered" },
      { title: "module_type" },
      { title: "object_name" },
      { title: "object_registered" },
      { title: "phone" },
      { title: "serial" },
      { title: "last_timestamp" }
  ]);
  
  const [dateFormat] = useState(settings?.find(setting => setting.title === "date_format")?.value || "yyyy-MM-dd");
  const [timeFormat] = useState(settings?.find(setting => setting.title === "time_format")?.value || "HH:mm:ss");

  const formatLocalDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    try {
      const date = new Date(dateTimeString);
      return format(date, `${dateFormat} ${timeFormat}`);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateTimeString;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = getUserRef();
      if (!currentUser?.token) return;

      setLoading(true);
      try {
        // Fetch customers first if not already loaded
        if (!customers.length) {
          const customersResponse = await listCustomers(currentUser.token);
          if (customersResponse?.success && Array.isArray(customersResponse.data)) {
            setCustomers(customersResponse.data);
          }
        }

        const response = await listModules(currentUser.token);
        if (response?.success) {
          const formattedData = response.data.map((item: Module) => ({
            ...item,
            module_registered: item.module_registered ? formatLocalDateTime(item.module_registered) : "-",
            object_registered: item.object_registered ? formatLocalDateTime(item.object_registered) : "-",
            last_timestamp: item.last_timestamp ? formatLocalDateTime(item.last_timestamp) : "-"
          }));
          
          setModuleList(formattedData);
          setDataGenerated(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(t("error.fetch_data"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCustomerId]);

  const handleCustomerSelect = (customerId: string | null) => {
    if (customerId === 'all') {
      setSelectedCustomer(null, null);
    } else {
      const customer = customers.find(c => c.id === Number(customerId));
      if (customer) {
        setSelectedCustomer(customer.id, customer.name);
      }
    }
    setDataGenerated(false);
    setModuleList([]);
  };

  return {
    models: {
      user,
      loading,
      moduleList,
      ignoreList,
      styleRowList,
      hasCustomerSelected: !!selectedCustomerId,
      dataGenerated,
      customers: customers || [],
      selectedCustomerId,
      searchList
    },
    operations: {
      handleCustomerSelect
    }
  };
};
