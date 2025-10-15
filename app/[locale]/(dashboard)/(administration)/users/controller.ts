"use client";
import { useState, useCallback } from "react";
import { getUsersList, deleteUser, User } from "@/models/users";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "react-i18next";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const users = await getUsersList(token);
      setUsers(users);
    } catch {
      toast.error(t("Failed to fetch users"));
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const deleteUserOp = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      await deleteUser(token, userId);
      toast.success(t("User deleted successfully"));
      await fetchUsers();
    } catch {
      toast.error(t("Failed to delete user"));
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t, fetchUsers]);

  // Data untuk tabel
  const userTableData = users.map(u => ({
    id: u.id,
    name: u.name,
    user_type: u.user_type,
    expires: u.expires,
    worker: u.worker,
    public_id: u.public_id,
  }));

  // Kolom yang diabaikan, aksi, style, dsb (bisa disesuaikan)
  const ignoreList = [ { title: "id" }, { title: "public_id" } ];
  const actionList = [ { title: "actions" } ];
  const styleColumnList = [];
  const searchList = ["name", "user_type"];

  return {
    models: {
      users,
      userTableData,
      ignoreList,
      actionList,
      styleColumnList,
      searchList,
      loading,
    },
    operations: {
      fetchUsers,
      deleteUser: deleteUserOp,
    },
  };
}; 