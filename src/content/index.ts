import "./styles/content.scss";

import sendMessage from "@coreUtils/messagesUtils";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import {
    OptionsInfoMessage,
    RequestOptionsBackgroundMessage,
    RequestThemeBackgroundMessage,
    ThemeInfoContentMessage
} from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import ThemeEnum from "@models/theme/enums";

import {
    injectActiveStreamPageChanges,
    injectAudioPlayerChanges,
    injectExtensionIconInTopMenu,
    injectFullLayout,
    injectStreamPageChanges,
    injectThemeSwitcherInTopMenu,
    injectVkPlayerChanges
} from "./domHelpers";

let options: UserOptions | null = null;

/**
 * Process audio players
 */
function processAudioPlayers() {
    const topMenuAudioPlayer = document.querySelector(
        "div[class*=AppAudioPlayer-scss--module_root_]:not([data-complete=true])"
    ) as HTMLElement | null;

    if (topMenuAudioPlayer) {
        injectAudioPlayerChanges(topMenuAudioPlayer, true);
        topMenuAudioPlayer.dataset.complete = "true";
    }

    const audioPlayers = document.querySelectorAll(
        "div[class*=AudioPlayer-scss--module_root_]:not([data-complete=true])"
    ) as NodeListOf<HTMLElement>;

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
    const playerShadowRootContainers = document.querySelectorAll(
        "vk-video-player .shadow-root-container:not([data-complete=true])"
    ) as NodeListOf<HTMLElement>;

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
 * Inject theme switcher to the top right menu
 *
 * @param {HTMLElement} body Body element
 * @returns {boolean} Is theme switcher injected
 */
function injectThemeSwitcher(body: HTMLElement): boolean {
    if (!options?.darkTheme) {
        return false;
    }

    const topRightLeft = body.querySelector("div[class*=TopMenuRightButtonsFounder-scss--module_root_]") as HTMLElement | null;

    if (!topRightLeft) {
        console.warn(
            'Error injecting theme switcher: Right top menu by selector "div[class*=TopMenuRightButtonsFounder-scss--module_root_]" not found'
        );
        return false;
    }

    injectThemeSwitcherInTopMenu(topRightLeft);

    sendMessage<RequestThemeBackgroundMessage, ThemeInfoContentMessage>({
        target: [MessageTarget.BACKGROUND],
        type: BackgroundMessageType.REQUEST_THEME
    }).then((response) => {
        if (response) {
            const { theme } = response.data;

            if (theme === ThemeEnum.DARK_THEME) {
                document.body.classList.add(ThemeEnum.DARK_THEME);
                document.body.classList.remove(ThemeEnum.LIGHT_THEME);
            }

            console.debug(`Start theme ${theme} is set`);
        }
    });

    return true;
}

/**
 * Inject theme to the local payment widget
 */
function injectThemeToLocalPaymentWidget() {
    if (!options?.darkTheme) {
        return false;
    }

    console.debug("Injecting dark theme in local payment widget");
    sendMessage<RequestThemeBackgroundMessage, ThemeInfoContentMessage>({
        target: [MessageTarget.BACKGROUND],
        type: BackgroundMessageType.REQUEST_THEME
    }).then((response) => {
        if (response) {
            const { theme } = response.data;

            const iframeElement = document.querySelector("iframe.Bank131PaymentWidget_frame_JPtYs") as HTMLIFrameElement | null;

            if (!iframeElement) {
                console.warn(
                    `Error injecting dark theme to local payment widget container: Local payment widget iframe by selector "iframe.Bank131PaymentWidget_frame_JPtYs" not found`
                );
                return;
            }

            iframeElement.addEventListener("load", () => injectThemeToLocalPaymentWidgetIframe(iframeElement, theme), true);
        }
    });
}

/**
 * Inject theme to the local payment widget
 *
 * @param {HTMLIFrameElement} iframe Local payment widget iframe
 * @param {ThemeEnum} theme Current theme
 */
function injectThemeToLocalPaymentWidgetIframe(iframe: HTMLIFrameElement, theme: ThemeEnum) {
    console.debug("Local payment widget iframe loaded", iframe);

    const appElement = iframe.contentWindow?.document.querySelector("div[class*=App-scss--module_app_]");

    if (!appElement) {
        console.debug(
            `Error injecting dark theme to local payment widget container: Local payment widget container by selector "div[class*=App-scss--module_app_]" not found`,
            iframe.contentWindow?.document
        );
        return;
    }

    console.log(appElement);

    if (theme === ThemeEnum.DARK_THEME && !appElement.classList.contains(ThemeEnum.DARK_THEME)) {
        appElement.classList.add(ThemeEnum.DARK_THEME);
        appElement.classList.remove(ThemeEnum.LIGHT_THEME);
    }
    console.debug(`Local payment widget theme ${theme} is set`);
}

/**
 * Remove image copy protection from gallery element
 *
 * @param {HTMLElement} gallery Gallery element
 */
function removeImageCopyProtection(gallery: HTMLElement) {
    console.debug("Remove image copy protection from gallery element", gallery);

    gallery.addEventListener(
        "contextmenu",
        (event) => {
            event.stopImmediatePropagation();
        },
        true
    );

    console.debug("Image copy protection removed from gallery element by place clone of gallery", gallery);
}

/**
 * Process body mutations
 *
 * @param {MutationRecord[]} mutations Body mutation records
 * @param {HTMLElement} body Body element
 * @param {boolean} isExtensionIconInjected Is extension icon injected
 * @param {boolean} isThemeSwitcherInjected Is theme switcher injected
 */
function processBodyMutations(
    mutations: MutationRecord[],
    body: HTMLElement,
    isExtensionIconInjected: boolean,
    isThemeSwitcherInjected: boolean
) {
    try {
        processAudioPlayers();
        processVideoPlayers();

        for (const mutation of mutations) {
            const target = mutation.target as HTMLElement;

            if (target.id === "root") {
                if (isExtensionIconInjected && !target.querySelector("#mb-changelog")) {
                    injectExtensionIcon(target);
                }

                if (isThemeSwitcherInjected && !target.querySelector("#mb-theme-switcher")) {
                    injectThemeSwitcher(target);
                }
            }

            if (!isExtensionIconInjected && target.id === "root") {
                console.debug("Deffered inject extension icon");
                injectExtensionIcon(body);
            }

            if (!isThemeSwitcherInjected && target.id === "root") {
                console.debug("Deffered inject theme switcher");
                injectThemeSwitcher(body);
            }

            if (target.id === "gallery") {
                removeImageCopyProtection(target);
            }

            if (target.classList.contains("Bank131PaymentWidget_root_lQcDH")) {
                injectThemeToLocalPaymentWidget();
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
    const isThemeSwitcherInjected = injectThemeSwitcher(body);
    injectFullLayout(options, body);
    processAudioPlayers();
    processVideoPlayers();
    processTheaterMode(body);

    // 2. Dynamic changes
    const observer = new MutationObserver((mutations) =>
        processBodyMutations(mutations, body, isExtensionIconInjected, isThemeSwitcherInjected)
    );

    observer.observe(body, {
        childList: true,
        subtree: true
    });
}

console.info(`💈 Content script loaded for ${chrome.runtime.getManifest().name} (v${chrome.runtime.getManifest().version})`);

main();
