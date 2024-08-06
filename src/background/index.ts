import { blog, dialog } from "@api/boostyApi";
import { readFromCache, removeExpiredItemsFromCache, removeFromCache, writeToCache, writeToCacheWithTimeout } from "@coreUtils/cache";
import { filterVideoUrls, parseVideoId } from "@coreUtils/videoUtils";
import { ContentMetadata, Data, DialogData, VideoData } from "@models/boosty/types";
import { BackgroundMessageType, ContentMessageType, ContentOptionsMessageType, MessageTarget } from "@models/messages/enums";
import {
    BackgroundMessage,
    ContentDataInfoContentMessage,
    OptionsInfoMessage,
    PlaybackRateInfoContentMessage,
    TimestampInfoContentMessage
} from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import { VideoQualityEnum } from "@models/video/enums";
import { VideoInfo } from "@models/video/types";

const INITIAL_OPTIONS = {
    videoQuality: VideoQualityEnum.Q_1080P,
    fullLayout: false,
    forceVideoQuality: false,
    saveLastTimestamp: false,
    theaterMode: false
};

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _, sendResponse) => {
    if (!message.target.includes(MessageTarget.BACKGROUND)) {
        return;
    }
    switch (message.type) {
        case BackgroundMessageType.OPEN_OPTIONS_PAGE: {
            console.debug("Open options page");

            openOptionsPage();

            break;
        }
        case BackgroundMessageType.REQUEST_TIMESTAMP: {
            console.debug(`Send current timestamp for video with id ${message.data.id}`);

            getTimestampFromCache(message.data.id).then((data) =>
                sendResponse({
                    target: [MessageTarget.CONTENT],
                    type: ContentMessageType.TIMESTAMP_INFO,
                    data: { timestamp: data ?? 0 }
                } as TimestampInfoContentMessage)
            );

            return true;
        }
        case BackgroundMessageType.SAVE_TIMESTAMP: {
            console.debug(`Save timestamp ${message.data.timestamp} for video with id ${message.data.id}`);

            saveTimestampToCache(message.data.id, message.data.timestamp);

            break;
        }
        case BackgroundMessageType.REQUEST_CONTENT_DATA: {
            console.debug("Send content data");

            getVideosContentDataFromBoosty(message.data.metadata, message.data.accessToken).then((contentData) =>
                sendResponse({
                    target: [MessageTarget.CONTENT],
                    type: ContentMessageType.CONTENT_DATA_INFO,
                    data: { contentData }
                } as ContentDataInfoContentMessage)
            );

            return true;
        }
        case BackgroundMessageType.REQUEST_PLAYBACK_RATE: {
            console.debug("Send playback rate");

            getPlaybackRateFromCache().then((data) =>
                sendResponse({
                    target: [MessageTarget.CONTENT],
                    type: ContentMessageType.PLAYBACK_RATE_INFO,
                    data: { playbackRate: data ?? 1 }
                } as PlaybackRateInfoContentMessage)
            );

            return true;
        }
        case BackgroundMessageType.SAVE_PLAYBACK_RATE: {
            console.debug(`Save playback rate ${message.data.playbackRate}`);

            savePlaybackRateToCache(message.data.playbackRate);

            break;
        }
        case BackgroundMessageType.REQUEST_OPTIONS: {
            console.debug("Send extension options");

            getOptionsFromCache().then((data) =>
                sendResponse({
                    target: [MessageTarget.CONTENT, MessageTarget.OPTIONS],
                    type: ContentOptionsMessageType.OPTIONS_INFO,
                    data: { options: data }
                } as OptionsInfoMessage)
            );

            return true;
        }
        case BackgroundMessageType.SAVE_OPTIONS: {
            console.debug(`Save options ${message.data.options}`);

            saveOptionsToCache(message.data.options);
            break;
        }
        default: {
            break;
        }
    }
});

/**
 * Retrieve content data from Boosty API
 *
 * @param {ContentMetadata} metadata Metadata with information for retrieving content from Boosty
 * @param {string} accessToken Access token for Boosty API
 * @returns {Promise<VideoInfo[]|null>} Videos content data
 */
async function getVideosContentDataFromBoosty(metadata: ContentMetadata, accessToken: string): Promise<VideoInfo[] | null> {
    let key: string;

    console.group(`Content data for ${metadata.id}`);
    console.debug("Metadata:", metadata);

    switch (metadata.type) {
        case "post": {
            key = `p:${metadata.id}`;
            break;
        }
        case "dialog": {
            key = `d:${metadata.id}`;
            break;
        }
        // skip default
    }

    const cachedData = await readFromCache<VideoInfo[]>(key);
    if (cachedData) {
        console.debug("✅ Retrieving from cache");
        console.groupEnd();
        return cachedData.data;
    }
    console.debug("⚠️ Cache is empty, retrieving from API");

    let data;

    switch (metadata.type) {
        case "post": {
            data = await blog(metadata, accessToken);
            break;
        }
        case "dialog": {
            data = await dialog(metadata, accessToken);
            break;
        }
        // skip default
    }

    // We need videos only (localStorage is not that big)
    const videos = filterVideos(data, metadata.type);

    // 5 minutes is enough (in case the post was edited)
    await writeToCacheWithTimeout(key, videos, 5);

    console.debug(`✅ ${metadata.id} from API`, videos);
    console.groupEnd();

    return videos;
}

/**
 * Returns the filtered post content (only videos)
 *
 * @param {(Data[]|DialogData[])} data API response data
 * @param {("post"|"dialog")} type Type of request
 * @returns {VideoInfo[]} Videos info
 */
function filterVideos(data: Data[] | DialogData[], type: "post" | "dialog"): VideoInfo[] {
    const dataToFilter = type === "dialog" ? (data as DialogData[]).flatMap((message: DialogData) => message.data) : (data as Data[]);

    return (dataToFilter.filter((block) => block.type === "ok_video") as VideoData[]).map(({ playerUrls, preview }) => {
        const videoUrls = filterVideoUrls(playerUrls);
        const videoId = parseVideoId(preview);
        return { videoUrls, videoId };
    });
}

/**
 * Save the current timestamp to cache or remove it from cache if {timestamp} is 0

 * @param {string} id Timestamp ID
 * @param {number} timestamp Timestamp in seconds
 */
async function saveTimestampToCache(id: string, timestamp: number) {
    const key = `t:${id}`;
    await (timestamp === 0 ? removeFromCache(key) : writeToCacheWithTimeout(key, timestamp));
}

/**
 * Get the last timestamp from cache

 * @param {string} id Timestamp ID
 * @returns {Promise<number|null|undefined>} Timestamp from cache
 */
async function getTimestampFromCache(id: string): Promise<number | null | undefined> {
    console.group(`Timestamp data for ${id}`);
    const timestamp = await readFromCache<number>(`t:${id}`);
    console.groupEnd();

    return timestamp?.data;
}

/**
 * Get playback rate from cache
 *
 * @returns {Promise<number|null|undefined>} Playback rate from cache
 */
async function getPlaybackRateFromCache(): Promise<number | null | undefined> {
    const data = await readFromCache<number>("playbackRate");
    return data?.data;
}

/**
 * Save the current playback rate to cache
 *
 * @param {number} playbackRate Current playback rate
 */
async function savePlaybackRateToCache(playbackRate: number) {
    await writeToCacheWithTimeout("playbackRate", playbackRate);
}

/**
 * Open options page
 */
function openOptionsPage() {
    chrome.runtime.openOptionsPage();
}

/**
 * Get extension options from cache
 *
 * @returns {Promise<UserOptions>} Extension options from cache
 */
async function getOptionsFromCache(): Promise<UserOptions> {
    const data = await readFromCache<UserOptions>("options");
    return data?.data ?? INITIAL_OPTIONS;
}

/**
 * Save the updated extension options to cache
 *
 * @param {UserOptions} options Updated extension options
 */
async function saveOptionsToCache(options: UserOptions) {
    await writeToCache("options", options);
}

/**
 * Install/update listener
 */
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("static/assets/icon.png"),
            title: chrome.i18n.getMessage("options_restart_required"),
            message: chrome.i18n.getMessage("options_restart_alert"),
            requireInteraction: true,
            silent: false
        });

        openOptionsPage();
        return;
    }

    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE && chrome.runtime.getManifest().version !== details.previousVersion) {
        let notificationID: string | undefined;
        chrome.notifications.create(
            {
                type: "basic",
                iconUrl: chrome.runtime.getURL("static/assets/icon.png"),
                title: "",
                message: chrome.i18n.getMessage("extension_has_been_updated"),
                contextMessage: `v${chrome.runtime.getManifest().version}`,
                buttons: [
                    {
                        title: chrome.i18n.getMessage("changelog")
                    }
                ],
                requireInteraction: true,
                silent: true
            },
            (id) => {
                notificationID = id;
            }
        );

        chrome.notifications.onButtonClicked.addListener((_notificationId, buttonIndex) => {
            if (_notificationId === notificationID && buttonIndex === 0) {
                chrome.tabs.create({ url: "https://boosty.to/#mb-update" });
            }

            if (notificationID !== undefined) {
                chrome.notifications.clear(notificationID);
            }
        });
    }
});

/**
 * Cache governor
 * Checks for expired cache items every hour
 */
chrome.alarms.clearAll();
chrome.alarms.create("cache-governor", {
    periodInMinutes: 60
});
chrome.alarms.onAlarm.addListener(removeExpiredItemsFromCache);
