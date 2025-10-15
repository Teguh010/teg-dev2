"use client";
import {
    objectGroupListResult,
    objectGroupObjectListResult
} from "@/types/object_group";
import { apiRequest } from "./common";

export const objectGroupList = async (token: string | null) => {
    try {
        const result: string = await apiRequest(token, "objects_group.list", {});
        const data: objectGroupListResult = JSON.parse(result);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const objectGroupObjectList = async (token: string | null, group_id: number) => {
    try {
        const result: string = await apiRequest(token, "objects_group.objects_list", { "group_id": group_id });
        const data: objectGroupObjectListResult = JSON.parse(result);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const objectsGroupCreate = async (token: string | null, params: any) => {
    try {
        const result: string = await apiRequest(token, "objects_group.create", params);
        const data = JSON.parse(result);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const objectsGroupDelete= async (token: string | null, params: any) => {
    try {
        const result: string = await apiRequest(token, "objects_group.delete", params);
        const data = JSON.parse(result);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const objectsGroupUpdate= async (token: string | null, params: any) => {
    try {
        const result: string = await apiRequest(token, "objects_group.edit", params);
        const data = JSON.parse(result);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
