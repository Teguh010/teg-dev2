"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { objectWorkers, createWorker, editWorker, WorkerFormData, deleteWorker as deleteWorkerApi, createWorkerWithLogin as createWorkerWithLoginApi, WorkerWithLoginPayload, getWorkerGroupsList, WorkerGroup } from "@/models/workers";
import { objectList } from '@/models/object';
import { objectListResultVehicle } from '@/types/object';
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

interface WorkerUpdatePayload extends WorkerFormData {
  worker_id: number;
}

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workerGroups, setWorkerGroups] = useState<WorkerGroup[]>([]);
  const [objects, setObjects] = useState<objectListResultVehicle[]>([]);
  const [columnVisibility, setColumnVisibility] = useState({ foreign_system_id: false });

  const createWorkerOperation = useCallback(async (data: WorkerFormData) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const result = await createWorker(token, data);
      toast.success(t("Worker created successfully"));
      return result;
    } catch (error) {
      toast.error(t("Failed to create worker"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const getWorker = useCallback(async (workerId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      // Assuming we have a getWorker API, if not we'll need to implement it
      const worker = await objectWorkers(token, { worker_id: workerId });
      return Array.isArray(worker) ? worker[0] : worker;
    } catch (error) {
      toast.error(t("Failed to fetch worker"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const updateWorker = useCallback(async (data: WorkerUpdatePayload) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const { worker_id, ...workerData } = data;
      const result = await editWorker(token, worker_id, workerData);
      toast.success(t("Worker updated successfully"));
      return result;
    } catch (error) {
      toast.error(t("Failed to update worker"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const fetchWorkers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = getUserRef().token;
      let data = await objectWorkers(token, {});
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          data = [];
        }
      }
      if (!Array.isArray(data)) data = [];
      setWorkers(data);
    } catch {
      toast.error(t("Failed to fetch workers"));
    } finally {
      setLoading(false);
    }
  }, [user, getUserRef, t]);

  const deleteWorker = useCallback(async (workerId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      await deleteWorkerApi(token, workerId);
      toast.success(t("Worker deleted successfully"));
      await fetchWorkers();
    } catch (error) {
      toast.error(t("Failed to delete worker"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t, fetchWorkers]);

  const createWorkerWithLogin = useCallback(async (data: WorkerWithLoginPayload) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const result = await createWorkerWithLoginApi(token, data);
      toast.success(t("Worker with login created successfully"));
      return result;
    } catch (error) {
      toast.error(t("Failed to create worker with login"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  // Assign user to worker
  const assignUserToWorker = useCallback(async (workerId: number, userId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const result = await import("@/models/workers").then(m => m.assignExistingUserToWorker(token, workerId, userId));
      if (result === true) {
        toast.success(t("User assigned to worker successfully"));
        await fetchWorkers();
      } else {
        toast.error(t("Failed to assign user to worker"));
      }
      return result;
    } catch (error) {
      toast.error(t("Failed to assign user to worker"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t, fetchWorkers]);

  // Unassign user from worker
  const unassignUserFromWorker = useCallback(async (workerId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const result = await import("@/models/workers").then(m => m.unassignUserFromWorker(token, workerId));
      if (result === true) {
        toast.success(t("User unassigned from worker successfully"));
        await fetchWorkers();
      } else {
        toast.error(t("Failed to unassign user from worker"));
      }
      return result;
    } catch (error) {
      toast.error(t("Failed to unassign user from worker"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t, fetchWorkers]);

  // Get users without workers
  const getUsersWithoutWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const users = await import("@/models/workers").then(m => m.getUsersWithoutWorkers(token));
      return users;
    } catch (error) {
      toast.error(t("Failed to fetch users without workers"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  // Get workers without users
  const getWorkersWithoutUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const workers = await import("@/models/workers").then(m => m.getWorkersWithoutUsers(token));
      return workers;
    } catch (error) {
      toast.error(t("Failed to fetch workers without users"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  // Fetch worker groups saat user sudah ada
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      const token = getUserRef().token;
      try {
        const groups = await getWorkerGroupsList(token);
        setWorkerGroups(groups);
      } catch {
        setWorkerGroups([]);
      }
    };
    fetchGroups();
  }, [user, getUserRef]);

  // Fetch object list for assigned_to mapping
  useEffect(() => {
    const fetchObjects = async () => {
      if (!user) return;
      const token = getUserRef().token;
      try {
        const data = await objectList(token, { with_archived: false, without_virtual: true });
        setObjects(data);
      } catch {
        setObjects([]);
      }
    };
    fetchObjects();
  }, [user, getUserRef]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const flattenWorker = useCallback((worker: Record<string, unknown>) => {
    // Mapping group id ke nama
    let groupNames: string[] = [];
    if (Array.isArray(worker.groups_list) && workerGroups.length > 0) {
      groupNames = worker.groups_list
        .map((id: number) => {
          const group = workerGroups.find((g) => g.id === id);
          return group ? group.name : String(id);
        })
        .filter(Boolean);
    }
    // Mapping assigned_to id ke nama object
    let assignedToName = '';
    if (worker.assigned_to && objects.length > 0) {
      const obj = objects.find((o) => o.id === worker.assigned_to);
      assignedToName = obj ? obj.name : String(worker.assigned_to);
    }
    return {
      ...worker,
      groups_list: groupNames.length > 0 ? groupNames.join(", ") : "",
      assigned_to: assignedToName,
      created_at: worker.created_at
        ? format(new Date(worker.created_at as string), "yyyy-MM-dd HH:mm:ss")
        : "",
      updated_at: worker.updated_at
        ? format(new Date(worker.updated_at as string), "yyyy-MM-dd HH:mm:ss")
        : "",
    };
  }, [workerGroups, objects]);

  const safeWorkers = Array.isArray(workers) ? workers : [];
  const workerTableData = safeWorkers.map(flattenWorker);

  // Kolom foreign_system_id default hidden
  useEffect(() => {
    if (
      workerTableData.length > 0 &&
      workerTableData[0].hasOwnProperty("foreign_system_id") &&
      columnVisibility["foreign_system_id"] !== false
    ) {
      setColumnVisibility((prev) => ({ ...prev, foreign_system_id: false }));
    }
  }, [workerTableData, columnVisibility]);

  const ignoreList = [
    { title: "worker_id" },
    { title: "id" },
    { title: "tacho_driver_id" },
    { title: "created_at" },
    { title: "updated_at" }
  ];

  const actionList = [
    { title: "actions" } 
  ];
  
  const styleColumnList = [
    {
      title: "name",
      // Hanya sticky di md ke atas
      headerClass: "md:sticky md:left-0 top-0 bg-default-300 z-20 min-w-[180px]",
      value: () => "md:sticky md:left-0 z-10 bg-white min-w-[180px]",
    },
    {
      title: "surname",
      // Hanya sticky di md ke atas
      headerClass: "md:sticky md:left-24 top-0 bg-default-300 z-20 min-w-[150px]",
      value: () => "md:sticky md:left-24 z-10 bg-white min-w-[150px]",
    },
    {
      title: "actions",
      headerClass: "sticky right-0 top-0 bg-default-300 z-20",
      value: () => "sticky right-0 z-10 bg-white",
    },
  ];

  const searchList = [
    { title: "name" },
    { title: "surname" },
    { title: "phone" },
    { title: "email" },
    { title: "deleted" },
    { title: "groups_list" },
    { title: "assigned_to" },
    { title: "tacho_driver_id" },
    { title: "tacho_driver_name" },
    { title: "foreign_system_id" }
  ];

  return {
    models: {
      user,
      loading,
      workers,
      workerTableData,
      ignoreList,
      actionList,
      styleColumnList,
      searchList,
      columnVisibility,
    },
    operations: {
      createWorker: createWorkerOperation,
      getWorker,
      updateWorker,
      fetchWorkers,
      deleteWorker,
      createWorkerWithLogin,
      assignUserToWorker,
      getUsersWithoutWorkers,
      getWorkersWithoutUsers,
      unassignUserFromWorker,
      setColumnVisibility,
    },
  };
};