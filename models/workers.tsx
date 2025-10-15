"use client";
import { apiRequest } from "./common";

export interface WorkerFormData {
  name: string;
  surname: string;
  phone?: string;
  email?: string;
  tacho_driver_id?: number;
  tacho_driver_name?: string; // <-- add this for edit mode
  foreign_system_id?: string;
  groups_list?: number[];
  rfid?: string;
  rfid_size?: number;
  rfid_reversed?: boolean;
  assigned_to?: number;
}

export interface Worker {
  worker_id: number;
  id: number;
  name: string;
  surname: string;
  phone?: string;
  email?: string;
  tacho_driver_id?: number;
  tacho_driver_name?: string; // <-- add this for edit mod
  foreign_system_id?: string;
  groups_list?: number[];
  rfid?: string;
  rfid_size?: number;
  rfid_reversed?: boolean;
  assigned_to?: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  expires: boolean;
  user_type: string;
  worker: string | null;
  public_id: string;
}

export interface WorkerGroup {
  id: number;
  name: string;
  foreign_system_id: string;
  editable: boolean;
}

export interface TachoDriver {
  id: number;
  card_number: string;
  first_name: string;
  surname: string;
  active: boolean;
  hiden: boolean;
  card_expires: string;
}

export const objectWorkers = async (token: string, params: Record<string, unknown> = {}) => {
  try {
    const result: string = await apiRequest(token, "worker.list", params);
    const data: Worker[] = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const createWorker = async (token: string, payload: WorkerFormData) => {
  try {
    // Filter out empty RFID fields
    const filteredPayload: Record<string, unknown> = { ...payload };
    
    // Remove RFID fields if they're empty
    if (!filteredPayload.rfid || filteredPayload.rfid === "") {
      delete filteredPayload.rfid;
    }
    if (!filteredPayload.rfid_size || filteredPayload.rfid_size === 0) {
      delete filteredPayload.rfid_size;
    }
    if (filteredPayload.rfid_reversed !== true) {
      delete filteredPayload.rfid_reversed;
    }
    
    const result: string = await apiRequest(token, "worker.create", filteredPayload);
    const data: { worker_id: number } = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error creating worker:', error);
    throw error;
  }
};

export const editWorker = async (token: string, worker_id: number | undefined, payload: Partial<WorkerFormData> & { worker_foreign_id?: string }) => {
  try {
    // Filter out empty RFID fields
    const filteredPayload: Record<string, unknown> = { ...payload };
    
    // Remove RFID fields if they're empty
    if (!filteredPayload.rfid || filteredPayload.rfid === "") {
      delete filteredPayload.rfid;
    }
    if (!filteredPayload.rfid_size || filteredPayload.rfid_size === 0) {
      delete filteredPayload.rfid_size;
    }
    if (filteredPayload.rfid_reversed !== true) {
      delete filteredPayload.rfid_reversed;
    }

    // Only send one identifier: worker_id or worker_foreign_id
    if (worker_id !== undefined && worker_id !== null) {
      delete filteredPayload.worker_foreign_id;
      const result: string = await apiRequest(token, "worker.edit", { worker_id, ...filteredPayload });
      const data: { worker_id: number } = JSON.parse(result);
      return data;
    } else if (filteredPayload.worker_foreign_id) {
      const { worker_foreign_id, ...rest } = filteredPayload;
      const result: string = await apiRequest(token, "worker.edit", { worker_foreign_id, ...rest });
      const data: { worker_id: number } = JSON.parse(result);
      return data;
    } else {
      throw new Error("Either worker_id or worker_foreign_id must be provided");
    }
  } catch (error) {
    console.error('Error editing worker:', error);
    throw error;
  }
};

export const getUsersList = async (token: string) => {
  try {
    const result: string = await apiRequest(token, "user.list", {});
    const data: User[] = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getWorkerGroupsList = async (token: string) => {
  try {
    const result: string = await apiRequest(token, "workers_group.list", {});
    const data: WorkerGroup[] = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error fetching worker groups:', error);
    throw error;
  }
};

export const getTachoDriversList = async (token: string, includeInactive: boolean = false, includeHidden: boolean = false) => {
  try {
    const params: Record<string, unknown> = {};
    if (includeInactive) params.include_inactive = includeInactive;
    if (includeHidden) params.include_hidden = includeHidden;
    
    const result: string = await apiRequest(token, "tachograph.get_drivers_list", params);
    const data: TachoDriver[] = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error fetching tacho drivers:', error);
    throw error;
  }
};

export async function deleteWorker(token: string, worker_id: number) {
  // Only supply one parameter as per API spec
  const params = { json_parameter: { id: worker_id } };
  const result: string = await apiRequest(token, "worker.delete", params);
  return result;
}

export interface WorkerWithLoginPayload {
  name: string;
  surname: string;
  phone?: string;
  email?: string;
  tacho_driver_id?: number;
  foreign_system_id?: string;
  groups_list?: number[];
  rfid?: string;
  rfid_size?: number;
  rfid_reversed?: boolean;
  assigned_to?: number;
  login: string;
  password: string;
  user_type_id: number;
  user_groups?: number[];
  all_objects_visible?: boolean;
  user_expires?: string;
  user_data_age_limit?: number;
  visible_objects?: number[];
  visible_object_groups?: number[];
}

export async function createWorkerWithLogin(token: string, payload: WorkerWithLoginPayload) {
  // Filter out undefined/null fields
  const filteredPayload: Record<string, unknown> = {};
  Object.keys(payload).forEach((key) => {
    const value = ((payload as unknown) as Record<string, unknown>)[key];
    if (
      value !== undefined &&
      value !== null && value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      filteredPayload[key] = value;
    }
  });
  const result: string = await apiRequest(token, "worker.create_with_login", filteredPayload);
  return result;
}

export async function getUserGroupsList(token: string) {
  const result: string = await apiRequest(token, "users_group.list", {});
  return JSON.parse(result);
}

export const getUsersWithoutWorkers = async (token: string) => {
  try {
    const result: string = await apiRequest(token, "worker.users_without_workers", []);
    // API returns a JSON string, so parse twice
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error fetching users without workers:', error);
    throw error;
  }
};

export const getWorkersWithoutUsers = async (token: string) => {
  try {
    const result: string = await apiRequest(token, "worker.workers_without_users", []);
    // API returns a JSON string, so parse twice
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error fetching workers without users:', error);
    throw error;
  }
};

export const assignExistingUserToWorker = async (token: string, worker_id: number, user_id: number) => {
  try {
    const params = { worker_id, user_id };
    const result: string = await apiRequest(token, "worker.assign_existing_user", params);
    // API returns a boolean result
    return JSON.parse(result);
  } catch (error) {
    console.error('Error assigning user to worker:', error);
    throw error;
  }
};

export const unassignUserFromWorker = async (token: string, worker_id: number) => {
  try {
    const params = { worker_id };
    const result: string = await apiRequest(token, "worker.unassign_user", params);
    // API returns a boolean result
    return JSON.parse(result);
  } catch (error) {
    console.error('Error unassigning user from worker:', error);
    throw error;
  }
};

export interface CreateAndAssignUserPayload {
  worker_id: number;
  user_name: string;
  user_password: string;
  user_type: number;
  user_expire?: string;
  user_data_age_limit?: number;
  all_objects_visible?: boolean;
  visible_objects?: number[];
  visible_object_groups?: number[];
}

export async function createAndAssignUser(token: string, payload: CreateAndAssignUserPayload) {
  // Filter out undefined/null fields
  const filteredPayload: Record<string, unknown> = {};
  Object.keys(payload).forEach((key) => {
    const value = ((payload as unknown) as Record<string, unknown>)[key];
    if (
      value !== undefined &&
      value !== null && value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      filteredPayload[key] = value;
    }
  });
  const result: string = await apiRequest(token, "worker.create_and_assign_user", filteredPayload);
  return result;
}

