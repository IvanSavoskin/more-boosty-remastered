import "./styles/content.scss";

import sendMessage from "@coreUtils/messagesUtils";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import { OptionsInfoMessage, RequestOptionBackgroundMessage } from "@models/messages/types";
import { UserOptions } from "@models/options/types";

import {
    injectAudioPlayerChanges,
    injectFullLayout,
    injectIconInTopMenu,
    injectStreamPageChanges,
    injectVkPlayerChanges
} from "./domHelpers";

let options: UserOptions | null = null;

/**
 * Process audio players
 */
function processAudioPlayers() {
    console.group("Process audio players");

    const audioPlayers = document.querySelectorAll("div[class*=AudioBlock_root_]:not([data-complete=true])") as NodeListOf<HTMLElement>;

    for (const player of audioPlayers) {
        // Skip nodes from app/messages
        if (player.classList.value.includes("Messages_audioPlayer_")) {
            continue;
        }

        injectAudioPlayerChanges(player, options as UserOptions);
        player.dataset.complete = "true";
    }

    console.groupEnd();
}

/**
 * Process video players in root
 */
function processVideoPlayers() {
    console.group("Process video players");

    const playerShadowRootContainers = document.querySelectorAll(
        "vk-video-player .shadow-root-container:not([data-complete=true])"
    ) as NodeListOf<HTMLElement>;

    for (const playerShadowRootContainer of playerShadowRootContainers) {
        injectVkPlayerChanges(playerShadowRootContainer, options as UserOptions);
        playerShadowRootContainer.dataset.complete = "true";
    }

    console.groupEnd();
}

/**
 * Inject extension icon to the top left menu
 *
 * @param {HTMLElement} body Body element
 * @returns {boolean} Is menu injected
 */
function injectExtensionIcon(body: HTMLElement) {
    const topMenuLeft = body.querySelector("div[class*=TopMenu_left_]") as HTMLElement | null;

    if (!topMenuLeft) {
        console.warn('Error injecting extension icon: Top menu by selector "div[class*=TopMenu_left_]" not found');
        return false;
    }

    injectIconInTopMenu(topMenuLeft);

    if (window.location.hash?.includes("mb-update")) {
        window.location.href = "#";

        const changelogButton = body.querySelector("a#mb-changelog") as HTMLAnchorElement | null;

        if (!changelogButton) {
            console.warn('Error injecting extension icon: Changelog button by selector "a#mb-changelog" not found');
            return false;
        }

        changelogButton.click();
    }

    return true;
}

/**
 * Inject theater mode
 *
 * @param {HTMLElement} body Body element
 * @param {boolean} [isActive] Is theater mode active
 */
function processTheaterMode(body: HTMLElement, isActive?: boolean) {
    if (!options?.theaterMode) {
        return;
    }

    let isTheaterModeInjectActive = !!isActive;

    if (isTheaterModeInjectActive) {
        injectStreamPageChanges(isTheaterModeInjectActive, body);
        return;
    }

    if (window.location.href.includes("/video_stream")) {
        isTheaterModeInjectActive = true;
    }

    injectStreamPageChanges(isTheaterModeInjectActive, body);
}

/**
 * Main function
 */
async function main() {
    const body = document.querySelector("body") as HTMLElement | null;

    if (!body) {
        console.error("Content script startup error: Body not found");
        return;
    }

    const cachedOptions = await sendMessage<RequestOptionBackgroundMessage, OptionsInfoMessage>({
        type: BackgroundMessageType.REQUEST_OPTIONS,
        target: [MessageTarget.BACKGROUND]
    });

    if (!cachedOptions) {
        console.warn("Content script startup error: The storage does not contain any options.");
        return;
    }
    options = cachedOptions.data.options;

    console.debug("Options from cache", options);

    // 1. Permanent changes
    const isExtensionIconInjected = injectExtensionIcon(body);
    injectFullLayout(options, body);
    processAudioPlayers();
    processVideoPlayers();
    processTheaterMode(body);

    // 2. Dynamic changes
    const observer = new MutationObserver((mutations) => {
        try {
            processAudioPlayers();
            processVideoPlayers();

            // Checks for streamer page
            for (const mutation of mutations) {
                if (!isExtensionIconInjected && (mutation.target as HTMLElement).id === "root") {
                    console.debug("Deffered injectExtensionIcon()");
                    injectExtensionIcon(body);
                }

                for (const node of mutation.addedNodes) {
                    if ((node as HTMLElement).classList?.value.includes("StreamPage_block_")) {
                        processTheaterMode(body, true);
                    }
                }

                for (const node of mutation.removedNodes) {
                    if ((node as HTMLElement).classList?.value.includes("StreamPage_block_")) {
                        processTheaterMode(body, false);
                    }
                }
            }
        } catch (error) {
            console.log("Uncaught mutation error", error);
        }
    });

    observer.observe(body, {
        childList: true,
        subtree: true
    });
}

console.log("💈 Content script loaded for", chrome.runtime.getManifest().name);

main();
