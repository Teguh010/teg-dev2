"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { getModuleOverview, ModuleOverview } from "@/models/manager/modules";
import { listCustomers } from "@/models/manager/customers";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSelectedCustomerStore } from "@/store/selected-customer";
import { format } from "date-fns";

// Extend the existing ModuleOverview interface with additional properties
interface ExtendedModuleOverview extends Omit<ModuleOverview, 'details'> {
  module_registered?: string;
  object_registered?: string;
  last_data_received?: string;
  object_deleted_at?: string;
  garmin_enabled?: boolean;
  icon_set?: string;
  imei?: string;
  login?: string | null;
  memo?: string;
  module_enabled?: boolean;
  module_type?: string;
  network_protocol?: string;
  object_deleted?: boolean;
  object_enabled?: boolean;
  object_name?: string;
  pass?: string | null;
  phone_number?: string | null;
  serial?: string | null;
  supports_garmin?: boolean;
  details?: Record<string, unknown>;
  [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
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
  const [moduleList, setModuleList] = useState<ExtendedModuleOverview[]>([]);
  const [ignoreList] = useState([{ title: "id" }]);
  const [styleRowList] = useState([]);
  const [dataGenerated, setDataGenerated] = useState(false);
  const [styleColumnList] = useState([
    // Boolean columns - make them very compact
    { 
      title: "garmin_enabled", 
      header: () => "Garmin\nEnabled",
      cell: () => "w-16 text-center"
    },
    { 
      title: "module_enabled", 
      header: () => "Module\nEnabled",
      cell: () => "w-16 text-center"
    },
    { 
      title: "object_deleted", 
      header: () => "Deleted",
      cell: () => "w-16 text-center"
    },
    { 
      title: "object_enabled", 
      header: () => "Object",
      cell: () => "w-16 text-center"
    },
    { 
      title: "supports_garmin", 
      header: () => "Supports\nGarmin",
      cell: () => "w-16 text-center"
    },
    // Short value columns
    { 
      title: "module_id", 
      header: () => "ID",
      cell: () => "w-20 text-center"
    },
    { 
      title: "network_protocol", 
      header: () => "Network\nProtocol",
      cell: () => "w-24 text-center"
    },
    { 
      title: "module_type", 
      header: () => "Type",
      cell: () => "w-24 text-center"
    },
    { 
      title: "icon_set", 
      header: () => "Icon",
      cell: () => "w-20 text-center"
    }
  ]);
  const [searchList] = useState([
      { title: "customer" },
      { title: "imei" },
      { title: "last_data_received" },
      { title: "memo" },
      { title: "module_id" },
      { title: "module_registered" },
      { title: "module_type" },
      { title: "network_protocol" },
      { title: "object_name" },
      { title: "object_registered" },
      { title: "phone_number" },
      { title: "serial" }
  ]);
  
  const [dateFormat] = useState(settings.find(setting => setting.title === "date_format")?.value || "yyyy-MM-dd");
  const [timeFormat] = useState(settings.find(setting => setting.title === "time_format")?.value || "HH:mm:ss");

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
        if (!customers.length) {
          const customersResponse = await listCustomers(currentUser.token);
          if (customersResponse?.success && Array.isArray(customersResponse.data)) {
            setCustomers(customersResponse.data);
          }
        }

        const response = await getModuleOverview(currentUser.token);
        if (response?.success) {
          const formattedData = response.data.map((item: ExtendedModuleOverview) => ({
            ...item,
            module_registered: item.module_registered ? formatLocalDateTime(item.module_registered) : "-",
            object_registered: item.object_registered ? formatLocalDateTime(item.object_registered) : "-",
            last_data_received: item.last_data_received ? formatLocalDateTime(item.last_data_received) : "-",
            object_deleted_at: item.object_deleted_at ? formatLocalDateTime(item.object_deleted_at) : "-"
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
      styleColumnList,
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
