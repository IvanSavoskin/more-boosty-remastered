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
function optionsConfigure(_options: UserOptions) {
    const optionsForm = document.querySelector("#options-form") as HTMLFormElement | null;

    if (!optionsForm) {
        console.error('Options not configured: Option form by selector "#options-form" not found');
        return null;
    }

    optionsForm.forceVideoQuality.checked = _options.forceVideoQuality;
    optionsForm.fullLayout.checked = _options.fullLayout;
    optionsForm.theaterMode.checked = _options.theaterMode;
    optionsForm.saveLastTimestamp.checked = _options.saveLastTimestamp;
    optionsForm.videoQuality.value = _options.videoQuality;

    optionsForm.forceVideoQuality.addEventListener("change", (event: Event) => {
        const isForceVideoQualityChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ..._options,
            forceVideoQuality: isForceVideoQualityChecked
        });
    });
    optionsForm.fullLayout.addEventListener("change", (event: Event) => {
        const isFullLayoutChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ..._options,
            fullLayout: isFullLayoutChecked
        });
    });
    optionsForm.theaterMode.addEventListener("change", (event: Event) => {
        const isTheaterModeChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ..._options,
            theaterMode: isTheaterModeChecked
        });
    });
    optionsForm.saveLastTimestamp.addEventListener("change", (event: Event) => {
        const isSaveLastTimestampChecked = (event.target as HTMLInputElement).checked;
        saveOptions({
            ..._options,
            saveLastTimestamp: isSaveLastTimestampChecked
        });
    });
    optionsForm.videoQuality.addEventListener("change", (event: Event) => {
        const videoQualityOptionValue = (event.target as HTMLSelectElement).value;
        saveOptions({
            ..._options,
            videoQuality: $enum(VideoQualityEnum).asValueOrDefault(videoQualityOptionValue, VideoQualityEnum.Q_1080P)
        });
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

    optionsConfigure(options);
    generateVideoQualityOptions(options);
};

init();
