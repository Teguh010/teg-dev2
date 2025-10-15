"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { taskCreate, taskGet, taskUpdate, taskList, statusesList, prioritiesList, TaskFormData, setTaskStatus } from "@/models/task";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { firstUpperLetter } from "@/lib/utils";

interface TaskUpdatePayload extends TaskFormData {
  task_id: number;
}

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;
  const [tasks, setTasks] = useState([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);

    // Kolom urutan yang diinginkan
  const columnOrder = [
    "executor",
    "description",
    "task_status",
    "seen",
    "task_time",
    "creator",
    "priority",
    "actions"
  ];

  const createTask = useCallback(async (data: TaskFormData) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const taskId = await taskCreate(token, data);
      toast.success(t("Task created successfully"));
      return taskId;
    } catch (error) {
      toast.error(t("Failed to create task"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const getTask = useCallback(async (taskId: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const task = await taskGet(token, taskId);
      return task;
    } catch (error) {
      toast.error(t("Failed to fetch task"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const updateTask = useCallback(async (data: TaskUpdatePayload) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      const { task_id, ...taskData } = data;
      const taskId = await taskUpdate(token, task_id, taskData);
      toast.success(t("Task updated successfully"));
      return taskId;
    } catch (error) {
      toast.error(t("Failed to update task"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t]);

  const fetchTasks = useCallback(async (from?: Date, to?: Date) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = getUserRef().token;
      let params: { time_from?: string; time_to?: string } = {};
      if (from && to) {
        params = {
          time_from: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")} 00:00:00`,
          time_to: `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(to.getDate()).padStart(2, "0")} 23:59:59`,
        };
      }
      let data = await taskList(token, params);
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          data = [];
        }
      }
      if (!Array.isArray(data)) data = [];
      setTasks(data);
    } catch {
      toast.error(t("Failed to fetch tasks"));
    } finally {
      setLoading(false);
    }
  }, [user, getUserRef, t]);

  const setStartDateCallback = useCallback((date: Date | null) => {
    setStartDate(date);
  }, []);

  const setEndDateCallback = useCallback((date: Date | null) => {
    setEndDate(date);
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!user) return;
      const token = getUserRef().token;
      try {
        const statusesData = await statusesList(token);
        setStatuses(statusesData);
        const prioritiesData = await prioritiesList(token);
        setPriorities(prioritiesData);
      } catch {
        setStatuses([]);
        setPriorities([]);
      }
    };
    fetchMeta();
  }, [user, getUserRef]);

  const getStatusName = useCallback((id: number | string) => {
    const found = statuses.find((s) => s.id === Number(id));
    return found ? found.name : id;
  }, [statuses]);

  const getPriorityName = useCallback((id: number | string) => {
    const found = priorities.find((p) => p.id === Number(id));
    return found ? found.name : id;
  }, [priorities]);

  const flattenTask = useCallback((task: Record<string, unknown>) => {
    const lat = (task.task_body as Record<string, unknown>)?.lat ?? (task.task_body as Record<string, unknown>)?.latitude ?? "";
    const lon = (task.task_body as Record<string, unknown>)?.lon ?? (task.task_body as Record<string, unknown>)?.longitude ?? "";
    
    // Handle progress field that might be an object
    let progressValue = task.progress;
    if (typeof progressValue === 'object' && progressValue !== null) {
      // Convert object to string representation or use a default value
      progressValue = JSON.stringify(progressValue);
    }
    
    // Pastikan executor tetap ada di hasil flatten
    return {
      ...task,
      lat,
      lon,
      executor: task.executor ?? "", // tambahkan executor
      progress: progressValue ?? "", // handle progress object
      task_status: firstUpperLetter(getStatusName(task.task_status as number | string)),
      priority: firstUpperLetter(getPriorityName(task.priority as number | string)),
      task_time: task.task_time
        ? format(new Date(task.task_time as string), "yyyy-MM-dd HH:mm:ss")
        : "",
    };
  }, [getStatusName, getPriorityName]);

  const setTaskStatusOperation = useCallback(async (task_id: number, status_id: number) => {
    setLoading(true);
    try {
      const token = getUserRef().token;
      await setTaskStatus(token, task_id, status_id);
      toast.success(t("Task status updated successfully"));
      // Optionally refresh tasks
      await fetchTasks(startDate, endDate);
    } catch (error) {
      toast.error(t("Failed to update task status"));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserRef, t, fetchTasks, startDate, endDate]);

  // Filter out canceled tasks (status_id === 4)
  const safeTasks = Array.isArray(tasks) ? tasks.filter((task) => task.task_status !== 4) : [];
  // Sort by task_time descending (newest first)
  safeTasks.sort((a, b) => {
    const aTime = new Date(a.task_time).getTime();
    const bTime = new Date(b.task_time).getTime();
    return bTime - aTime;
  });
  // Fungsi untuk mengurutkan properti objek sesuai columnOrder
  function orderColumns(obj: Record<string, unknown>) {
    const ordered: Record<string, unknown> = {};
    columnOrder.forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        ordered[key] = obj[key];
      }
    });
    // Tambahkan properti lain yang tidak ada di columnOrder di akhir
    Object.keys(obj).forEach((key) => {
      if (!ordered.hasOwnProperty(key)) {
        ordered[key] = obj[key];
      }
    });
    return ordered;
  }

  const taskTableData = safeTasks.map(flattenTask).map(orderColumns);

  // Function to create grouped data from any input data
  const createGroupedData = useCallback((inputData: Record<string, unknown>[]) => {
    const grouped = inputData.reduce((acc: Record<string, Record<string, unknown>[]>, task: Record<string, unknown>) => {
      const executor = (task.executor as string) || 'Unknown';
      if (!acc[executor]) {
        acc[executor] = [];
      }
      acc[executor].push(task);
      return acc;
    }, {} as Record<string, Record<string, unknown>[]>);

    // Sort groups by latest task time in each group
    const sortedGroups = Object.entries(grouped).sort(([, aGroup], [, bGroup]) => {
      const aLatest = Math.max(...(aGroup as Record<string, unknown>[]).map(task => new Date((task.task_time as string) || 0).getTime()));
      const bLatest = Math.max(...(bGroup as Record<string, unknown>[]).map(task => new Date((task.task_time as string) || 0).getTime()));
      return bLatest - aLatest;
    });

    // Create flat array with group headers
    const flatData: Record<string, unknown>[] = [];
    sortedGroups.forEach(([executor, tasks]) => {
      const tasksArray = tasks as Record<string, unknown>[];
      // Add group header row with special formatting for executor column
      const groupHeaderRow: Record<string, unknown> = {
        isGroupHeader: true,
        executor: `${executor} (${tasksArray.length} task${tasksArray.length !== 1 ? 's' : ''})`,
        taskCount: tasksArray.length,
      };
      
      // Fill all other possible columns with empty values for header row
      const sampleTask = tasksArray[0] || {};
      Object.keys(sampleTask).forEach(key => {
        if (key !== 'executor' && key !== 'isGroupHeader' && key !== 'taskCount') {
          groupHeaderRow[key] = '';
        }
      });
      
      flatData.push(groupHeaderRow);
      
      // Add sorted tasks for this group
      const sortedTasks = tasksArray.sort((a, b) => new Date((b.task_time as string) || 0).getTime() - new Date((a.task_time as string) || 0).getTime());
      flatData.push(...sortedTasks);
    });

    return flatData;
  }, []);

  // Group tasks by executor and create flat data with group headers (for default view)
  const groupedTaskTableData = useMemo(() => {
    // Pastikan setiap row (termasuk group header) diurutkan kolomnya
    const grouped = createGroupedData(taskTableData);
    return grouped.map(orderColumns);
  }, [taskTableData, createGroupedData]);

  const ignoreList = [
    { title: "task_body" },
    { title: "id" },
    { title: "isGroupHeader" },
    { title: "taskCount" },
    { title: "progress" },
    { title: "lat" },
    { title: "lon" }
  ];

  const actionList = [
    { title: "actions" } 
  ];
  
  const styleColumnList = [];
  
  const styleRowList = [
    {
      title: "isGroupHeader",
      value: (cellValue: unknown) => {
        return cellValue === true ? "bg-gray-200 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 h-12" : "";
      }
    }
  ];

  return {
    models: {
      user,
      loading,
      tasks,
      startDate,
      endDate,
      taskTableData,
      groupedTaskTableData,
      ignoreList,
      actionList,
      styleColumnList,
      styleRowList,
    },
    operations: {
      createTask,
      getTask,
      updateTask,
      setTaskStatus: setTaskStatusOperation,
      setStartDate: setStartDateCallback,
      setEndDate: setEndDateCallback,
      fetchTasks,
      createGroupedData,
    },
  };
};
