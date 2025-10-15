import { apiRequest } from "./common";

interface LocationData {
  lat: number;
  lon: number;
}

interface RouteData {
  startLocation: LocationData | null;
  endLocation: LocationData | null;
  waypoints: LocationData[];
}

export interface TaskFormData {
  description: string;
  task_body: { 
    task_type: number; // 1 = destination only, 2 = full route (origin + destination + waypoints)
    origin?: {
      latitude: number;
      longitude: number;
    };
    waypoints?: Array<{
      latitude: number;
      longitude: number;
    }>;
    destination?: {
      latitude: number;
      longitude: number;
    };
  };
  task_time: string;
  status_id: number;
  priority: number;
  memo: string;
  assigned_to: number;
}

export const taskCreate = async (
  token: string,
  data: TaskFormData
) => {
  const result = await apiRequest(token, "task.create", data);
  return result; // result = task id
};

export const taskGet = async (token: string, task_id: number) => {
  const result = await apiRequest(token, "task.get", { task_id });
  return JSON.parse(result);
};

export const taskUpdate = async (
  token: string,
  task_id: number,
  data: TaskFormData
) => {
  const params = {
    task_id,
    ...data,
  };
  const result = await apiRequest(token, "task.update", params);
  return result; // result = task id
};

export const taskList = async (
  token: string,
  params?: { time_from?: string; time_to?: string }
) => {
  const result = await apiRequest(token, "task.list", params || {});
  return JSON.parse(result);
};

export const workersList = async (token: string) => {
  const result = await apiRequest(token, "task.workers_list", {});
  return JSON.parse(result);
};

export const statusesList = async (token: string) => {
  const result = await apiRequest(token, "task.statuses_list", {});
  return JSON.parse(result);
};

export const prioritiesList = async (token: string) => {
  const result = await apiRequest(token, "task.priorities_list", {});
  return JSON.parse(result);
};

export const taskTypesList = async () => {
  // Static list for task types
  return [
    { id: 1, name: "Destination Only" },
    { id: 2, name: "Full Route (Start + End)" }
  ];
};

export const setTaskStatus = async (token: string, task_id: number, status_id: number) => {
  await apiRequest(token, "task.set_status", { task_id, status_id });
};
