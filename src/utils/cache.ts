import { DateTime } from "luxon";

import { CacheData, TimeoutCacheData } from "@models/cache/types";

import { DEFAULT_TIMEOUT, generateTimeout, msToReadable } from "./timeUtils";
import StorageArea = chrome.storage.StorageArea;

const LOCAL_STORAGE = chrome.storage.local;
const SYNC_STORAGE = chrome.storage.sync;

/**
 * Write data to the cache with timeout
 *
 * @public
 * @template T
 * @param {string} key Cache key
 * @param {T} data Data to write
 * @param {boolean} [sync=false] Whether to use sync storage
 */
export async function writeToCache<T>(key: string, data: T, sync: boolean = false) {
    await getStorage(sync).set({
        [key]: { data }
    });

    console.group(`Cache write for ${key} (${sync ? "sync" : "local"})`);
    console.debug("Data:", data);
    console.groupEnd();
}

/**
 * Write data to the cache with timeout
 *
 * @template T
 * @param {string} key Cache key
 * @param {T} data Data to write
 * @param {number} [timeout=10080] Timeout in minutes
 * @param {boolean} [sync=false] Whether to use sync storage
 */
export async function writeToCacheWithTimeout<T>(key: string, data: T, timeout: number = DEFAULT_TIMEOUT, sync: boolean = false) {
    const millisecondsTimeout = generateTimeout(timeout);

    await getStorage(sync).set({
        [key]: {
            data,
            timeout: millisecondsTimeout
        }
    });

    console.group(`Cache write for ${key} (${sync ? "sync" : "local"})`);
    console.debug("Data:", data);
    console.debug("Expires on:", new Date(millisecondsTimeout));
    console.debug("Expires in:", msToReadable(millisecondsTimeout - Date.now()));
    console.groupEnd();
}

/**
 * Read data from the cache
 *
 * @public
 * @template T
 * @param {string} key Cache key
 * @param {boolean} [sync=false] Whether to use sync storage
 * @returns {Promise<TimeoutCacheData<T>|CacheData<T>|null|undefined>} Data from cache
 */
export async function readFromCache<T>(key: string, sync: boolean = false): Promise<TimeoutCacheData<T> | CacheData<T> | null | undefined> {
    const cachedData = await getStorage(sync).get(key);
    const data: TimeoutCacheData<T> | CacheData<T> | undefined | null = cachedData[key];

    console.group(`Cache read for ${key} (${sync ? "sync" : "local"})`);

    if (data && typeof data !== "object") {
        console.warn(`Cache data by key "${key}" from ${sync ? "sync" : "local"} storage is not an object`, data);
        console.groupEnd();
        return null;
    }

    if (data && "timeout" in data && data.data !== undefined) {
        console.debug("Data:", data.data);
        console.debug("Expires on:", new Date(data.timeout));
        console.debug("Expires in:", msToReadable(data.timeout - Date.now()));

        if (existsAndNotExpired(data)) {
            console.debug("✅ Not expired");
            console.groupEnd();
            return data;
        }

        console.debug("⚠️ Expired, returning `null`");
        console.groupEnd();
        return null;
    }

    if (data && data.data !== undefined) {
        console.debug("Data:", data.data);
        console.groupEnd();
        return data;
    }
    console.debug("No data");
    console.groupEnd();
    return null;
}

export async function readAllFromCache(sync: boolean = false): Promise<{ [key: string]: any }> {
    return (await getStorage(sync).get(null)) as { [key: string]: any };
}

/**
 * Remove from the cache
 *
 * @public
 * @param {string} key Cache key
 * @param {boolean} [sync=false] Whether to use sync storage
 */
export async function removeFromCache(key: string, sync: boolean = false) {
    await getStorage(sync).remove(key);

    console.debug(`Cache removal for ${key} (${sync ? "sync" : "local"})`);
}

/**
 * Remove expired items
 *
 * @param {boolean} [sync=false] Whether to use sync storage
 */
export async function removeExpiredItemsFromCache(sync: boolean = false) {
    console.group(`Cache governor started (${sync ? "sync" : "local"})`);

    const cachedData = await readAllFromCache(sync);

    let removedCount = 0;
    for (const [key, data] of Object.entries(cachedData)) {
        if (data && !("timeout" in data)) {
            continue;
        }

        if (existsAndNotExpired(data)) {
            console.debug(`${key} is fine, continuing...`);
            continue;
        }

        console.debug(`Removing ${key}...`);
        await removeFromCache(key, sync);
        removedCount++;
    }

    console.groupEnd();
    console.debug(`${removedCount} items were expired and removed`);
}

/**
 * Check if the cache data exists and not expired
 *
 * @param {(TimeoutCacheData|null)} [data] Data from cache
 * @returns boolean Is data exists and not expired
 */
function existsAndNotExpired(data: TimeoutCacheData | null | undefined): boolean {
    return data && data.timeout && data.data && DateTime.now() <= DateTime.fromMillis(data.timeout);
}

/**
 * Check if the cache data exists and not expired
 *
 * @param {boolean} sync Whether to use sync storage
 * @returns StorageArea
 */
function getStorage(sync: boolean): StorageArea {
    return sync ? SYNC_STORAGE : LOCAL_STORAGE;
}
