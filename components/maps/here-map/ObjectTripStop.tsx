"use client";
import { format } from "date-fns";
import {
    objectListResult,
    objectListResultVehicle,
    objectListResponse,
    objectTripStopResponse,
    objectTripStopResult,
} from "./types";

export const objectList = async (token: string | null) => {

    if (!token) {
        return null;
    }

    let data: objectListResult;
    const url = process.env.NEXT_PUBLIC_TRACEGRID_API_URL + "/tracegrid_api/client";
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    const body = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "object.list",
        "params": {
            "with_archived": false,
            "without_virtual": true
        },
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dataResponse: objectListResponse = await response.json();
        const resultItems: objectListResultVehicle[] = JSON.parse(dataResponse.result);
        const items = resultItems;
        data = { items };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }

    return data;
};

export const objectTripStop = async (token: string, vehicle: number, startDate: string, endDate: string) => {

    if (!token) {
        return null;
    }

    let data: objectTripStopResult;
    const url = process.env.NEXT_PUBLIC_TRACEGRID_API_URL + "/tracegrid_api/client";
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
    const body = {
        "id": "1",
        "jsonrpc": "2.0",
        "method": "object.trip_stop",
        "params": {
            "object_id": vehicle,
            "time_from": format(startDate, "yyyy-MM-dd HH:mm:ss"),
            "time_to": format(endDate, "yyyy-MM-dd HH:mm:ss"),
        },
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dataResponse: objectTripStopResponse = await response.json();
        const resultItems: objectTripStopResult = JSON.parse(dataResponse.result);
        const items = resultItems;
        data = items;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }

    return data;
};
