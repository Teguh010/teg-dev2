export interface settingListResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface settingListResultSetting {
    key: string;
    vle: string;
    is_global: boolean;
}

export interface objectListResult {
    items: settingListResultSetting[]
}