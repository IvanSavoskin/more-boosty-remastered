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

export const downloadUnavailableToast = (message: string) =>
    safeHTML`<div
    id="mb-download-unavailable-toast"
    class="mb-download-unavailable-toast"
    style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999999;max-width:90%;padding:12px 20px;background:#333;color:#fff;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);"
>${message}</div>`;

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

export const rotateLeft = `
<svg class="mb-pswp-icon" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 452.64">
    <path d="M143.65 161.02c33.05-59.34 90.64-98.27 164.75-89.98 69.06 7.72 131.91 57.64 147.19 131.68 12.78 62-10.79 121.11-52.63 161.1-48.87 46.7-122.66 67.32-192.61 36.01-35.84-16.05-60.23-36.5-78.47-62.84-1.86-2.45-4.36-6.41-7.83-8.99-10.07-7.53-23.32 1.41-21.28 12.43.43 2.36 1.49 4.88 3.36 7.53 15 23.71 31.64 41.83 53.38 58.4 49.84 37.98 114.27 55.13 178.92 41.8 60.23-12.41 109.18-48.92 139.51-97.8 53.04-85.46 40.95-188.32-14.26-260.43-34.29-44.79-85.22-77.72-147.5-87.26C211.03-13.44 105.47 44.94 71.66 137.99l-42.51-13.6c-11.78-3.73-24.37 2.79-28.1 14.57a22.326 22.326 0 0 0 .9 15.89l48.64 108.53c5.04 11.3 18.29 16.37 29.59 11.32l1.65-.82.02.03 106.62-58.84c10.86-5.97 14.83-19.61 8.87-30.47-3.15-5.74-8.44-9.55-14.34-11l-39.35-12.58z"/>
</svg>
`;

export const rotateRight = `
<svg class="mb-pswp-icon" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 452.64">
    <path d="M368.35 161.02c-33.05-59.34-90.64-98.27-164.75-89.98-69.06 7.72-131.91 57.64-147.19 131.68-12.78 61.99 10.79 121.11 52.63 161.1 48.87 46.7 122.66 67.32 192.61 36.01 35.84-16.05 60.23-36.5 78.47-62.84 1.86-2.46 4.36-6.41 7.83-9 10.07-7.53 23.32 1.42 21.28 12.44-.43 2.36-1.49 4.88-3.36 7.53-15 23.71-31.64 41.83-53.38 58.4-49.84 37.98-114.27 55.13-178.91 41.8-60.24-12.42-109.19-48.92-139.52-97.8C-18.98 264.9-6.89 162.04 48.32 89.93c34.29-44.79 85.22-77.72 147.5-87.26 105.15-16.11 210.71 42.27 244.52 135.32l42.51-13.6c11.78-3.73 24.36 2.79 28.1 14.57a22.33 22.33 0 0 1-.9 15.89l-48.64 108.53c-5.04 11.3-18.29 16.36-29.59 11.32l-1.65-.82-.02.03-106.62-58.85c-10.86-5.96-14.83-19.6-8.87-30.46 3.15-5.74 8.44-9.55 14.34-11l39.35-12.58z"/>
</svg>
`;

export const flipVertical = `
<svg class="mb-pswp-icon" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 428 512.54">
    <path fill-rule="nonzero" d="m72.21 334.61 319.82 150.95V334.61H72.21zm-56.56-94.06c-18.2 0-21.91 26.27-3.74 31.01 1.29.28 2.4.45 3.74.45h19.23c18.2 0 21.91-26.27 3.74-31.01-1.29-.28-2.4-.45-3.74-.45H15.65zm82.14 0c-18.2 0-21.91 26.27-3.74 31.01 1.29.28 2.4.45 3.74.45h31.46c18.19 0 21.91-26.27 3.74-31.01-1.29-.28-2.4-.45-3.74-.45H97.79zm94.37 0c-18.2 0-21.91 26.27-3.74 31.01 1.29.28 2.4.45 3.74.45h31.45c18.2 0 21.92-26.27 3.74-31.01-1.28-.28-2.39-.45-3.74-.45h-31.45zm94.37 0c-18.2 0-21.92 26.27-3.74 31.01 1.28.28 2.39.45 3.74.45h31.45c18.2 0 21.91-26.27 3.74-31.01-1.29-.28-2.4-.45-3.74-.45h-31.45zm94.36 0c-18.19 0-21.91 26.27-3.74 31.01 1.29.28 2.4.45 3.74.45h31.46c18.2 0 21.91-26.27 3.74-31.01-1.29-.28-2.4-.45-3.74-.45h-31.46zM21.02 178.98 397.41 1.33c1.51-.85 3.25-1.33 5.1-1.33C408.3 0 413 4.7 413 10.49v177.96c0 5.79-4.7 10.48-10.49 10.48H25.49c-3.92-.03-7.68-2.25-9.47-6.03-2.46-5.22-.22-11.46 5-13.92zm377.03 332.56L21.69 333.9c-3.91-1.53-6.69-5.33-6.69-9.78 0-5.79 4.7-10.48 10.49-10.48h377.02c5.79 0 10.49 4.69 10.49 10.48v177.95c-.02 1.5-.35 3.02-1.03 4.47-2.46 5.22-8.7 7.46-13.92 5z"/>
</svg>
`;

export const flipHorizontal = `
<svg class="mb-pswp-icon" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 417.79">
    <path fill-rule="nonzero" d="M333.55 16.79 511 392.75c2.46 5.22.22 11.45-4.99 13.91-1.45.68-2.97 1.01-4.46 1l-177.77.03c-5.78 0-10.47-4.7-10.47-10.48V20.58c0-5.78 4.69-10.47 10.47-10.47 4.44 0 8.25 2.77 9.77 6.68zM240.3 402.16c0 18.18 26.25 21.89 30.98 3.74.28-1.29.45-2.4.45-3.74v-9.45c0-18.18-26.25-21.89-30.98-3.74-.28 1.29-.45 2.4-.45 3.74v9.45zm0-72.3c0 18.18 26.25 21.89 30.98 3.74.28-1.29.45-2.4.45-3.74v-31.42c0-18.18-26.25-21.89-30.98-3.74-.28 1.29-.45 2.4-.45 3.74v31.42zm0-94.27c0 18.18 26.25 21.89 30.98 3.74.28-1.29.45-2.4.45-3.74v-31.42c0-18.18-26.25-21.89-30.98-3.73-.28 1.28-.45 2.39-.45 3.73v31.42zm0-94.26c0 18.17 26.25 21.88 30.98 3.73.28-1.28.45-2.39.45-3.73V109.9c0-18.17-26.25-21.89-30.98-3.73-.28 1.28-.45 2.39-.45 3.73v31.43zm0-94.27c0 18.17 26.25 21.89 30.98 3.73.28-1.28.45-2.39.45-3.73V15.63c0-18.17-26.25-21.88-30.98-3.73-.28 1.29-.45 2.39-.45 3.73v31.43zM1.33 392.11 178.79 16.12c2.46-5.21 8.7-7.45 13.91-4.99 3.78 1.78 5.99 5.54 5.99 9.45l.04 376.63c0 5.78-4.7 10.48-10.48 10.48H10.48c-5.79 0-10.48-4.7-10.48-10.48 0-1.85.48-3.59 1.33-5.1zm483.72-5.37L334.26 67.26v319.48h150.79z"/>
</svg>
`;

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
