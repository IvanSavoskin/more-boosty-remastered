import { blog, dialog } from "@api/boostyApi";
import {
    readAllFromCache,
    readFromCache,
    removeExpiredItemsFromCache,
    removeFromCache,
    writeToCache,
    writeToCacheWithTimeout
} from "@coreUtils/cache";
import changelog from "@coreUtils/changelog";
import { filterVideoUrls, parseVideoId } from "@coreUtils/videoUtils";
import { ContentMetadata, Data, DialogData, VideoData } from "@models/boosty/types";
import { BackgroundMessageType, ContentMessageType, ContentOptionsMessageType, MessageTarget } from "@models/messages/enums";
import {
    BackgroundMessage,
    ContentDataInfoContentMessage,
    OptionsInfoMessage,
    PlaybackRateInfoContentMessage,
    ThemeInfoContentMessage,
    TimestampInfoContentMessage
} from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import ThemeEnum from "@models/theme/enums";
import { VideoQualityEnum } from "@models/video/enums";
import { VideoInfo } from "@models/video/types";

const INITIAL_OPTIONS = {
    videoQuality: VideoQualityEnum.Q_1080P,
    fullLayout: false,
    forceVideoQuality: false,
    saveLastTimestamp: false,
    theaterMode: false,
    darkTheme: false,
    sync: false
};

let SYNC = false;

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

            getTimestampFromCache(message.data.id, SYNC).then((timestamp) =>
                sendResponse({
                    target: [MessageTarget.CONTENT],
                    type: ContentMessageType.TIMESTAMP_INFO,
                    data: { timestamp: timestamp ?? 0 }
                } as TimestampInfoContentMessage)
            );

            return true;
        }
        case BackgroundMessageType.SAVE_TIMESTAMP: {
            console.debug(`Save timestamp ${message.data.timestamp} for video with id ${message.data.id}`);

            saveTimestampToCache(message.data.id, message.data.timestamp, SYNC);

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

            getPlaybackRateFromCache().then((playbackRate) =>
                sendResponse({
                    target: [MessageTarget.CONTENT],
                    type: ContentMessageType.PLAYBACK_RATE_INFO,
                    data: { playbackRate: playbackRate ?? 1 }
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

            getOptionsFromCache(SYNC).then((options) =>
                sendResponse({
                    target: [MessageTarget.CONTENT, MessageTarget.OPTIONS],
                    type: ContentOptionsMessageType.OPTIONS_INFO,
                    data: { options: options ?? { ...INITIAL_OPTIONS, sync: SYNC } }
                } as OptionsInfoMessage)
            );

            return true;
        }
        case BackgroundMessageType.SAVE_SYNC_OPTION: {
            console.debug("Save sync options", message.data.sync);

            saveSyncOptionToCache(message.data.sync).then(() => {
                getOptionsFromCache(SYNC).then((options) => {
                    sendResponse({
                        target: [MessageTarget.CONTENT, MessageTarget.OPTIONS],
                        type: ContentOptionsMessageType.OPTIONS_INFO,
                        data: { options: options ?? { ...INITIAL_OPTIONS, sync: SYNC } }
                    } as OptionsInfoMessage);
                });
            });
            return true;
        }
        case BackgroundMessageType.SAVE_OPTIONS: {
            console.debug("Save options", message.data.options);

            saveOptionsToCache(message.data.options, SYNC);
            break;
        }
        case BackgroundMessageType.REQUEST_THEME: {
            console.debug("Send theme");

            getThemeFromCache(SYNC).then((theme) =>
                sendResponse({
                    target: [MessageTarget.CONTENT],
                    type: ContentMessageType.THEME_INFO,
                    data: { theme: theme ?? ThemeEnum.LIGHT_THEME }
                } as ThemeInfoContentMessage)
            );

            return true;
        }
        case BackgroundMessageType.TOGGLE_THEME: {
            console.debug(`Toggle theme`);

            getThemeFromCache(SYNC).then((data) => {
                const newTheme = data === ThemeEnum.DARK_THEME ? ThemeEnum.LIGHT_THEME : ThemeEnum.DARK_THEME;

                console.debug(`New theme ${newTheme}`);

                saveThemeToCache(newTheme, SYNC);
            });

            break;
        }
        case BackgroundMessageType.SYNC_OPTIONS: {
            const from = SYNC ? "local" : "sync";
            const to = SYNC ? "sync" : "local";

            console.debug(`Sync options from ${from} to ${to}`);

            syncCacheData(from, to).then((options) =>
                sendResponse({
                    target: [MessageTarget.CONTENT, MessageTarget.OPTIONS],
                    type: ContentOptionsMessageType.OPTIONS_INFO,
                    data: { options }
                } as OptionsInfoMessage)
            );

            return true;
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
 * @param {boolean} sync Whether to save to sync cache or to local
 */
async function saveTimestampToCache(id: string, timestamp: number, sync: boolean) {
    const key = `t:${id}`;
    if (timestamp === 0) {
        removeFromCache(key, sync);
    } else {
        writeToCacheWithTimeout(key, timestamp, undefined, sync);
    }
}

/**
 * Get the last timestamp from cache

 * @param {string} id Timestamp ID
 * @param {boolean} sync Whether to get from sync cache or from local
 * @returns {Promise<number|null|undefined>} Timestamp from cache
 */
async function getTimestampFromCache(id: string, sync: boolean): Promise<number | null | undefined> {
    console.group(`Timestamp data for ${id}`);
    const timestamp = await readFromCache<number>(`t:${id}`, sync);
    console.groupEnd();

    return timestamp?.data;
}

/**
 * Get the all timestamps from cache

 * @param {boolean} sync Whether to get from sync cache or from local
 * @returns {Promise<number[]>} Timestamp from cache
 */
async function getAllTimestampsFromCache(sync: boolean): Promise<[string, number][]> {
    console.group("Get all timestamps data");

    const allCacheData = await readAllFromCache(sync);
    const timestamps = Object.entries(allCacheData)
        .filter(([key, data]) => data && key.toString().startsWith("t:"))
        .map(([key, data]) => [key.replace("t:", ""), data.data]) as [string, number][];

    console.debug(`Timestamps from ${sync ? "sync" : "local"} cache`, timestamps);
    console.groupEnd();

    return timestamps;
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
 * Get theme from cache
 *
 * @param {boolean} sync Whether to get from sync cache or from local
 * @returns {Promise<ThemeEnum|null|undefined>} Playback rate from cache
 */
async function getThemeFromCache(sync: boolean): Promise<ThemeEnum | null | undefined> {
    const data = await readFromCache<ThemeEnum>("theme", sync);
    return data?.data;
}

/**
 * Save the current theme to cache
 *
 * @param {boolean} sync Whether to save to sync cache or to local
 * @param {ThemeEnum} theme Current playback rate
 */
async function saveThemeToCache(theme: ThemeEnum, sync: boolean) {
    await writeToCache("theme", theme, sync);
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
 * @param {boolean} sync Whether to get from sync cache or from local
 * @returns {Promise<UserOptions|undefined>} Extension options from cache
 */
async function getOptionsFromCache(sync: boolean): Promise<UserOptions | undefined> {
    const data = await readFromCache<UserOptions>("options", sync);
    return data?.data ? { ...data.data, sync: SYNC } : data?.data;
}

/**
 * Save the updated extension options to cache
 *
 * @param {boolean} sync Whether to save to sync cache or to local
 * @param {UserOptions} options Updated extension options
 */
async function saveOptionsToCache(options: UserOptions, sync: boolean) {
    const { sync: _sync, ...data } = options;

    await writeToCache("options", data, sync);
}

/**
 * Get options, theme and timestamps from local cache and save to sync cache
 */
async function syncCacheData(from: "sync" | "local", to: "sync" | "local"): Promise<UserOptions> {
    console.group(`Getting data from ${from} cache and saving to ${to} cache`);

    const isFromSync = from === "sync";
    const isToSync = to === "sync";

    const theme = await getThemeFromCache(isFromSync);
    const options = await getOptionsFromCache(isFromSync);
    const timestamps = await getAllTimestampsFromCache(isFromSync);

    console.debug(`Data from ${from} cache for saving ${to} sync cache`);
    console.debug("Theme", theme);
    console.debug("Options", options);
    console.debug("Timestamp", timestamps);

    if (options) {
        await saveOptionsToCache(options, isToSync);
    }

    if (theme) {
        await saveThemeToCache(theme ?? ThemeEnum.LIGHT_THEME, isToSync);
    }

    for (const timestamp of timestamps) {
        await saveTimestampToCache(timestamp[0], timestamp[1], isToSync);
    }

    console.groupEnd();

    return options ?? { ...INITIAL_OPTIONS, sync: SYNC };
}

/**
 * Save the updated extension sync option to cache
 *
 * @param {boolean} sync Updated extension sync option
 */
async function saveSyncOptionToCache(sync: boolean) {
    await writeToCache("sync", sync);
    SYNC = sync;
    if (SYNC) {
        chrome.alarms.onAlarm.addListener(() => removeExpiredItemsFromCache(SYNC));
    } else {
        chrome.alarms.onAlarm.removeListener(() => removeExpiredItemsFromCache(SYNC));
    }
}

/**
 * Get extension sync option from cache
 */
async function getSyncOptionFromCache(): Promise<boolean> {
    const sync = await readFromCache<boolean>("sync");

    return sync?.data ?? false;
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

    const currentVersion = chrome.runtime.getManifest().version;

    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE && currentVersion !== details.previousVersion) {
        let notificationID: string | undefined;

        const t = (name: string) => chrome.i18n.getMessage(name);
        const uiLang = chrome.i18n.getUILanguage();

        const currentVersionReleaseNotes = changelog[currentVersion];

        if (currentVersionReleaseNotes) {
            chrome.notifications.create(
                {
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("static/assets/icon.png"),
                    title: uiLang === "ru" ? currentVersionReleaseNotes.title.ru : currentVersionReleaseNotes.title.en,
                    message:
                        uiLang === "ru"
                            ? currentVersionReleaseNotes.message.ru.join(", ")
                            : currentVersionReleaseNotes.message.en.join(", "),
                    buttons: [
                        {
                            title: t("changelog")
                        },
                        {
                            title: t("git_hub")
                        }
                    ]
                },
                (id) => {
                    notificationID = id;
                }
            );

            chrome.notifications.onClicked.addListener(() => {
                chrome.tabs.create({ url: "https://boosty.to/#mb-update" });
            });

            chrome.notifications.onButtonClicked.addListener((_notificationId, buttonIndex) => {
                if (_notificationId === notificationID && buttonIndex === 0) {
                    chrome.tabs.create({ url: "https://boosty.to/#mb-update" });
                }

                if (_notificationId === notificationID && buttonIndex === 1) {
                    chrome.tabs.create({ url: currentVersionReleaseNotes.link });
                }

                if (notificationID !== undefined) {
                    chrome.notifications.clear(notificationID);
                }
            });
        } else {
            console.debug(`Release notes for version "${currentVersion}" not found`);
        }
    }
});

getSyncOptionFromCache().then((sync) => {
    SYNC = sync;
});

/**
 * Cache governor
 * Checks for expired cache items every hour
 */
chrome.alarms.clearAll();
chrome.alarms.create("cache-governor", {
    periodInMinutes: 60
});
chrome.alarms.onAlarm.addListener(() => removeExpiredItemsFromCache());
if (SYNC) {
    chrome.alarms.onAlarm.addListener(() => removeExpiredItemsFromCache(SYNC));
}
