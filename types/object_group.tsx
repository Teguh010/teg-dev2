// object_group.list
export interface objectGroupListResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface objectGroupListResultVehicle {
    id: number
    val: string
    editable: boolean
    owner_id: number
    owner: string
}

export interface objectGroupListResult extends Array<objectGroupListResultVehicle> { }

// object_group.object_list
export interface objectGroupObjectListResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

export interface objectGroupObjectListResultVehicle {
    id: number
    name: string
}

export interface objectGroupObjectListResult extends Array<objectGroupObjectListResultVehicle> { }
