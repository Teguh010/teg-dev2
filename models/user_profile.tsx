"use client";
import {
    settingListResultSetting,
} from "@/types/setting";
import {
    apiRequest,
    apiRefreshToken
} from "./common";
import { clearAllAuthData } from "@/lib/clear-auth-data";

export const userProfile = async (token: string | null) => {
    try {
        const result = await apiRequest(token, "user.my_profile", []);
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const refreshTokenModel = async (_token: string | null) => {
  try {
    const result = await apiRefreshToken();
    return result;
  } catch (error) {
    console.error('Error during token refresh (model):', error.message || error);
    
    const isManagerToken = localStorage.getItem('is-manager-token') === 'true';
    if (isManagerToken) {
      // Clear all auth data using centralized function
      clearAllAuthData();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
    
    throw error;
  }
};
