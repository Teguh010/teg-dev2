// models/server/object.ts
import { apiRequestServer } from "./common";
import { format } from "date-fns";
import type { objectTripStopResult } from "@/types/object";

export const objectTripStopServer = async (token: string, params: any) => {
  try {
    const result = await apiRequestServer(token, "object.trip_stop", params);
    const data: objectTripStopResult = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};