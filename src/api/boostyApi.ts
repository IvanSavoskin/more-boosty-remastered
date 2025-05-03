import { BlogContentMetadata, BlogResponse, Data, DialogContentMetadata, DialogData, DialogResponse } from "@models/boosty/types";

import axios, { AxiosResponse } from "axios";

const API_URL = "https://api.boosty.to/v1/";

// Dialog API related constants
const DEFAULT_OFFSET = Number.MAX_SAFE_INTEGER;
const DEFAULT_LIMIT = 300;

/**
 * Retrieve blog data from Boosty API
 *
 * @param {BlogContentMetadata} metadata Metadata with information for retrieving content from Boosty
 * @param {string} accessToken Access token for Boosty API
 * @returns {Promise<Data[]>} Blog data
 */
export async function blog(metadata: BlogContentMetadata, accessToken: string): Promise<Data[]> {
    const endpoint = `blog/${metadata.blogName}/post/${metadata.id}?component_limit=0`;
    const response = await sendWithAuthorization<BlogResponse>(endpoint, accessToken);

    return response.data;
}

/**
 * Retrieve dialog data from Boosty API
 *
 * @param {BlogContentMetadata} metadata Metadata with information for retrieving content from Boosty
 * @param {string} accessToken Access token for Boosty API
 * @returns {Promise<DialogData[]>} Dialog data
 */
export async function dialog(metadata: DialogContentMetadata, accessToken: string): Promise<DialogData[]> {
    const endpoint = `dialog/${metadata.id}/message/?limit=${DEFAULT_LIMIT}&reverse=true&offset=${DEFAULT_OFFSET}`;
    const response = await sendWithAuthorization<DialogResponse>(endpoint, accessToken);

    return response.data;
}

/**
 * Send request to Boosty API with authorization
 *
 * @template T
 * @param {string} endpoint Endpoint for request
 * @param {string} accessToken Access token for Boosty API
 * @returns {Promise<T>} Boosty API response
 */
async function sendWithAuthorization<T>(endpoint: string, accessToken: string): Promise<T> {
    const response: AxiosResponse<T> = await axios.get<T>(`${API_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
}
