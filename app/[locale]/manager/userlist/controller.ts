"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { listUsers, getUserToken } from "@/models/manager/users";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSelectedCustomerStore } from "@/store/selected-customer";


interface User {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  created_at?: string;
  last_login?: string;
  [key: string]: any;
}

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;

  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);
  const [dataGenerated, setDataGenerated] = useState(false);
  const [ignoreList] = useState([{ title: "id" }]);
  const [actionList] = useState([]);
  const [styleRowList] = useState([
    {
      title: "is_active",
      value: (val: boolean = false) => val === true && "bg-green-100",
    },
  ]);
  const [searchList] = useState([
    { title: "name" },
    { title: "user_type" },
    { title: "worker" }
  ]);

  const { 
    selectedCustomerId
  } = useSelectedCustomerStore();

  const handleGetUserToken = async (userId: number) => {
    const currentUser = getUserRef();
    if (!currentUser?.token) {
      toast.error(t("error.no_token"));
      return;
    }

    try {
      setLoading(true);
      const response = await getUserToken(currentUser.token, userId);
      
      if (response && response.result) {
        const token = response.result;
        
        const clientUserData = {
          token: token,
          role: 'user' as 'user'
        };
        
        localStorage.setItem('temp-userData-client', JSON.stringify(clientUserData));
        
        const clientUrl = `${window.location.origin}/client-access?access_token=${encodeURIComponent(token)}`;
        window.open(clientUrl, '_blank');
        
        toast.success("Opening client view...");
        
      } else {
        toast.error("Failed to get user token");
      }
    } catch (error) {
      console.error("Error getting user token:", error);
      toast.error("Failed to get user token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = getUserRef();
      if (!currentUser?.token) return;

      setLoading(true);
      try {
        const response = await listUsers(currentUser.token);
        if (response) {
          setUserList(response);
          setDataGenerated(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCustomerId]);

  return {
    models: {
      user,
      loading,
      userList,
      ignoreList,
      actionList,
      styleRowList,
      dataGenerated,
      searchList
    },
    operations: {
      handleGetUserToken
    }
  };
};
