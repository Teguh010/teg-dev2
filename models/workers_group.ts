import { apiRequest } from "./common";

export interface WorkersGroup {
  id: number;
  name: string;
  foreign_system_id: string;
  editable: boolean;
}

// List all workers groups or get by id
export const getWorkersGroups = async (
  token: string,
  group_id?: number
): Promise<WorkersGroup[]> => {
  try {
    let params: any = [];
    if (group_id !== undefined) params = { group_id };
    const result: string = await apiRequest(token, "workers_group.list", params);
    return JSON.parse(result);
  } catch (error) {
    console.error("Error fetching workers groups:", error);
    throw error;
  }
};

// Create a new workers group
export const createWorkersGroup = async (
  token: string,
  name: string,
  foreign_system_id?: string,
  workers_list?: number[],
  worker_ids_are_foreign?: boolean
) => {
  try {
    const params: Record<string, unknown> = { name };
    if (foreign_system_id) params.foreign_system_id = foreign_system_id;
    if (workers_list && workers_list.length > 0) params.workers_list = workers_list;
    if (worker_ids_are_foreign !== undefined) params.worker_ids_are_foreign = worker_ids_are_foreign;
    const result: string = await apiRequest(token, "workers_group.create", params);
    return result;
  } catch (error) {
    console.error("Error creating workers group:", error);
    throw error;
  }
};

// Edit a workers group (by id or foreign_id)
export const editWorkersGroup = async (
  token: string,
  payload: {
    group_id?: number;
    name?: string;
    workers_list?: number[] | string[];
  }
) => {
  try {
    const params: Record<string, unknown> = { ...payload };
    const result: string = await apiRequest(token, "workers_group.edit", params);
    return result;
  } catch (error) {
    console.error("Error editing workers group:", error);
    throw error;
  }
};

// Delete a workers group (by group_id or json_parameter)
export const deleteWorkersGroup = async (
  token: string,
  options: { group_id?: number; json_parameter?: any }
) => {
  try {
    const params: Record<string, unknown> = {};
    if (options.group_id !== undefined) params.group_id = options.group_id;
    if (options.json_parameter !== undefined) params.json_parameter = options.json_parameter;
    const result: string = await apiRequest(token, "workers_group.delete", params);
    return result;
  } catch (error) {
    console.error("Error deleting workers group:", error);
    throw error;
  }
};
