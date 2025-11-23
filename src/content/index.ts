import "./styles/content.scss";

import sendMessage from "@coreUtils/messagesUtils";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import { OptionsInfoMessage, RequestOptionsBackgroundMessage } from "@models/messages/types";
import { UserOptions } from "@models/options/types";

import {
    injectActiveStreamPageChanges,
    injectAudioPlayerChanges,
    injectExtensionIconInTopMenu,
    injectFullLayout,
    injectStreamPageChanges,
    injectVkPlayerChanges
} from "./domHelpers";
import enhanceGallery from "./gallery";

const TOP_MENU_AUDIO_SELECTOR = "div[class*=AppAudioPlayer-scss--module_root_]:not([data-complete=true])";
const AUDIO_PLAYER_SELECTOR = "div[class*=AudioPlayer-scss--module_root_]:not([data-complete=true])";
const VIDEO_PLAYER_SELECTOR = "vk-video-player .shadow-root-container:not([data-complete=true])";

let options: UserOptions | null = null;
let mediaProcessingScheduled = false;

/**
 * Schedule throttled processing of audio/video players triggered by DOM mutations.
 */
function scheduleMediaProcessing() {
    if (mediaProcessingScheduled) {
        return;
    }

    mediaProcessingScheduled = true;

    const run = () => {
        mediaProcessingScheduled = false;
        processAudioPlayers();
        processVideoPlayers();
    };

    if (typeof globalThis.requestIdleCallback === "function") {
        globalThis.requestIdleCallback(run, { timeout: 500 });
        return;
    }

    globalThis.setTimeout(run, 100);
}

/**
 * Check whether a node or any of its descendants match supplied selectors.
 *
 * @param {Node} node DOM node to inspect.
 * @param {string[]} selectors Selector list representing media containers.
 * @returns {boolean} True if node matches any selector.
 */
function nodeContainsMediaTarget(node: Node, selectors: string[]): boolean {
    if (!(node instanceof Element)) {
        return false;
    }

    return selectors.some((selector) => node.matches(selector) || !!node.querySelector(selector));
}

/**
 * Determine whether a mutation record affects media players that need processing.
 *
 * @param {MutationRecord} mutation Mutation record to inspect.
 * @returns {boolean} True if the mutation touches tracked media nodes.
 */
function shouldProcessMedia(mutation: MutationRecord): boolean {
    const selectors = [TOP_MENU_AUDIO_SELECTOR, AUDIO_PLAYER_SELECTOR, VIDEO_PLAYER_SELECTOR];

    if (nodeContainsMediaTarget(mutation.target, selectors)) {
        return true;
    }

    for (const node of mutation.addedNodes) {
        if (nodeContainsMediaTarget(node, selectors)) {
            return true;
        }
    }

    for (const node of mutation.removedNodes) {
        if (nodeContainsMediaTarget(node, selectors)) {
            return true;
        }
    }

    return false;
}

/**
 * Process audio players
 */
function processAudioPlayers() {
    const topMenuAudioPlayer = document.querySelector(TOP_MENU_AUDIO_SELECTOR) as HTMLElement | null;

    if (topMenuAudioPlayer) {
        injectAudioPlayerChanges(topMenuAudioPlayer, true);
        topMenuAudioPlayer.dataset.complete = "true";
    }

    const audioPlayers = document.querySelectorAll(AUDIO_PLAYER_SELECTOR) as NodeListOf<HTMLElement>;

    for (const player of audioPlayers) {
        // Skip nodes from app/messages
        if (player.classList.value.includes("Messages-scss--module_audioPlayer_")) {
            continue;
        }

        injectAudioPlayerChanges(player, false);
        player.dataset.complete = "true";
    }
}

/**
 * Process video players in root
 */
function processVideoPlayers() {
    const playerShadowRootContainers = document.querySelectorAll(VIDEO_PLAYER_SELECTOR) as NodeListOf<HTMLElement>;

    for (const playerShadowRootContainer of playerShadowRootContainers) {
        injectVkPlayerChanges(playerShadowRootContainer, options as UserOptions);
        playerShadowRootContainer.dataset.complete = "true";
    }
}

/**
 * Inject extension icon to the top left menu
 *
 * @param {HTMLElement} body Body element
 * @returns {boolean} Is extension icon injected
 */
function injectExtensionIcon(body: HTMLElement): boolean {
    const topMenuLeft = body.querySelector("div[class*=TopMenu-scss--module_left_]") as HTMLElement | null;

    if (!topMenuLeft) {
        console.warn('Error injecting extension icon: Left top menu by selector "div[class*=TopMenu-scss--module_left_]" not found');
        return false;
    }

    injectExtensionIconInTopMenu(topMenuLeft);

    if (globalThis.location.hash?.includes("mb-update")) {
        globalThis.location.href = "#";

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

    if (isActive) {
        injectActiveStreamPageChanges(body);
        return;
    }

    if (globalThis.location.href.includes("/video_stream")) {
        injectActiveStreamPageChanges(body);
    }

    injectStreamPageChanges(body);
}

/**
 * Process body mutations
 *
 * @param {MutationRecord[]} mutations Body mutation records
 * @param {HTMLElement} body Body element
 * @param {boolean} isExtensionIconInjected Is extension icon injected
 */
function processBodyMutations(mutations: MutationRecord[], body: HTMLElement, isExtensionIconInjected: boolean) {
    try {
        if (mutations.some((mutation) => shouldProcessMedia(mutation))) {
            scheduleMediaProcessing();
        }

        for (const mutation of mutations) {
            const target = mutation.target as HTMLElement;

            if (target.id === "root" && isExtensionIconInjected && !target.querySelector("#mb-changelog")) {
                injectExtensionIcon(target);
            }

            if (!isExtensionIconInjected && target.id === "root") {
                console.debug("Deferred inject extension icon");
                injectExtensionIcon(body);
            }

            if (target.id === "gallery") {
                enhanceGallery(target);
            }

            for (const node of mutation.addedNodes) {
                if ((node as HTMLElement).classList?.value.includes("StreamPage-scss--module_block_")) {
                    processTheaterMode(body, true);
                }
            }

            for (const node of mutation.removedNodes) {
                if ((node as HTMLElement).classList?.value.includes("StreamPage-scss--module_block_")) {
                    processTheaterMode(body, false);
                }
            }
        }
    } catch (error) {
        console.log("Uncaught mutation error", error);
    }
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

    const cachedOptions = await sendMessage<RequestOptionsBackgroundMessage, OptionsInfoMessage>({
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
    const observer = new MutationObserver((mutations) => processBodyMutations(mutations, body, isExtensionIconInjected));

    observer.observe(body, {
        childList: true,
        subtree: true
    });
}

console.info(`💈 Content script loaded for ${chrome.runtime.getManifest().name} (v${chrome.runtime.getManifest().version})`);

main();
