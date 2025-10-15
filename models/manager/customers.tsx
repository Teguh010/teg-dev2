"use client";
import { apiManagerRequest } from "./common";

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  suspended?: boolean;
  public_id?: string;
  tacho_service_provider?: string | null;
  memo?: string | null;
  groups_list?: string;
  system_users_public_id?: string;
  registered_at?: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  message?: string;
}

interface ApiResponse {
  id: string;
  jsonrpc: string;
  result: string;
}

/**
 * Get list of customers
 * @param token Manager authentication token
 * @param customerGroupId Optional customer group ID filter
 * @returns Promise with list of customers
 */
export const listCustomers = async (
  token: string | null,
  customerGroupId: number = 0
): Promise<CustomerListResponse> => {
  try {
    const params = customerGroupId ? { customer_group_id: customerGroupId } : {};
    const response = await apiManagerRequest(token, "customer.list", params);
    
    // Parse the initial response
    const apiResponse = JSON.parse(response) as ApiResponse;
    
    // Parse the result string which contains the actual customer data
    const customers: Customer[] = JSON.parse(apiResponse.result);

    return {
      success: true,
      data: customers,
      message: `Successfully retrieved ${customers.length} customers`
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch customers'
    };
  }
};

/**
 * Get a specific customer by ID
 * @param token Manager authentication token
 * @param customerId Customer ID to retrieve
 * @returns Promise with customer details
 */
export const getCustomer = async (
  token: string | null,
  customerId: number
): Promise<Customer | null> => {
  try {
    const result = await apiManagerRequest(token, "customer.get", {
      customer_id: customerId
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
};

/**
 * Get list of customers by group
 * @param token Manager authentication token
 * @param groupId Customer group ID
 * @returns Promise with list of customers in the group
 */
export const getCustomersByGroup = async (
  token: string | null,
  groupId: number
): Promise<CustomerListResponse> => {
  return listCustomers(token, groupId);
};
