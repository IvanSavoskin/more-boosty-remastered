import sendMessage from "@coreUtils/messagesUtils";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import { OpenOptionsPageBackgroundMessage, ToggleThemeBackgroundMessage } from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import ThemeEnum from "@models/theme/enums";

import { prepareAudioPlayer, prepareVideoPlayer } from "./playerChanges";
import { changelogButton, changelogModal, themeSwitcher } from "./templates";

/** @see {@link scrollEvent} */
let topMenu: HTMLElement | undefined | null;

/**
 * Prepares to inject VK player changes using one-time event listener
 *
 * @param {HTMLElement} shadowRootContainer `.shadow-root-container` node
 * @param {UserOptions} options Extension options
 */
export function injectVkPlayerChanges(shadowRootContainer: HTMLElement, options: UserOptions) {
    const { shadowRoot } = shadowRootContainer;

    if (!shadowRoot) {
        console.error('Error when injecting changes into vk player: Shadow root in ".shadow-root-container" element not found');
        return;
    }

    const playerWrapper = shadowRoot.querySelector("div.player-wrapper div.container");

    if (!playerWrapper) {
        console.error(
            'Error when injecting changes into vk player: Player wrapper by selector "div.player-wrapper div.container" not found'
        );
        return;
    }

    playerWrapper.addEventListener(
        "click",
        (event) => {
            prepareVideoPlayer(event as MouseEvent, options);
        },
        { once: true }
    );
}

/**
 * Prepares to inject audio player changes using one-time event listeners
 *
 * @param {HTMLElement} audioPlayer Audio player node
 * @param {boolean} isTopMenuAudioPlayer Is top menu audio player
 */
export function injectAudioPlayerChanges(audioPlayer: HTMLElement, isTopMenuAudioPlayer: boolean) {
    prepareAudioPlayer(audioPlayer, isTopMenuAudioPlayer);
}

/**
 * Inject extension icon in top menu on the left
 *
 * @param {HTMLElement} menuElement Top left menu element
 */
export function injectExtensionIconInTopMenu(menuElement: HTMLElement) {
    const menuElementLastChild = menuElement.lastElementChild;

    if (!menuElementLastChild) {
        console.error("Error when injecting extension icon in left top menu: Left menu element last child not found");
        return;
    }

    console.log(menuElementLastChild);

    menuElementLastChild.insertAdjacentHTML("afterend", changelogButton());

    const changelogButtonElement = menuElement.querySelector("a#mb-changelog");

    if (!changelogButtonElement) {
        console.error('Error when injecting extension icon in top menu: Changelog button by selector "a#mb-changelog" not found');
        return;
    }

    changelogButtonElement.addEventListener("click", (event) => {
        event.preventDefault();
        prepareChangelogModal();
    });
}

/**
 * Prepare changelog modal
 */
const prepareChangelogModal = () => {
    const appElement = document.querySelector("div[class^=App-scss--module_app_]");

    if (!appElement) {
        console.error('Error when injecting changelog modal: App element by selector "div[class^=App-scss--module_app_]" not found');
        return;
    }

    appElement.insertAdjacentHTML("beforeend", changelogModal());

    const changelogModalElement = document.querySelector("div#mb-changelog-modal");
    const changelogCloseElement = document.querySelector("span#mb-changelog-close");

    if (!changelogModalElement) {
        console.error('Error when injecting changelog modal: Changelog modal by selector "div.mb-changelog-modal" not found');
        return;
    }

    if (changelogCloseElement) {
        changelogCloseElement.addEventListener("click", (event) => {
            event.preventDefault();
            changelogModalElement.remove();
        });
    } else {
        console.warn('Error when injecting changelog modal: Changelog close button by selector "span.mb-changelog-close" not found');
    }

    const optionsButton = changelogModalElement.querySelector("a#mb-options-button");

    if (!optionsButton) {
        console.warn('Error when injecting changelog modal: Options button by selector "a.mb-options-button" not found');
        return;
    }

    optionsButton.addEventListener("click", openOptionsPage);
};

/**
 * Inject classes for widescreen layout
 *
 * @param {UserOptions} options Extension options
 * @param {HTMLElement} body Body element
 */
export function injectFullLayout(options: UserOptions, body: HTMLElement) {
    if (!options.fullLayout) {
        return;
    }

    body.classList.add("mb-active");
}

/**
 * Inject stream page stuff
 *
 * @param {HTMLElement} body Body element
 */
export function injectStreamPageChanges(body: HTMLElement) {
    body.classList.remove("mb-stream");
    window.removeEventListener("scroll", scrollEvent);
}

/**
 * Inject stream page stuff
 *
 * @param {HTMLElement} body Body element
 */
export function injectActiveStreamPageChanges(body: HTMLElement) {
    body.classList.add("mb-stream");
    window.addEventListener("scroll", scrollEvent);
}

/**
 * Inject theme switcher in top menu on the right
 *
 * @param {HTMLElement} menuElement Top right menu element
 */
export function injectThemeSwitcherInTopMenu(menuElement: HTMLElement) {
    const menuElementFirstChild = menuElement.firstElementChild;

    if (!menuElementFirstChild) {
        console.error("Error when injecting theme switcher icon in right top menu: Right menu element first child not found");
        return;
    }

    menuElementFirstChild.insertAdjacentHTML("beforebegin", themeSwitcher());

    const themeSwitcherElement = menuElement.querySelector("#mb-theme-switcher");

    if (!themeSwitcherElement) {
        console.error('Error when injecting theme switcher in right top menu: Theme switcher by selector "#mb-theme-switcher" not found');
        return;
    }

    themeSwitcherElement.addEventListener("click", (event) => {
        event.preventDefault();

        console.debug("Theme switcher clicked");

        document.body.classList.toggle(ThemeEnum.DARK_THEME);
        document.body.classList.toggle(ThemeEnum.LIGHT_THEME);

        sendMessage<ToggleThemeBackgroundMessage>({
            target: [MessageTarget.BACKGROUND],
            type: BackgroundMessageType.TOGGLE_THEME
        });
    });
}

/**
 * Scroll event for stream page
 */
const scrollEvent = () => {
    if (!topMenu) {
        topMenu = document.querySelector("div#topMenu") as HTMLElement | null;
    }

    if (!topMenu) {
        console.error('Error on scrolling stream page: Top menu element by selector "div.topMenu" not found');
        return;
    }

    const scroll = window.scrollY;
    if (scroll >= 1) {
        topMenu.classList.add("mb-scrolled");
    } else {
        topMenu.classList.remove("mb-scrolled");
    }
};

/**
 * Open options page for the extension
 *
 * @param {Event} clickEvent Click option button event
 */
function openOptionsPage(clickEvent: Event) {
    clickEvent.preventDefault();
    sendMessage<OpenOptionsPageBackgroundMessage>({
        target: [MessageTarget.BACKGROUND],
        type: BackgroundMessageType.OPEN_OPTIONS_PAGE
    });
}
