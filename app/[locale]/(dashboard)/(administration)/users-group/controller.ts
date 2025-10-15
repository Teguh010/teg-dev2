"use client";
import { useState, useCallback } from "react";
import { getUserGroups, deleteUserGroup, UserGroup } from "@/models/users_group";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "react-i18next";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserGroups = useCallback(async () => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const groups = await getUserGroups(token);
      setUserGroups(groups);
    } catch {
      toast.error(t("Failed to fetch user groups"));
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const deleteUserGroupOp = useCallback(async (groupId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      await deleteUserGroup(token, groupId);
      toast.success(t("User group deleted successfully"));
      await fetchUserGroups();
    } catch {
      toast.error(t("Failed to delete user group"));
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t, fetchUserGroups]);

  // Data untuk tabel
  const userGroupTableData = Array.isArray(userGroups)
    ? userGroups.map(g => ({
        id: g.id,
        name: g.val,
        editable: g.editable,
        owner: g.owner,
      }))
    : [];

  // Kolom yang diabaikan, aksi, style, dsb (bisa disesuaikan)
  const ignoreList = [];
  const actionList = [
    { title: "actions" } 
  ];
  const styleColumnList = [];
  const searchList = ["name", "owner"];

  return {
    models: {
      userGroups,
      userGroupTableData,
      ignoreList,
      actionList,
      styleColumnList,
      searchList,
      loading,
    },
    operations: {
      fetchUserGroups,
      deleteUserGroup: deleteUserGroupOp,
    },
  };
}; 