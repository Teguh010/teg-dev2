"use client";
import { apiRequest } from "./common";

// Type definitions (you might want to move these to a separate types file)
interface ScheduleParams {
  name: string;
  scheduled_time: string;
  repeatable: boolean;
  parameters: object;
  repetition_type?: number;
  repetition_count?: number;
  repetition_end?: string;
  repetition_step?: number;
  enabled: boolean;
  done: boolean;
  schedule_id?: number;
}

interface ScheduleResponse {
  schedule_id: number;
}

interface ScheduleDetail {
    task_name: string;
    scheduled_time: string;
    is_repeatable: boolean;
    param: {
        email: string[];
        start_date?: string;
        end_date?: string;
        report_type?: string;
    };
    repetition_type: number;
    repetition_count: number;
    repetition_end: string;
    repetition_step: number;
    enabled: boolean;
    done: boolean;
}

// Main function to create/edit schedule
export const scheduleCreateEdit = async (
  token: string,
  params: ScheduleParams
): Promise<number> => {
  try {
    const result: string = await apiRequest(token, "schedule.create_edit", params);
    const data: ScheduleResponse = JSON.parse(result);
    return data.schedule_id;
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error Details:', error.message); // Debug log
    }
    throw error;
  }
};

export const scheduleGet = async (token: string, schedule_id: number): Promise<ScheduleDetail> => {
    try {
        const result = await apiRequest(token, "schedule.get", { schedule_id });        
        const parsedResult = JSON.parse(result);
        
        return Array.isArray(parsedResult) ? parsedResult[0] : parsedResult;
    } catch (error) {
        console.error('Error fetching schedule:', error);
        throw error;
    }
};

// Function to delete schedule
export const scheduleDelete = async (token: string, schedule_id: number): Promise<boolean> => {
  try {
    const result: string = await apiRequest(token, "schedule.delete", { schedule_id });
    return JSON.parse(result).success;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Function to list all schedules
export const scheduleList = async (token: string, onlyMine: boolean = false): Promise<any[]> => {
  try {
    const result: string = await apiRequest(token, "schedule.list", { only_mine: onlyMine });
    const parsedResult = JSON.parse(result); // Parse the JSON string
    return Array.isArray(parsedResult) ? parsedResult : []; // Ensure it's an array
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Function to enable/disable schedule
export const scheduleToggle = async (
  token: string,
  schedule_id: number,
  enabled: boolean
): Promise<boolean> => {
  try {
    const result: string = await apiRequest(token, "schedule.toggle", {
      schedule_id,
      enabled
    });
    return JSON.parse(result).success;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Function to reschedule a task
export const scheduleReschedule = async (token: string, schedule_id: number): Promise<boolean> => {
  try {
    const result: string = await apiRequest(token, "schedule.reschedule", { schedule_id });
    return JSON.parse(result).success;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Function to get repetition types
export const scheduleRepetitionTypes = async (token: string): Promise<string[]> => {
  try {
    const result: string = await apiRequest(token, "schedule.repetition_type", {});
    const parsedResult = JSON.parse(result);
    return Array.isArray(parsedResult) ? parsedResult : [];
  } catch (error) {
    console.error('Error fetching repetition types:', error);
    return [];
  }
}; 