"use client";
import { apiManagerRequest } from "./common";

export const objectValidRawMessage = async (token: string, params: any) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "object.valid_raw_messages",
      params: {
        time_from: params.time_from,
        time_to: params.time_to,
        object_id: params.object_id,
        ...(params.io_ids_filter && { io_ids_filter: params.io_ids_filter }),
      },
      id: "1",
    };

    const result: string = await apiManagerRequest(
      token,
      "object.valid_raw_messages",
      payload.params
    );
    const data: any = JSON.parse(result);
    return JSON.parse(data.result);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

interface ObjectListResult {
  result: string;
}

export const objectList = async (token: string | null) => {
  try {
    const result: string = await apiManagerRequest(token, "object.list");
    const data = JSON.parse(result);
    return JSON.parse(data.result);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
