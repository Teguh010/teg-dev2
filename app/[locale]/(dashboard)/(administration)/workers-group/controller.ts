"use client";
import { useState, useCallback, useEffect } from "react";
import { getWorkersGroups, deleteWorkersGroup, WorkersGroup } from "@/models/workers_group";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "react-i18next";

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [workersGroups, setWorkersGroups] = useState<WorkersGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({ foreign_system_id: false });

  const fetchWorkersGroups = useCallback(async () => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const groups = await getWorkersGroups(token);
      setWorkersGroups(groups);
    } catch {
      toast.error(t("Failed to fetch workers groups"));
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const deleteWorkersGroupOp = useCallback(async (groupId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      await deleteWorkersGroup(token, { group_id: groupId });
      toast.success(t("Workers group deleted successfully"));
      await fetchWorkersGroups();
    } catch {
      toast.error(t("Failed to delete workers group"));
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t, fetchWorkersGroups]);

  // Data untuk tabel
  const workersGroupTableData = Array.isArray(workersGroups)
    ? workersGroups.map(g => ({
        id: g.id,
        name: g.name,
        foreign_system_id: g.foreign_system_id,
        editable: g.editable,
      }))
    : [];

  // Update columnVisibility jika kolom foreign_system_id muncul di data
  useEffect(() => {
    if (
      workersGroupTableData.length > 0 &&
      workersGroupTableData[0].hasOwnProperty("foreign_system_id") &&
      columnVisibility["foreign_system_id"] !== false
    ) {
      setColumnVisibility((prev) => ({ ...prev, foreign_system_id: false }));
    }
  }, [workersGroupTableData, columnVisibility]);

  // Kolom yang diabaikan, aksi, style, dsb (bisa disesuaikan)
  const ignoreList = [
    { title: "id" }
  ];
  const actionList = [ { title: "actions" } ];
  const styleColumnList = [];
  const searchList = ["name", "foreign_system_id"];

  return {
    models: {
      workersGroups,
      workersGroupTableData,
      ignoreList,
      actionList,
      styleColumnList,
      searchList,
      loading,
      columnVisibility,
    },
    operations: {
      fetchWorkersGroups,
      deleteWorkersGroup: deleteWorkersGroupOp,
      setColumnVisibility,
    },
  };
}; 