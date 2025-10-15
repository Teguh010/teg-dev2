"use client";
import {
    settingListResultSetting,
} from "@/types/setting";
import {
    apiRequest,
} from "./common";

export const settingList = async (token: string | null) => {
    try {
        const result = await apiRequest(token, "setting.list", []);

        const resultItems: settingListResultSetting[] = JSON.parse(result);
        const data = { items: resultItems };

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

// Refactorización de settingUpdate utilizando apiRequest
export const settingUpdate = async (token: string | null, key: string, value: string) => {
    try {
        const result = await apiRequest(token, "setting.set", { key, value });

        const resultItems: settingListResultSetting[] = JSON.parse(result);
        const data = { items: resultItems };

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

// Get setting value by key
export const settingGet = async (token: string | null, key: string) => {
    try {
        const result = await apiRequest(token, "setting.get", { key });
        return result;
    } catch (error) {
        console.error('Error getting setting:', error);
        throw error;
    }
};

// Set setting value by key
export const settingSet = async (token: string | null, key: string, value: string) => {
    try {
        const result = await apiRequest(token, "setting.set", { key, value });
        return result;
    } catch (error) {
        console.error('Error setting setting:', error);
        throw error;
    }
};

// Delete setting by key
export const settingDelete = async (token: string | null, key: string) => {
    try {
        const result = await apiRequest(token, "setting.delete", { key });
        return result;
    } catch (error) {
        console.error('Error deleting setting:', error);
        throw error;
    }
};