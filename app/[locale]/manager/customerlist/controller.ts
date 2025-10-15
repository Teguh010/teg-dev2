"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { listCustomers } from "@/models/manager/customers";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { firstUpperLetter } from "@/lib/utils";
import { format } from "date-fns";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user, settings } = UserContext.models;
  const { getUserRef } = UserContext.operations;

  const [loading, setLoading] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [ignoreList] = useState([{ title: "id" }]);
  const [styleRowList] = useState([
    {
      title: "is_active",
      value: (val: boolean = false) => val === true && "bg-green-100",
    },
  ]);
  const [searchList] = useState([
      { title: "name" },
      { title: "email" },
      { title: "phone" },
      { title: "memo" },
      { title: "contact_person" },
      { title: "public_id" }
  ]);

  // Ambil format tanggal dan waktu dari pengaturan pengguna
  const [dateFormat] = useState(settings?.find(setting => setting.title === "date_format")?.value || "yyyy-MM-dd");
  const [timeFormat] = useState(settings?.find(setting => setting.title === "time_format")?.value || "HH:mm:ss");

  // Fungsi untuk memformat tanggal sesuai format yang diinginkan (tanpa mengubah zona waktu)
  const formatDateTime = (dateTimeString) => {
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
      setLoading(true);
      try {
        const currentUser = getUserRef();
        if (!currentUser?.token) {
          throw new Error("No token available");
        }

        const response = await listCustomers(currentUser.token);
        if (response?.success) {
          
          const formattedData = response.data.map(customer => ({
            ...customer,
            registered_at: customer.registered_at ? formatDateTime(customer.registered_at) : "-"
          }));
          
          setCustomerList(formattedData || []);
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
      customerList,
      ignoreList,
      styleRowList,
      searchList
    },
    operations: {}
  };
};
