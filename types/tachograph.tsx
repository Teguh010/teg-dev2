//tacho_analysis_service.authorize
export interface tachoAnalysisServiceAuthorizeResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface tachoAnalysisServiceAuthorizeResult {
    service_provider_id: number
    token: {
        TokenValue: string;
        ExpirationDate: string;
    }
}

//tachograph.get_drivers_list
export interface getDriverListResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface getDriverListResultVehicle {
    id: number
    name: string
}

export interface getDriverListResult extends Array<getDriverListResultVehicle> { }

//tachograph.get_drivers_list
export interface getVechicleListResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface getVechicleListResultVehicle {
    id: number
    name: string
}

export interface tachoLiveDrivingStateStatsItem {
  id: number;
  name: string;
  stats: Array<{
    ignition: string;
    gpstime: string;
    driver_state: number;
    total_drive_time: number | null;
    current_activity_duration: number | null;
    cont_drive_time: number;
    brake_time: number;
    drive_time: number | null;
    current_daily_drive_time: number;
    current_weekly_drive_time: number;
    time_left_until_daily_rest: number;
    times_9h_driving_exceeded: number;
    remaining_10h_times: number;
    total_break_time: number | null;
    time_related_state: number | null;
    reduced_daily_rests_remaining: number;
    minimum_daily_rest: number;
    remaining_time_before_weekly_rest: number;
    remaining_current_drive_time: number;
    remaining_drive_time_current_shift: number | null;
    remaining_drive_time_current_week: number;
    remaining_time_before_next_drv_period: number;
    remaining_drv_time_of_next_drv_period: number;
    remaining_time_of_current_rest_period: number;
    remaining_time_of_next_rest_period: number;
    compensation_time_of_prev_week: number | null;
    compensation_time_of_2nd_prev_week: number | null;
    compensation_time_of_3rd_prev_week: number | null;
  }>;
}

export interface tachoLiveDrivingStateStatsResult extends Array<tachoLiveDrivingStateStatsItem> {}

export interface getVechicleListResult extends Array<getVechicleListResultVehicle> { }