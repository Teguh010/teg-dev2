"use client";
import { apiManagerRequest } from "./common";

export interface CustomerUser {
  id: number;
  username: string;
  email?: string;
  customer_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const listUsers = async (token: string | null) => {
  try {
    const result = await apiManagerRequest(token, "user.list");
    const data = JSON.parse(result);
    return JSON.parse(data.result);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const createUser = async (
  token: string | null,
  userData: {
    username: string;
    password: string;
    email?: string;
    customer_code: string;
  }
) => {
  try {
    const result = await apiManagerRequest(token, "manager.create_user", userData);
    return JSON.parse(result);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const updateUser = async (
  token: string | null,
  userId: number,
  userData: Partial<CustomerUser>
) => {
  try {
    const result = await apiManagerRequest(token, "manager.update_user", {
      user_id: userId,
      ...userData
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const deleteUser = async (token: string | null, userId: number) => {
  try {
    const result = await apiManagerRequest(token, "manager.delete_user", {
      user_id: userId
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const getUserToken = async (token: string | null, userId: string | number) => {
  try {
    const userIdNumber = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    const result = await apiManagerRequest(token, "user.get_token", {
      user_id: userIdNumber
    });
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error getting user token:', error);
    throw error;
  }
};
