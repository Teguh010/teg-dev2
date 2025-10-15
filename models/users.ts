import { apiRequest } from "./common";

export interface User {
  id: number;
  name: string;
  expires: boolean;
  user_type: string;
  worker: string | null;
  public_id: string;
}

export interface UserProfile {
  user: {
    id: number;
    login: string;
    type: number;
    expires: string | null;
  };
  settings: Array<{
    key: string;
    vle: string;
    is_global: boolean;
  }>;
  worker?: {
    id: number;
    name: string;
    surname: string;
    phone?: string;
    email?: string;
  };
  [key: string]: unknown;
}

// List all users
export const getUsersList = async (token: string): Promise<User[]> => {
  try {
    const result: string = await apiRequest(token, "user.list", []);
    return JSON.parse(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Create a new user
export const createUser = async (
  token: string,
  payload: {
    user_name: string;
    user_password: string;
    user_type: number;
    user_expire?: string;
    user_data_age_limit?: number;
    all_objects_visible?: boolean;
    visible_objects?: number[];
    visible_object_groups?: number[];
  }
) => {
  try {
    const params: Record<string, unknown> = { ...payload };
    const result: string = await apiRequest(token, "user.create", params);
    return result;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};


// Edit an existing user
export const editUser = async (
  token: string,
  payload: {
    user_id: number;
    user_name: string;
    user_password: string;
    user_type: number;
    user_expire?: string;
    user_data_age_limit?: number;
    all_objects_visible?: boolean;
    visible_objects?: number[];
    visible_object_groups?: number[];
  }
) => {
  try {
    const params: Record<string, unknown> = { ...payload };
    const result: string = await apiRequest(token, "user.edit", params);
    return result;
  } catch (error) {
    console.error("Error editing user:", error);
    throw error;
  }
};

// Delete a user by id
export const deleteUser = async (token: string, user_id: number) => {
  try {
    const params = { user_id };
    const result: string = await apiRequest(token, "user.delete", params);
    return result;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
// Get user by id
export const getUserById = async (token: string, user_id: number) => {
  try {
    const params = { user_id };
    const result: string = await apiRequest(token, "user.get", params);
    
    // API returns stringified JSON with single quotes and Python None values
    // Replace single quotes with double quotes and Python None with null
    const fixed = result.replace(/'/g, '"').replace(/None/g, 'null');
    
    const parsed = JSON.parse(fixed);
    // API returns array with single user object, so return first element
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch (error) {
    console.error("Error fetching user by id:", error);
    throw error;
  }
};

// Get my profile
export const getMyProfile = async (token: string): Promise<UserProfile> => {
  try {
    const result: string = await apiRequest(token, "user.my_profile", []);
    // API returns stringified JSON with single quotes, so replace with double quotes
    const fixed = result.replace(/'/g, '"');
    
    // Fix Python None and False values to JavaScript null and false
    const fixedForJS = fixed.replace(/None/g, 'null').replace(/False/g, 'false').replace(/True/g, 'true');
    
    const parsed = JSON.parse(fixedForJS);
    return parsed;
  } catch (error) {
    console.error("Error fetching my profile:", error);
    throw error;
  }
};

// Get user types list
export const getUserTypesList = async (token: string): Promise<{ id: number; val: string }[]> => {
  try {
    const result: string = await apiRequest(token, "user.types_list", []);
    // result is a stringified JSON array
    const parsed = JSON.parse(result);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error fetching user types list:", error);
    return [];
  }
};

// Types for GUI elements overview
export interface GUIReport {
  id: number;
  name: string;
  enabled: boolean;
  disabled: boolean;
  accessible: boolean | null;
}

export interface GUIGroup {
  group_id: number;
  group_name: string;
  disabled: boolean;
  accessible: boolean | null;
  report: GUIReport[];
}

// Get user GUI elements overview
export const getUserGUIElementsOverview = async (token: string, user_id: number): Promise<GUIGroup[]> => {
  try {
    const result: string = await apiRequest(token, "list.users_gui_elements_overview", { user_id });
    // API returns stringified JSON with single quotes and Python None values
    // Replace single quotes with double quotes and Python None with null
    const fixed = result.replace(/'/g, '"').replace(/None/g, 'null');
    return JSON.parse(fixed);
  } catch (error) {
    console.error("Error fetching user GUI elements overview:", error);
    return [];
  }
};

// Set disabled GUI elements for a user
export const setDisabledGUIElements = async (
  token: string,
  user_id: number,
  report_ids: number[],
  report_group_ids: number[]
): Promise<boolean> => {
  try {
    const params = {
      user_id,
      report_ids,
      report_group_ids
    };
    const result = await apiRequest(token, "user.set_disabled_gui_elements", params);
    return result === true || result === "true" || result === "True";
  } catch (error) {
    console.error("Error setting disabled GUI elements:", error);
    throw error;
  }
};

// Enable GUI element for a user
export const enableGUIElement = async (
  token: string,
  user_id: number,
  report_id: number | number[],
  report_group_id?: number | number[]
): Promise<boolean> => {
  try {
    const params: Record<string, unknown> = {
      user_id,
      report_id
    };
    
    if (report_group_id !== undefined) {
      params.report_group_id = report_group_id;
    }
    
    const result: string = await apiRequest(token, "user.enable_gui_element", params);
    return result === "true" || result === "True";
  } catch (error) {
    console.error("Error enabling GUI element:", error);
    throw error;
  }
};
