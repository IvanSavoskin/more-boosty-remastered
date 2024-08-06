import "./options.scss";

import { $enum } from "ts-enum-util";

import { sendMessage } from "@coreUtils/messagesUtils";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import { OptionsInfoMessage, RequestOptionBackgroundMessage, SaveOptionBackgroundMessage } from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import { VideoQualityEnum } from "@models/video/enums";

let options: UserOptions | undefined;

/**
 * Dark mode
 */
if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset.theme = "dark";
}

/**
 * Locales
 */
for (const element of document.querySelectorAll<HTMLElement>("[data-locale]")) {
    const text = element.dataset.locale ? chrome.i18n.getMessage(element.dataset.locale) : undefined;
    if (!text) {
        continue;
    }
    element.textContent = text;
}

function createChromeTab(url: string) {
    chrome.tabs.create({ url });
}

/**
 * Links
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

function saveOptions(_options: UserOptions) {
    options = _options;
    sendMessage<SaveOptionBackgroundMessage>({
        type: BackgroundMessageType.SAVE_OPTIONS,
        target: [MessageTarget.BACKGROUND],
        data: { options }
    });
}

/**
 * Options
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
 * Video quality stuff
 */
function generateVideoQualityOptions(_options: UserOptions) {
    const videoQualityOptions = document.querySelector<HTMLSelectElement>("#videoQuality");
    const forceVideoQuality = document.querySelector<HTMLInputElement>("input[name=forceVideoQuality]");

    if (videoQualityOptions && forceVideoQuality) {
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
}

/**
 * Main function
 * @async
 */
const init = async () => {
    const cachedOptions = await sendMessage<RequestOptionBackgroundMessage, OptionsInfoMessage>({
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
};

init();
