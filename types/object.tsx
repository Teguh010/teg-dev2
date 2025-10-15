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

/* export interface objectListResult {
    items: objectListResultVehicle[]
} */

export type objectListResult = objectListResultVehicle[];

// object.last_position
export interface objectLastPositionResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

interface InvalidMsgData {
    [key: number]: string;
}
interface MsgData {
    [key: number]: string;
}

export interface objectLastPositionResultVehicle {
    cached_address: string;
    customer: string | null;
    digi_out1_state: number;
    digi_out2_state: number;
    digi_out3_state: number;
    digi_out4_state: number;
    driver_name: string | null;
    gpstime: string;
    has_alarms: boolean;
    has_alerts: boolean;
    icon_file: string;
    ignition: string | null;
    in_progress: string | null;
    in_state_since: string;
    invalid_msg_data: InvalidMsgData;
    last_alarm_message: string | null;
    last_timestamp: string;
    lat: number;
    lon: number;
    messageid: number;
    msg_data: MsgData;
    object_name: string;
    objectid: number;
    speed: number;
    trip_state: string;
    vectorangle: number;
    visiblesatelites: number;
    worker_id: string | null;
}

/* export interface objectLastPositionResult {
    items: objectLastPositionResultVehicle[]
} */

export type objectLastPositionResult = objectLastPositionResultVehicle[];

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

// 
export interface objectGroupListResult {
    id: number
    val: string
    editable: boolean
    owner_id: number
    owner: string
}

export interface objectTrajectoryResult {
  time: string
  lat: number
  lon: number
  angl: number | null
  spd: number | null
  state_chng: string | null
}

export type objectTrajectoryResultArray = objectTrajectoryResult[];

// Type untuk kompatibilitas dengan MapData interface
export interface objectTrajectoryMapData extends objectTrajectoryResult {
  [key: string]: Date | string | number | boolean | undefined;
}

export type objectTrajectoryMapDataArray = objectTrajectoryMapData[];
