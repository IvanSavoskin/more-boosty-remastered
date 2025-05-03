// Changelog JSON
import changelog from "@coreUtils/changelog";
import { PlayerUrl } from "@models/video/types";

import safeHTML from "html-template-tag";

// Chrome aliases
const t = (name: string) => chrome.i18n.getMessage(name);
const { name, version } = chrome.runtime.getManifest();

// Checking browser language
let uiLang = chrome.i18n.getUILanguage();
if (uiLang !== "ru" && uiLang !== "en") {
    uiLang = "en";
}

export const changelogButton = () => `
<div class="mb-changelog-button append-animate">
    <a class="mb-changelog-button-content-container" href="#" id="mb-changelog" title="${t("content_about")}">
        <span class="mb-changelog-button-icon-container">
            <img src="${chrome.runtime.getURL("/static/assets/icon.png")}" class="mb-changelog-button-icon" alt="icon"/>
        </span>
        <span class="mb-changelog-button-version">
            v${version}
        </span>
    </a>
</div>
`;

export const changelogModal = () => `
<div class="mb-modal-container fade-animate" id="mb-changelog-modal">
    <div class="mb-modal-content-container">
        <span class="mb-modal-close-icon-container" id="mb-changelog-close">
            <svg class="mb-modal-close-icon" viewBox="0 0 1792 1792">
                <path d="M1082.2,896.6l410.2-410c51.5-51.5,51.5-134.6,0-186.1s-134.6-51.5-186.1,0l-410.2,410L486,300.4c-51.5-51.5-134.6-51.5-186.1,0s-51.5,134.6,0,186.1l410.2,410l-410.2,410c-51.5,51.5-51.5,134.6,0,186.1c51.6,51.5,135,51.5,186.1,0l410.2-410l410.2,410c51.5,51.5,134.6,51.5,186.1,0c51.1-51.5,51.1-134.6-0.5-186.2L1082.2,896.6z"/>
            </svg>
        </span>

        <div class="mb-changelog-modal-content-title">
            <strong>
                ${name}, v${version}
            </strong>
      
            <small>
                Remastered by <a href="https://github.com/IvanSavoskin" rel="noreferref noopener nofollow" target="_blank">IvanSavoskin</a>
            </small>

            <small>
                Created by <a href="https://cjmaxik.ru?ref=more_boosty" rel="noreferref noopener nofollow" target="_blank">CJMAXiK</a>
            </small>
        </div>

        <div class="mb-modal-content">
            <div>
                <h2>🎉 ${t("changelog_latest_version")}</h2>
                ${generateChangelogText("latest", uiLang as "ru" | "en")}
            </div>

            <div>
                <h3>📒 ${t("changelog_previous_version")}</h3>
                <i>${generateChangelogText("previous", uiLang as "ru" | "en")}</i>
            </div>
        </div>

        <div class="mb-changelog-modal-option-button-container">
            <a href="#" id="mb-options-button" class="mb-modal-button">
                ${t("options_title")}
            </a>
        </div>
    </div>
</div>
`;

export const themeSwitcher = () => `
<button 
    class="mb-theme-switcher" 
    id="mb-theme-switcher" 
    title="Switch light & dark theme"
>
    <svg class="mb-theme-switcher-icon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
        <mask class="mb-theme-switcher-icon-moon" id="moon-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white"></rect>
            <circle cx="24" cy="10" r="6" fill="black"></circle>
        </mask>
        <circle class="mb-theme-switcher-icon-sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor"></circle>
        <g class="mb-theme-switcher-icon-sun-beams" stroke="currentColor">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
    </svg>
</button>
`;

export const videoDownloadModal = (links: PlayerUrl[]) => `
<div class="mb-modal-container fade-animate" id="mb-video-download-modal">
    <div class="mb-modal-content-container">
        <span class="mb-modal-close-icon-container" id="mb-video-download-close">
            <svg class="mb-modal-close-icon" viewBox="0 0 1792 1792">
                <path d="M1082.2,896.6l410.2-410c51.5-51.5,51.5-134.6,0-186.1s-134.6-51.5-186.1,0l-410.2,410L486,300.4c-51.5-51.5-134.6-51.5-186.1,0s-51.5,134.6,0,186.1l410.2,410l-410.2,410c-51.5,51.5-51.5,134.6,0,186.1c51.6,51.5,135,51.5,186.1,0l410.2-410l410.2,410c51.5,51.5,134.6,51.5,186.1,0c51.1-51.5,51.1-134.6-0.5-186.2L1082.2,896.6z"/>
            </svg>
          </span>

        <div class="mb-modal-content-title">
            <strong>
                ${t("download_video_modal_title")}:
            </strong>
        </div>

        <div class="mb-modal-content">
            ${generateVideoDownloadLinks(links)}
        </div>
    </div>
</div>
`;

export const videoControls = () => `
<div
    id="mb-video-controls"
    style="display: flex; column-gap: 8px; padding: 8px 0 8px 8px;"
></div>
`;

export const pipButton = () => `
<div id="mb-pip" style="cursor: pointer">
    <div role="button" tabindex="0" title="${t("content_pip")}" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
        <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
            <g fill="currentColor" fill-rule="evenodd">
                <path class="_enter" d="M18 11 10 11 10 17 18 17 18 11 18 11ZM22 19 22 4.98C22 3.88 21.1 3 20 3L2 3C.9 3 0 3.88 0 4.98L0 19C0 20.1.9 21 2 21L20 21C21.1 21 22 20.1 22 19L22 19ZM20 19.02 2 19.02 2 4.97 20 4.97 20 19.02 20 19.02Z">
            </g>
        </svg>
    </div>
</div>
`;

export const videoDownloadButton = () => `
<div id="mb-video-download-button" style="cursor: pointer">
    <div
        role="button"
        tabindex="0"
        title="${t("video_download")}"
        style="height: 24px"
        onmouseover="this.style.opacity='0.8'"
        onmouseout="this.style.opacity='1'"
    >
        <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
            <g fill="currentColor" fill-rule="evenodd">
              <path class="_enter" d="M6 21H18A1 1 0 0018 19H6A1 1 0 006 21M19 10H15V3H9V10H5C7.3333 12.3333 9.6667 14.6667 12 17L19 10Z" />
            </g>
        </svg>
    </div>
</div>
`;

export const videoSpeedController = (initialPlaybackRate: number) => `
<div id="mb-video-speed-control" style="display: flex; align-items: center">
    <div id="mb-speed-decrease" style="background-color: initial !important; cursor: pointer !important; padding: 0;">
        <div
            role="button"
            tabindex="0"
            title="${t("player_speed_decrease")}"
            style="height: 24px"
            onmouseover="this.style.opacity='0.8'"
            onmouseout="this.style.opacity='1'"
        >
            <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                <g fill="currentColor" fill-rule="evenodd">
                    <path class="_enter" d="M20 12a1 1 0 01-1 1H5a1 1 0 110-2h14a1 1 0 011 1z" />
                </g>
            </svg>
        </div>
    </div>

    <div id="mb-current-playback-rate" style="cursor: pointer !important;">
        <div
            role="button"
            tabindex="0"
            title="${t("player_speed_reset")}"
            style="width: 40px;
            text-align: center;"
            onmouseover="this.style.opacity='0.8'"
            onmouseout="this.style.opacity='1'"
        >
            <span>
                x${initialPlaybackRate}
            </span>
        </div>
    </div>

    <div id="mb-speed-increase" style="background-color: initial !important; cursor: pointer !important; padding: 0;">
        <div
            role="button"
            tabindex="0"
            title="${t("player_speed_increase")}"
            style="height: 24px"
            onmouseover="this.style.opacity='0.8'"
            onmouseout="this.style.opacity='1'"
        >
            <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                <g fill="currentColor" fill-rule="evenodd">
                    <path
                        class="_enter"
                        d="M20 12a1 1 0 01-1 1h-6v6A1 1 0 0112 20a1 1 0 01-1-1v-6h-6a1 1 0 110-2h6v-6A1 1 0 0112 4a1 1 0 011 1v6h6a1 1 0 011 1z"
                    />
                </g>
            </svg>
        </div>
    </div>
</div>
`;

export const audioControls = (url: string, initialPlaybackRate: number) => `
<div id="mb-audio-control-wrapper" style="display: flex; justify-content: center; margin-left: auto; column-gap: 8px;">
    <div id="mb-audio-speed-control" style="display: flex; align-items: center;">
        <div id="mb-speed-decrease" style="cursor: pointer !important;">
            <div
                role="button"
                tabindex="0"
                title="${t("player_speed_decrease")}"
                style="height: 24px"
                onmouseover="this.style.color='#f15f2c'"
                onmouseout="this.style.color='inherit'"
            >
                <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                    <g fill="currentColor" fill-rule="evenodd">
                        <path class="_enter" d="M20 12a1 1 0 01-1 1H5a1 1 0 110-2h14a1 1 0 011 1z" />
                    </g>
                </svg>
            </div>
        </div>
    
        <div id="mb-current-playback-rate" style="cursor: pointer !important;">
            <div
                role="button"
                tabindex="0"
                title="${t("player_speed_reset")}"
                style="width: 40px; text-align: center;"
                onmouseover="this.style.color='#f15f2c'"
                onmouseout="this.style.color='inherit'"
            >
                <span>
                    x${initialPlaybackRate}
                </span>
            </div>
        </div>
    
        <div id="mb-speed-increase" style="cursor: pointer !important;">
            <div
                role="button"
                tabindex="0"
                title="${t("player_speed_increase")}"
                style="height: 24px"
                onmouseover="this.style.color='#f15f2c'"
                onmouseout="this.style.color='inherit'"
            >
                <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                    <g fill="currentColor" fill-rule="evenodd">
                        <path
                            class="_enter"
                            d="M20 12a1 1 0 01-1 1h-6v6A1 1 0 0112 20a1 1 0 01-1-1v-6h-6a1 1 0 110-2h6v-6A1 1 0 0112 4a1 1 0 011 1v6h6a1 1 0 011 1z"
                        />
                    </g>
                </svg>
            </div>
        </div>
    </div>
    <div id="mb-audio-download-button" style="cursor: pointer" data-url="${url}">
        <div
            role="button"
            tabindex="0"
            title="${t("audio_download")}"
            style="height: 24px"
            onmouseover="this.style.color='#f15f2c'"
            onmouseout="this.style.color='inherit'"
        >
            <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                <g fill="currentColor" fill-rule="evenodd">
                    <path
                        class="_enter"
                        d="M6 21H18A1 1 0 0018 19H6A1 1 0 006 21M19 10H15V3H9V10H5C7.3333 12.3333 9.6667 14.6667 12 17L19 10Z"
                    />
                </g>
            </svg>
        </div>
    </div>
</div>
`;

export const audioControlsStub = (initialPlaybackRate: number) => `
<div id="mb-audio-control-wrapper" style="display: flex; justify-content: center; margin-left: auto; column-gap: 8px;">
    <div id="mb-audio-speed-control" style="display: flex; align-items: center;">
        <div id="mb-speed-decrease" style="cursor: pointer !important;">
            <div
                role="button"
                tabindex="0"
                title="${t("player_speed_decrease")}"
                style="height: 24px"
                onmouseover="this.style.color='#f15f2c'"
                onmouseout="this.style.color='inherit'"
            >
                <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                    <g fill="currentColor" fill-rule="evenodd">
                        <path class="_enter" d="M20 12a1 1 0 01-1 1H5a1 1 0 110-2h14a1 1 0 011 1z" />
                    </g>
                </svg>
            </div>
        </div>
    
        <div id="mb-current-playback-rate" style="cursor: pointer !important;">
            <div
                role="button"
                tabindex="0"
                title="${t("player_speed_reset")}"
                style="width: 40px; text-align: center;"
                onmouseover="this.style.color='#f15f2c'"
                onmouseout="this.style.color='inherit'"
            >
                <span>
                    x${initialPlaybackRate}
                </span>
            </div>
        </div>
    
        <div id="mb-speed-increase" style="cursor: pointer !important;">
            <div
                role="button"
                tabindex="0"
                title="${t("player_speed_increase")}"
                style="height: 24px"
                onmouseover="this.style.color='#f15f2c'"
                onmouseout="this.style.color='inherit'"
            >
                <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                    <g fill="currentColor" fill-rule="evenodd">
                        <path
                            class="_enter"
                            d="M20 12a1 1 0 01-1 1h-6v6A1 1 0 0112 20a1 1 0 01-1-1v-6h-6a1 1 0 110-2h6v-6A1 1 0 0112 4a1 1 0 011 1v6h6a1 1 0 011 1z"
                        />
                    </g>
                </svg>
            </div>
        </div>
    </div>
    <div id="mb-audio-download-button-stub" style="cursor: pointer">
        <div
            role="button"
            tabindex="0"
            title="${t("audio_download")}"
            style="height: 24px"
            onmouseover="this.style.color='#f15f2c'"
            onmouseout="this.style.color='inherit'"
        >
            <svg width="24px" height="24px" xmlns="http://www.w3.org/2000/svg">
                <g fill="currentColor" fill-rule="evenodd">
                    <path
                        class="_enter"
                        d="M6 21H18A1 1 0 0018 19H6A1 1 0 006 21M19 10H15V3H9V10H5C7.3333 12.3333 9.6667 14.6667 12 17L19 10Z"
                    />
                </g>
            </svg>
        </div>
    </div>
</div>
`;

export const audioDownloadTooltip = (left: number, top: number) => `
<div id="mb-audio-download-tooltip" class="mb-audio-download-tooltip" style="left: ${left}px; top: ${top}px;">
    <span
        class="mb-audio-download-tooltip-close-icon-container"
        id="mb-audio-download-tooltip-close"
        onmouseover="this.style.color='#f15f2c'"
        onmouseout="this.style.color='inherit'"
    >
        <svg class="mb-audio-download-tooltip-close-icon" viewBox="0 0 1792 1792">
            <path
                fill="currentColor"
                d="M1082.2,896.6l410.2-410c51.5-51.5,51.5-134.6,0-186.1s-134.6-51.5-186.1,0l-410.2,410L486,300.4c-51.5-51.5-134.6-51.5-186.1,0s-51.5,134.6,0,186.1l410.2,410l-410.2,410c-51.5,51.5-51.5,134.6,0,186.1c51.6,51.5,135,51.5,186.1,0l410.2-410l410.2,410c51.5,51.5,134.6,51.5,186.1,0c51.1-51.5,51.1-134.6-0.5-186.2L1082.2,896.6z"
            />
         </svg>
    </span>
    <span>${t("audio_download_tooltip")}</span>
</div>
`;

export const videoTimestampIndicator = (position: number) => `
<span id="mb-video-last-timestamp" style="
    display: block;
    position: absolute;
    z-index: 99999;
    height: 100%;
    width: 3px;
    background-color: rgb(174,54,12);
    left: ${position}%;
"></span>
`;

const noChangelog = "<ul><li>🤷</li></ul>";

/**
 * Generates a changelog text from `changelog.ts`
 *
 * @see {@link ./domHelper/prepareChangelogModal}
 * @param {("latest"|"previous")} type Changelog type
 * @param {("ru"|"en")} lang Changelog language
 * @returns {string} Changelog text
 */
function generateChangelogText(type: "latest" | "previous", lang: "ru" | "en"): string {
    const index = type === "latest" ? -1 : -2;
    const changelogEntries = Object.entries(changelog);
    const changelogEntry = changelogEntries.at(index);

    if (changelogEntry === undefined) {
        return noChangelog;
    }

    const changelogMessages = changelogEntry[1].message[lang];

    if (changelogMessages === undefined) {
        return noChangelog;
    }

    let text = `<ul class="mb-changelog-modal-changelog-table">`;
    for (const change of changelogMessages) {
        text += safeHTML`<li>${change}</li>`;
    }
    text += "</ul> ";

    return text;
}

/**
 * Generates a video download buttons for the modal
 *
 * @param {PlayerUrl[]} playerUrls Player URLs info
 * @returns {string} Video download buttons in HTML
 */
function generateVideoDownloadLinks(playerUrls: PlayerUrl[]): string {
    let text = "";
    for (const playerUrl of playerUrls) {
        text += safeHTML`<button data-url="${playerUrl.url}" id="mb-video-download-link" class="mb-modal-button">
      ${t(`video_quality_${playerUrl.type}`)}
    </button>`;
    }

    return text;
}
