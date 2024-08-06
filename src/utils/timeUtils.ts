import { Duration } from "luxon";

export const DEFAULT_TIMEOUT = 24 * 60 * 7; // 10080 minutes

/**
 * Convert milliseconds to readable timestamp
 *
 * @param {number} milliseconds Milliseconds
 * @returns {string} Readable timestamp
 */
export function msToReadable(milliseconds: number): string {
    return Duration.fromMillis(milliseconds).toFormat("dd 'days' hh 'hours' mm 'minutes' ss 'seconds");
}

/**
 * Generate a milliseconds timeout value from minutes
 *
 * @param {number} [timeout=10080] Timeout in minutes
 * @returns {number} Timeout in milliseconds
 */
export const generateTimeout = (timeout: number = DEFAULT_TIMEOUT): number => {
    return Date.now() + timeout * 60 * 1000;
};
