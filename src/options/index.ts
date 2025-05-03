import "./styles/options.scss";

import sendMessage from "@coreUtils/messagesUtils";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import {
    OptionsInfoMessage,
    RequestOptionsBackgroundMessage,
    SaveOptionsBackgroundMessage,
    SaveSyncOptionBackgroundMessage,
    SyncOptionsBackgroundMessage
} from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import { VideoQualityEnum } from "@models/video/enums";

import { $enum } from "ts-enum-util";

let options: UserOptions | undefined;

/**
 * Localize options page
 */
for (const element of document.querySelectorAll<HTMLElement>("[data-locale]")) {
    const text = element.dataset.locale ? chrome.i18n.getMessage(element.dataset.locale) : undefined;
    if (!text) {
        continue;
    }
    element.textContent = text;
}

/**
 * Create new Chrome tab with given {@link url}
 *
 * @param {string} url Url to open in new tab
 */
function createChromeTab(url: string) {
    chrome.tabs.create({ url });
}

/**
 * Add listeners for options page bottom links
 */
const links = document.querySelectorAll<HTMLElement>(".open-url");
for (const element of links) {
    element.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault();
        const url = (event.target as HTMLElement).getAttribute("href");
        if (url) {
            createChromeTab(url);
        }
    });
}

/**
 * Send message to background for save extension options to cache
 *
 * @param {UserOptions} _options Options to save
 */
function saveOptions(_options: UserOptions) {
    options = _options;
    sendMessage<SaveOptionsBackgroundMessage>({
        type: BackgroundMessageType.SAVE_OPTIONS,
        target: [MessageTarget.BACKGROUND],
        data: { options }
    });
}

/**
 * Update options values in form from message
 *
 * @param {(void|OptionsInfoMessage)} message Options info message
 */
function updateOptionsFromMessage(message: void | OptionsInfoMessage) {
    if (!message) {
        console.error("Options form not updated: Incorrect options info message. Need to reload page", message);
        return;
    }

    const { options: _options } = message.data;

    const optionsForm = document.querySelector("#options-form") as HTMLFormElement | null;

    if (!optionsForm) {
        console.warn('Options form not updated: Options form by selector "#options-form" not found. Need to reload page');
        return;
    }

    optionsForm.forceVideoQuality.checked = _options.forceVideoQuality;
    optionsForm.fullLayout.checked = _options.fullLayout;
    optionsForm.theaterMode.checked = _options.theaterMode;
    optionsForm.darkTheme.checked = _options.darkTheme;
    optionsForm.sync.checked = _options.sync;
    optionsForm.saveLastTimestamp.checked = _options.saveLastTimestamp;
    optionsForm.videoQuality.value = _options.videoQuality;
}

/**
 * Configure options form
 */
function optionsConfigure() {
    const optionsForm = document.querySelector("#options-form") as HTMLFormElement | null;

    if (!optionsForm) {
        console.error('Options not configured: Option form by selector "#options-form" not found');
        return;
    }

    if (!options) {
        console.error("Options not configured: Options not loaded");
        return;
    }

    optionsForm.forceVideoQuality.checked = options.forceVideoQuality;
    optionsForm.fullLayout.checked = options.fullLayout;
    optionsForm.theaterMode.checked = options.theaterMode;
    optionsForm.darkTheme.checked = options.darkTheme;
    optionsForm.sync.checked = options.sync;
    optionsForm.saveLastTimestamp.checked = options.saveLastTimestamp;
    optionsForm.videoQuality.value = options.videoQuality;

    optionsForm.forceVideoQuality.addEventListener("change", (event: Event) => {
        const isForceVideoQualityChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ...options,
            forceVideoQuality: isForceVideoQualityChecked
        } as UserOptions);
    });
    optionsForm.fullLayout.addEventListener("change", (event: Event) => {
        const isFullLayoutChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ...options,
            fullLayout: isFullLayoutChecked
        } as UserOptions);
    });
    optionsForm.theaterMode.addEventListener("change", (event: Event) => {
        const isTheaterModeChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ...options,
            theaterMode: isTheaterModeChecked
        } as UserOptions);
    });
    optionsForm.darkTheme.addEventListener("change", (event: Event) => {
        const isDarkThemeChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ...options,
            darkTheme: isDarkThemeChecked
        } as UserOptions);
    });
    optionsForm.sync.addEventListener("change", (event: Event) => {
        const isSyncChecked = (event.target as HTMLInputElement).checked;

        options = { ...options, sync: isSyncChecked } as UserOptions;

        sendMessage<SaveSyncOptionBackgroundMessage, OptionsInfoMessage>({
            type: BackgroundMessageType.SAVE_SYNC_OPTION,
            target: [MessageTarget.BACKGROUND],
            data: { sync: isSyncChecked }
        }).then(updateOptionsFromMessage);
    });
    optionsForm.saveLastTimestamp.addEventListener("change", (event: Event) => {
        const isSaveLastTimestampChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ...options,
            saveLastTimestamp: isSaveLastTimestampChecked
        } as UserOptions);
    });
    optionsForm.videoQuality.addEventListener("change", (event: Event) => {
        const videoQualityOptionValue = (event.target as HTMLSelectElement).value;
        saveOptions({
            ...options,
            videoQuality: $enum(VideoQualityEnum).asValueOrDefault(videoQualityOptionValue, VideoQualityEnum.Q_1080P)
        } as UserOptions);
    });
}

/**
 * Generate video quality options for force video quality select
 *
 * @param {UserOptions} _options Current extension options
 */
function generateVideoQualityOptions(_options: UserOptions) {
    const videoQualityOptions = document.querySelector<HTMLSelectElement>("#videoQuality");
    const forceVideoQuality = document.querySelector<HTMLInputElement>("input[name=forceVideoQuality]");

    if (!videoQualityOptions) {
        console.error('Video quality select not configured: Video quality select by selector "#videoQuality" not found');
        return;
    }

    if (!forceVideoQuality) {
        console.error(
            'Video quality select not configured: Force video quality checkbox by selector "input[name=forceVideoQuality]" not found'
        );
        return;
    }

    videoQualityOptions.disabled = !_options.forceVideoQuality;

    for (const quality of $enum(VideoQualityEnum).getValues()) {
        const option = document.createElement("option");
        option.value = quality;
        option.textContent = quality;
        videoQualityOptions.append(option);
    }

    videoQualityOptions.value = _options.videoQuality;

    forceVideoQuality.addEventListener("change", (event: Event) => {
        videoQualityOptions.disabled = !(event.currentTarget as HTMLInputElement).checked;
    });
}

/**
 * Configure cache sync button
 */
function configureCacheSyncButton() {
    const cacheSyncButton = document.querySelector<HTMLButtonElement>("#cache-sync-button");

    if (!cacheSyncButton) {
        console.error('Cache sync button not configured: Cache sync button by selector "#cache-sync-button" not found');
        return;
    }

    cacheSyncButton.addEventListener("click", () => {
        sendMessage<SyncOptionsBackgroundMessage, OptionsInfoMessage>({
            type: BackgroundMessageType.SYNC_OPTIONS,
            target: [MessageTarget.BACKGROUND]
        }).then(updateOptionsFromMessage);
    });
}

/**
 * Init options page function
 */
async function init() {
    const cachedOptions = await sendMessage<RequestOptionsBackgroundMessage, OptionsInfoMessage>({
        type: BackgroundMessageType.REQUEST_OPTIONS,
        target: [MessageTarget.BACKGROUND]
    });

    if (!cachedOptions) {
        console.warn("Options startup error: The storage does not contain any options.");
        return;
    }
    options = cachedOptions.data.options;

    console.debug("Options from cache", options);

    optionsConfigure();
    generateVideoQualityOptions(options);
    configureCacheSyncButton();
}

init();
