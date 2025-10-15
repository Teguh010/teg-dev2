// datatype.list
export interface datatypeListResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface datatypeListResultItem {
    id: number;
    name: string;
    round_to_digits: number;
    measure_type_id: number;
    multiplier: number;
    valid_min: number;
    valid_max: number;
}

/* export interface datatypeListResult {
    items: datatypeListResultItem[]
} */

export interface datatypeListResult extends Array<datatypeListResultItem> { }