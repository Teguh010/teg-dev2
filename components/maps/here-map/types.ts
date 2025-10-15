// object.list
export interface objectListResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface objectListResultVehicle {
    id: number;
    name: string;
    garmin: boolean;
    distance_type: number;
    ignition_configured: boolean;
    card_downloads_configured: boolean;
    is_virtual: boolean;
    icon_id: number | null;
}

export interface objectListResult {
    items: objectListResultVehicle[]
}

// object.trip_stop
export interface objectTripStopResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface objectTripStopResultVehicle {
    state: string;
    time_from: string;
    time_to: string;
    time_through: string;
    duration: string;
    lat: number;
    lon: number;
    zone: string | null;
    distance: string;
    address: string | null;
    fuel_used: string | null;
    fuel_norm: string | null;
    worker: string | null;
    customer: string | null;
    trip_mode: string | null;
    fuel_km: string | null;
    avg_speed: string | null;
    next_lat: number;
    next_lon: number;
    next_address: string | null;
}

export interface objectTripStopResult {
    data: objectTripStopResultVehicle[];
    totals: {
        moving_time: string;
        distance: string;
        stationary_time: string;
        fuel_used: string | null;
        fuel_norm: string | null;
        trip_mode_exists: boolean;
        fuel_km: string | null;
        avg_speed: number;
        moving_time_job: string;
        stationary_time_job: string;
        moving_time_private: string;
        stationary_time_private: string;
        distance_job: string | null;
        distance_private: string | null;
        fuel_used_job: string | null;
        fuel_norm_job: string | null;
        fuel_used_private: string | null;
        fuel_norm_private: string | null;
        object_name: string;
    }
    unresolved_address: {
        lat: number;
        lon: number;
    }[]
}