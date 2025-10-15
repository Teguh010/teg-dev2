import { apiRequest } from "./common";

export interface UserGroup {
  id: number;
  val: string;
  editable: boolean;
  owner_id: number;
  owner: string;
}

export interface AssignedObject {
  id: number;
  name: string;
  assigned: boolean;
}

// Create a new user group
export const createUserGroup = async (
  token: string,
  name: string,
  user_ids?: number[]
) => {
  const params: Record<string, unknown> = { name };
  if (user_ids && user_ids.length > 0) params.user_ids = user_ids;
  const result: string = await apiRequest(token, "users_group.create", params);
  return result;
};

// Delete a user group
export const deleteUserGroup = async (
  token: string,
  group_id: number
) => {
  const params = { group_id };
  const result: string = await apiRequest(token, "users_group.delete", params);
  return result;
};

// List all user groups or get by id
export const getUserGroups = async (
  token: string,
  group_id?: number
): Promise<UserGroup[]> => {
  const params: Record<string, unknown> = {};
  if (group_id !== undefined) params.group_id = group_id;
  const result: string = await apiRequest(token, "users_group.list", params);
  return JSON.parse(result);
};

// Rename a user group
export const renameUserGroup = async (
  token: string,
  group_id: number,
  new_name: string
) => {
  const params = { group_id, new_name };
  const result: boolean = await apiRequest(token, "users_group.rename", params);
  return result;
};

// Assign users to a group
export const assignUsersToGroup = async (
  token: string,
  group_id: number,
  user_ids: number[]
) => {
  const params = { group_id, user_ids };
  const result: boolean = await apiRequest(token, "users_group.assign_users", params);
  return result;
};

// Unassign users from a group
export const unassignUsersFromGroup = async (
  token: string,
  group_id: number,
  user_ids: number[]
) => {
  const params = { group_id, user_ids };
  const result: boolean = await apiRequest(token, "users_group.unassign_users", params);
  return result;
};

// Assign objects to a group (incremental)
export const assignObjectsToGroup = async (
  token: string,
  users_group_id: number,
  object_ids?: number[],
  object_group_ids?: number[]
) => {
  const params: Record<string, unknown> = { users_group_id };
  if (object_ids) params.object_ids = object_ids;
  if (object_group_ids) params.object_group_ids = object_group_ids;
  const result: boolean = await apiRequest(token, "users_group.assign_objects", params);
  return result;
};

// Unassign objects from a group (incremental)
export const unassignObjectsFromGroup = async (
  token: string,
  users_group_id: number,
  object_ids?: number[],
  object_group_ids?: number[]
) => {
  const params: Record<string, unknown> = { users_group_id };
  if (object_ids) params.object_ids = object_ids;
  if (object_group_ids) params.object_group_ids = object_group_ids;
  const result: boolean = await apiRequest(token, "users_group.unassign_objects", params);
  return result;
};

// Set assigned objects to a group (replace all)
export const setAssignedObjectsToGroup = async (
  token: string,
  users_group_id: number,
  object_ids?: number[] | null,
  object_group_ids?: number[] | null
) => {
  const params: Record<string, unknown> = { users_group_id };
  if (object_ids !== undefined) params.object_ids = object_ids;
  if (object_group_ids !== undefined) params.object_group_ids = object_group_ids;
  const result: boolean = await apiRequest(token, "users_group.set_assigned_objects", params);
  return result;
};

// Get assigned objects for a group
export const getAssignedObjectsForGroup = async (
  token: string,
  group_id: number
): Promise<AssignedObject[]> => {
  const params = { group_id };
  const result: string = await apiRequest(token, "users_group.get_assigned_objects", params);
  return JSON.parse(result);
};
