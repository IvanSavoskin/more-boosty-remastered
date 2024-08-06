import { DateTime } from "luxon";

import { CacheData, TimeoutCacheData } from "@models/cache/types";

import { DEFAULT_TIMEOUT, generateTimeout, msToReadable } from "./timeUtils";

const STORAGE = chrome.storage.local;

/**
 * Write data to the cache with timeout
 *
 * @public
 * @template T
 * @param {string} key Cache key
 * @param {T} data Data to write
 */
export async function writeToCache<T>(key: string, data: T) {
    await STORAGE.set({
        [key]: { data }
    });

    console.group(`Cache write for ${key}`);
    console.debug("Data:", data);
    console.groupEnd();
}

/**
 * Write data to the cache with timeout
 *
 * @public
 * @template T
 * @param {string} key Cache key
 * @param {T} data Data to write
 * @param {number} [timeout=10080] Timeout in minutes
 */
export async function writeToCacheWithTimeout<T>(key: string, data: T, timeout: number = DEFAULT_TIMEOUT) {
    const millisecondsTimeout = generateTimeout(timeout);

    await STORAGE.set({
        [key]: {
            data,
            timeout: millisecondsTimeout
        }
    });

    console.group(`Cache write for ${key}`);
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
 * @returns {Promise<TimeoutCacheData<T>|CacheData<T>|null|undefined>} Data from cache
 */
export async function readFromCache<T>(key: string): Promise<TimeoutCacheData<T> | CacheData<T> | null | undefined> {
    const cachedData = await STORAGE.get(key);
    const data: TimeoutCacheData<T> | CacheData<T> | undefined | null = cachedData[key];

    console.group(`Cache read for ${key}`);
    if (data && "timeout" in data && data.data) {
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

    if (data && data.data) {
        console.debug("Data:", data.data);
        console.groupEnd();
        return data;
    }
    console.debug("No data");
    console.groupEnd();
    return null;
}

/**
 * Remove from the cache
 *
 * @public
 * @param {string} key Cache key
 */
export async function removeFromCache(key: string) {
    await STORAGE.remove(key);

    console.debug(`Cache removal for ${key}`);
}

/**
 * Remove expired items
 *
 * @public
 */
export async function removeExpiredItemsFromCache() {
    console.group("Cache governor started");

    const cachedData: { [key: string]: any } = await STORAGE.get(null);

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
        await removeFromCache(key);
        removedCount++;
    }

    console.groupEnd();
    console.debug(`${removedCount} items were expired and removed`);
}

/**
 * Check if the cache data exists and not expired
 * @param {(TimeoutCacheData|null)} [data]
 * @returns
 */
function existsAndNotExpired(data: TimeoutCacheData | null | undefined) {
    return data && data.timeout && data.data && DateTime.now() <= DateTime.fromMillis(data.timeout);
}
