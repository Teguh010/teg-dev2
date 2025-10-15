"use client";
import {
  getDriverListResult,
  getVechicleListResult,
  tachoAnalysisServiceAuthorizeResult,
  tachoLiveDrivingStateStatsResult
} from "@/types/tachograph";
import { apiRequest, apiTachoGetRequest, apiTachoGetFile, apiTachoPostRequest, apiTachoPostTokenRequest, apiRequestWithErrorHandling } from "./common";

export const tachoAnalysisServiceAuthorize = async (token: string | null) => {
  try {
    const result: string = await apiRequest(token, "tacho_analysis_service.authorize", {});
    const data: tachoAnalysisServiceAuthorizeResult = JSON.parse(result);
    return data.token.TokenValue;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoLiveDrivingStateStatsAllObjects = async (
  token: string | null
): Promise<tachoLiveDrivingStateStatsResult> => {
  try {
    const result: string = await apiRequest(token, "tachograph.live_driving_state_stats_all_objects", []);

    if (!result) {
      return [];
    }

    const data: tachoLiveDrivingStateStatsResult = JSON.parse(result);

    return data;
  } catch (error) {
    console.error('Error in tachoLiveDrivingStateStatsAllObjects:', error);
    throw error;
  }
};

export const tachoLiveDrivingStateStats = async (token: string | null, objectId: number | string) => {
  try {
    const result: string = await apiRequest(token, "tachograph.live_driving_state_stats", {
      object_id: objectId
    });
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoGetDriverList = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoGetRequest(token, params, "https://test.tracegrid.tachoapi.com/Driver/getDriverList");
    const data: getDriverListResult = result.DriverCollection;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoGetDriverReport = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoGetFile(token, params, "https://test.tracegrid.tachoapi.com/Report/getDriverReport");
    const data: any = result;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoGetVehicleList = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoGetRequest(token, params, "https://test.tracegrid.tachoapi.com/Vehicle/getVehicleList");
    const data: getVechicleListResult = result.VehicleCollection;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoGetVehicleReport = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoGetFile(token, params, "https://test.tracegrid.tachoapi.com/Report/getVehicleReport");
    const data: any = result;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoActivateVehicle = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoPostRequest(token, params, "https://test.tracegrid.tachoapi.com/Vehicle/activateVehicle");
    const data: any = result;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoDeactivateVehicle = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoPostRequest(token, params, "https://test.tracegrid.tachoapi.com/Vehicle/deactivateVehicle");
    const data: any = result;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoActivateDriver = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoPostRequest(token, params, "https://test.tracegrid.tachoapi.com/Driver/activateDriver");
    const data: any = result;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoDeactivateDriver = async (token: string | null, params: any) => {
  try {
    const result = await apiTachoPostRequest(token, params, "https://test.tracegrid.tachoapi.com/Driver/deactivateDriver");
    const data: any = result;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoPutRawFile = async (token: string | null, params: any) => {
  try {
    const result: string = await apiRequest(token, "tachograph.put_raw_file", params);
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoFilesList = async (token: string | null, params: any) => {
  try {
    const data = await apiRequestWithErrorHandling(token, "tachograph.files_list", params);
    if (data && data.error) {
      throw new Error(data.error.data?.message || data.error.message || "API Error");
    }
    if (data && data.result === null) return [];
    if (data && typeof data.result === "string") return JSON.parse(data.result);
    if (data && Array.isArray(data.result)) return data.result;
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoDriverCardFilesList = async (token: string | null, params: any) => {
  try {
    const data = await apiRequestWithErrorHandling(token, "tachograph.driver_card_files_list", params);
    if (data && data.error) {
      throw new Error(data.error.data?.message || data.error.message || "API Error");
    }
    if (data && data.result === null) return [];
    if (data && typeof data.result === "string") return JSON.parse(data.result);
    if (data && Array.isArray(data.result)) return data.result;
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const tachoGetRawFile = async (token: string | null, params: any) => {
  try {
    const result: string = await apiRequest(token, "tachograph.get_raw_file", params);
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

export const tachoGetRawCardFile = async (token: string | null, params: any) => {
  try {
    const result: string = await apiRequest(token, "tachograph.get_raw_card_file", params);
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
export interface LatestInputsDataResponse {
  id: string;
  jsonrpc: string;
  result: string;
}

export interface InputData {
  id: number;
  i: string;
  v: string | null;
}

export interface ObjectInputs {
  object_id: number;
  inputs: InputData[];
}

export interface ParsedLatestInputsData extends Array<ObjectInputs> { }

export const getLatestInputsData = async (token: string | null, objectIds: number[] = []) => {
  try {
    const result: string = await apiRequest(token, "object.get_latest_inputs_data_txt_selected_objects", {
      object_ids: objectIds
    });

    const data: LatestInputsDataResponse = JSON.parse(result);
    const parsedData: ParsedLatestInputsData = JSON.parse(data.result);

    return parsedData;
  } catch (error) {
    console.error('Error in getLatestInputsData:', error);
    throw error;
  }
};

export const tachoFaultsList = async (token: string | null, params: any) => {
  try {
    const result: string = await apiRequest(token, "tachograph.faults_and_events", params);
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

export const tachoStatusList = async (token: string | null, params: any) => {
  try {
    const result: string = await apiRequest(token, "tachograph.get_read_statuses", params);
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

export const tachoDistanceDrivenList = async (token: string | null, params: any) => {
  try {
    const result: string = await apiRequest(token, "tachograph.distance_driven_stats", params);
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

export const tachoDrivingStatList = async (token: string | null, params: any) => {
  try {
    const result = await apiRequest(token, "tachograph.driving_stats_by_driver_card_data", params);
    const data = JSON.parse(result);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

export const tachoGetAuthToken = async (username: any, password: any) => {
  try {
    const result = await apiTachoPostTokenRequest(username, password, "https://test.tracegrid.tachoapi.com/Authorization/getToken");
    const data: any = result;
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export interface UnassignedTachoDriver {
  id: number;
  name: string;
}

export const tachoUnassignedDriverIds = async (token: string | null): Promise<UnassignedTachoDriver[]> => {
  try {
    const result: string = await apiRequest(token, "tachograph.unassigned_driver_ids", {});
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed.result === "string") {
      return JSON.parse(parsed.result);
    }
    if (Array.isArray(parsed.result)) {
      return parsed.result;
    }
    return [];
  } catch (error) {
    console.error("Error in tachoUnassignedDriverIds:", error);
    throw error;
  }
};

export interface DriverActivity {
  s_id: number;
  t_from: string;
  t_to: string;
}

export const tachoDriverActivitiesLast24Hours = async (token: string | null, cardNumber: string): Promise<DriverActivity[]> => {
  try {
    const result: string = await apiRequest(token, "tachograph.driver_activities_last24_hours", {
      card_number: cardNumber
    });
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === "string") {
      return JSON.parse(parsed);
    }
    return [];
  } catch (error) {
    console.error("Error in tachoDriverActivitiesLast24Hours:", error);
    throw error;
  }
};