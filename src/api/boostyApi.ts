import { BlogContentMetadata, BlogResponse, Data, DialogContentMetadata, DialogData, DialogResponse } from "@models/boosty/types";
import { BoostyTargetResponse } from "@models/currency/types";

import axios, { AxiosResponse } from "axios";

const API_URL = "https://api.boosty.to/v1/";

// Dialog API related constants
const DEFAULT_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_LIMIT = 300;

/**
 * Retrieve blog data from Boosty API
 *
 * @param {BlogContentMetadata} metadata Metadata with information for retrieving content from Boosty
 * @param {string} [accessToken] Access token for protected Boosty content
 * @returns {Promise<Data[]>} Blog data
 */
export async function blog(metadata: BlogContentMetadata, accessToken?: string): Promise<Data[]> {
    const endpoint = `blog/${metadata.blogName}/post/${metadata.id}?component_limit=0`;
    const response = await sendWithAuthorization<BlogResponse>(endpoint, accessToken);

    return response.data;
}

/**
 * Retrieve dialog data from Boosty API
 *
 * @param {BlogContentMetadata} metadata Metadata with information for retrieving content from Boosty
 * @param {string} [accessToken] Access token for protected Boosty content
 * @returns {Promise<DialogData[]>} Dialog data
 */
export async function dialog(metadata: DialogContentMetadata, accessToken?: string): Promise<DialogData[]> {
    const endpoint = `dialog/${metadata.id}/message/?limit=${DEFAULT_LIMIT}&reverse=true&offset=${DEFAULT_OFFSET}`;
    const response = await sendWithAuthorization<DialogResponse>(endpoint, accessToken);

    return response.data;
}

/**
 * Retrieve target data from Boosty API
 *
 * @param {string} targetId Boosty target identifier
 * @param {string} currency Currency code for target conversion
 * @returns {Promise<BoostyTargetResponse>} Boosty target data
 */
export async function target(targetId: string, currency: string): Promise<BoostyTargetResponse> {
    return send<BoostyTargetResponse>(`target/${targetId}?currency=${currency}`);
}

/**
 * Send request to Boosty API
 *
 * @template T
 * @param {string} endpoint Endpoint for request
 * @returns {Promise<T>} Boosty API response
 */
async function send<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await axios.get<T>(`${API_URL}${endpoint}`);

    return response.data;
}

/**
 * Send request to Boosty API with authorization
 *
 * @template T
 * @param {string} endpoint Endpoint for request
 * @param {string} [accessToken] Access token for protected Boosty content
 * @returns {Promise<T>} Boosty API response
 */
async function sendWithAuthorization<T>(endpoint: string, accessToken?: string): Promise<T> {
    try {
        const response: AxiosResponse<T> = await axios.get<T>(`${API_URL}${endpoint}`, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
        });

        return response.data;
    } catch (error) {
        if (accessToken && axios.isAxiosError(error) && error.response?.status === 401) {
            console.warn("Boosty access token was rejected. Retrying public API request without authorization");
            return send<T>(endpoint);
        }

        throw error;
    }
}
