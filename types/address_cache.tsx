//address_cache.get
export interface addressCacheGetResponse {
    id: string;
    jsonrpc: string;
    result: string;
}

//address_cache.add
export interface addressCacheAddResponse {
    id: string;
    jsonrpc: string;
    result: boolean;
}
