export interface CacheData<T = any> {
    data: T;
}

export interface TimeoutCacheData<T = any> {
    data: T;
    timeout: number;
}

export type Cache<T = any> = TimeoutCacheData<T> | CacheData<T> | null | undefined;
