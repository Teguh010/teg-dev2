"use client";
import { apiManagerRequest } from "./common";

export interface MenuReport {
  id: number;
  name: string;
  default: "enabled" | "disabled";
  min_user: number;
  enabled: boolean;
  exception_set: boolean;
  visible: boolean;
}

export interface MenuGroup {
  group_id: number;
  name: string;
  enabled: boolean;
  report: MenuReport[]; // Changed from 'reports' to 'report' to match API response
}

export interface MenuElementsResponse {
  success: boolean;
  data: MenuGroup[];
  message?: string;
}

interface ApiResponse {
  id: string;
  jsonrpc: string;
  result: string;
}

/**
 * Get available GUI elements for a customer
 * @param token Manager authentication token
 * @param customerId Customer ID
 * @returns Promise with menu elements data
 */
export const getAvailableMenuElements = async (
  token: string | null,
  customerId: number
): Promise<MenuElementsResponse> => {
  try {
    const response = await apiManagerRequest(token, "customer.available_gui_elements", {
      customer_id: customerId
    });
    
    // Parse the initial response
    const apiResponse = JSON.parse(response) as ApiResponse;
    
    // Parse the result string which contains the actual menu data
    const menuGroups: MenuGroup[] = JSON.parse(apiResponse.result);

    return {
      success: true,
      data: menuGroups,
      message: `Successfully retrieved menu elements for customer ${customerId}`
    };
  } catch (error) {
    console.error('Error fetching menu elements:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch menu elements'
    };
  }
};

/**
 * Disable GUI element for a customer
 * @param token Manager authentication token
 * @param customerId Customer ID
 * @param reportId Report ID to disable
 * @param reportGroupId Optional report group ID to disable
 * @returns Promise with success status
 */
export const disableGuiElement = async (
  token: string | null,
  customerId: number,
  reportId?: number,
  reportGroupId?: number
): Promise<boolean> => {
  try {
    const params: any = { customer_id: customerId };
    
    if (reportId) {
      params.report_id = reportId;
    }
    if (reportGroupId) {
      params.report_group_id = reportGroupId;
    }

    const response = await apiManagerRequest(token, "customer.disable_gui_element", params);
    const result = JSON.parse(response);
    
    return result.result === true;
  } catch (error) {
    console.error('Error disabling GUI element:', error);
    throw error;
  }
};

/**
 * Enable GUI element for a customer
 * @param token Manager authentication token
 * @param customerId Customer ID
 * @param reportId Report ID to enable
 * @param reportGroupId Optional report group ID to enable
 * @returns Promise with success status
 */
export const enableGuiElement = async (
  token: string | null,
  customerId: number,
  reportId?: number,
  reportGroupId?: number
): Promise<boolean> => {
  try {
    const params: any = { customer_id: customerId };
    
    if (reportId) {
      params.report_id = reportId;
    }
    if (reportGroupId) {
      params.report_group_id = reportGroupId;
    }

    const response = await apiManagerRequest(token, "customer.enable_gui_element", params);
    const result = JSON.parse(response);
    
    return result.result === true;
  } catch (error) {
    console.error('Error enabling GUI element:', error);
    throw error;
  }
};

/**
 * Set disabled GUI elements for a customer
 * @param token Manager authentication token
 * @param customerId Customer ID
 * @param reportIds Array of report IDs to disable
 * @returns Promise with success status
 */
export const setDisabledGuiElements = async (
  token: string | null,
  customerId: number,
  reportIds: number[]
): Promise<boolean> => {
  try {
    const response = await apiManagerRequest(token, "customer.set_disabled_gui_elements", {
      customer_id: customerId,
      report_id: reportIds
    });
    
    const result = JSON.parse(response);
    return result.result === true;
  } catch (error) {
    console.error('Error setting disabled GUI elements:', error);
    throw error;
  }
};

