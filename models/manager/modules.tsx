"use client";
import { apiManagerRequest } from "./common";

export interface Module {
  id: number;
  customer: string;
  module_id: number;
  name?: string;
  status?: string;
  is_active?: boolean;
  last_active?: string;
  details?: Record<string, any>;
}

export interface ModuleListResponse {
  success: boolean;
  data: Module[];
  message?: string;
}

export interface ModuleOverview {
  id: number;
  customer: string;
  module_id: number;
  name?: string;
  status?: string;
  is_active?: boolean;
  last_active?: string;
  details?: Record<string, any>;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
  hardware_version?: string;
  serial_number?: string;
}

export interface ModuleOverviewResponse {
  success: boolean;
  data: ModuleOverview[];
  message?: string;
}

interface ApiResponse {
  id: string;
  jsonrpc: string;
  result: string;
}

/**
 * Get list of modules for a specific customer
 * @param token Manager authentication token
 * @param customerId Customer ID
 * @returns Promise with list of modules
 */
export const listModules = async (
  token: string | null,
): Promise<ModuleListResponse> => {
  try {
    const response = await apiManagerRequest(token, "module.list");
    
    // Parse the initial response
    const apiResponse = JSON.parse(response) as ApiResponse;
    
    // Parse the result string which contains the actual modules data
    const modules: Module[] = JSON.parse(apiResponse.result);

    return {
      success: true,
      data: modules,
      message: `Successfully retrieved ${modules.length} modules`
    };
  } catch (error) {
    console.error('Error fetching modules:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch modules'
    };
  }
};

/**
 * Get module overview for a specific customer
 * @param token Manager authentication token
 * @param customerId Customer ID
 * @returns Promise with module overview data
 */
export const getModuleOverview = async (
  token: string | null,
): Promise<ModuleOverviewResponse> => {
  try {
    const response = await apiManagerRequest(token, "module.overview");
    
    // Parse the initial response
    const apiResponse = JSON.parse(response) as ApiResponse;
    
    // Parse the result string which contains the actual overview data
    const overview: ModuleOverview[] = JSON.parse(apiResponse.result);

    return {
      success: true,
      data: overview,
      message: "Successfully retrieved module overview"
    };
  } catch (error) {
    console.error('Error fetching module overview:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch module overview'
    };
  }
};

/**
 * Get list of manufacturers for a specific customer
 * @param token Manager authentication token
 * @param customerId Customer ID
 * @returns Promise with list of manufacturers
 */
export const listManufacturers = async (
  token: string | null,
  customerId: number
): Promise<ModuleListResponse> => {
  try {
    const result = await apiManagerRequest(token, "module.manufacturers_list");
    const manufacturers = JSON.parse(result);

    return {
      success: true,
      data: manufacturers,
      message: `Successfully retrieved ${manufacturers.length} manufacturers`
    };
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch manufacturers'
    };
  }
};
