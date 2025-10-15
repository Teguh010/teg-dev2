"use client";
import { apiRequest } from "./common";
import {
    datatypeListResult,
    datatypeListResultItem
} from "@/types/datatype";

interface CurrentDatatypeItem {
    datatype_id: number;
    datatype_name: string;
}

interface CurrentDatatypeResultItem {
    id: number;
    name: string;
}

export const datatypeList = async (token: string | null) => {
    try {
        const isManagerContext = typeof window !== 'undefined' && 
            window.location.pathname.includes('/manager');
        
        const tokenSource = isManagerContext ? "manager" : "client";
        const result = await apiRequest(token, "datatype.list", {}, { tokenSource, apiEndpoint: "default" });
        
        const resultItems: datatypeListResultItem[] = JSON.parse(result);
        const data: datatypeListResult = resultItems;

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

export const currentDatatypesList = async (token: string | null, objectId: string) => {
    try {
        const isManagerContext = typeof window !== 'undefined' && 
            window.location.pathname.includes('/manager');
        
        const tokenSource = isManagerContext ? "manager" : "client";
        const result = await apiRequest(token, "object.current_datatypes_list", { object_id: objectId }, { tokenSource, apiEndpoint: "default" });
        
        // Parse the JSON string from the result
        const parsedResult: CurrentDatatypeItem[] = JSON.parse(result);
        
        // Map the datatype_id and datatype_name to id and name
        const resultItems: CurrentDatatypeResultItem[] = parsedResult.map((item: CurrentDatatypeItem) => ({
            id: item.datatype_id,
            name: item.datatype_name
        }));
        
        const data: CurrentDatatypeResultItem[] = resultItems;

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};