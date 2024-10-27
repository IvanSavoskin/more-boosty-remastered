import sendMessage from "@coreUtils/messagesUtils";
import { parseVideoId } from "@coreUtils/videoUtils";
import { BlogContentMetadata, ContentMetadata, ContentMetadataWithUnknown } from "@models/boosty/types";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import {
    ContentDataInfoContentMessage,
    RequestContentDataBackgroundMessage,
    RequestTimestampBackgroundMessage,
    SaveTimestampBackgroundMessage,
    TimestampInfoContentMessage
} from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import { VideoQualityEnum } from "@models/video/enums";
import { PlayerUrl, VideoInfo } from "@models/video/types";

import {
    audioControls,
    audioControlsStub,
    audioDownloadTooltip,
    pipButton,
    videoControls,
    videoDownloadButton,
    videoDownloadModal,
    videoTimestampIndicator
} from "./templates";

// Content cache for videos
const contentCache = new Map();

/**
 * Inject VK player changes
 *
 * @see {@link ./domHelper/injectVkPlayerChanges} for event conditions
 * @param {MouseEvent} event Element click event
 * @param {UserOptions} options Extension options
 */
export async function prepareVideoPlayer(event: MouseEvent, options: UserOptions) {
    console.group("Prepare video player");

    const playerRootNode = (event.currentTarget as HTMLElement).getRootNode() as HTMLElement;
    console.debug("Player root node", playerRootNode);

    const playerWrapper = playerRootNode.querySelector(".player-wrapper") as HTMLElement | null;

    if (!playerWrapper) {
        console.error('Error preparing video player: Player wrapper by selector ".player-wrapper" not found.', playerRootNode);
        return;
    }

    console.debug("Player wrapper", playerWrapper);

    // Get content metadata
    const contentMetadata = getContentMetadata(playerWrapper);
    console.debug("Content metadata", contentMetadata);
    if (contentMetadata.type === "unknown") {
        console.warn("We don`t know this type of content.", playerWrapper);
    } else {
        // Get content components
        const contentComponents = await sendGetContentComponentsMessage(contentMetadata);
        if (contentComponents) {
            for (const component of contentComponents) {
                contentCache.set(component.videoId, component.videoUrls);
            }
        }
        console.debug("Content components", contentComponents);
        console.debug("Content cache", contentCache);
    }

    // Inject controls
    injectVideoControls(playerWrapper, contentMetadata.type !== "unknown");

    // Force video quality
    if (options.forceVideoQuality) {
        forceVideoQuality(playerWrapper, options.videoQuality);
    }

    // Save/retrieve timestamp
    if (options.saveLastTimestamp) {
        lastVideoTimestamp(playerWrapper);
    }
    console.groupEnd();
}

/**
 * Inject audio player changes
 *
 * @param {HTMLElement} element Audio player node
 * @param {boolean} isTopMenuAudioPlayer Is top menu audio player
 */
export async function prepareAudioPlayer(element: HTMLElement, isTopMenuAudioPlayer: boolean) {
    // Inject controls
    if (isTopMenuAudioPlayer) {
        injectAudioControlsToTopMenuPlayer(element);
    } else {
        injectAudioControlsToBasePlayer(element);
    }
}

/**
 * Inject audio controls
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
function injectAudioControlsToTopMenuPlayer(playerWrapper: HTMLElement) {
    const audio = document.querySelector("audio");
    const audioUrl = audio?.src;
    const audioPlayerTopElement = playerWrapper.querySelector("div[class*=AppAudioPlayer_top_]");

    if (!audioUrl) {
        console.error("Error injecting audio controls: Audio url not exist", audio);
        return;
    }

    if (!audioPlayerTopElement) {
        console.error(
            'Error injecting audio controls: Audio player top element by selector "div[class*=AppAudioPlayer_top_]" not found',
            playerWrapper
        );

        return;
    }

    const audioControlsElement = audioControls(audioUrl);
    // Add speed control and download buttons to player title
    audioPlayerTopElement.insertAdjacentHTML("beforeend", audioControlsElement);

    const link = playerWrapper.querySelector("#mb-audio-download-button");

    if (link) {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            downloadContent(event as MouseEvent);
        });
    } else {
        console.warn(
            'Error injecting download audio button: Download button element by selector "#mb-audio-download-button" not found',
            playerWrapper
        );
    }
}

/**
 * Inject audio controls
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
function injectAudioControlsToBasePlayer(playerWrapper: HTMLElement) {
    const audioPlayerRightControlsElement = playerWrapper.querySelector("div[class*=LongAudioControlsView_right]");

    if (!audioPlayerRightControlsElement) {
        console.error(
            'Error injecting audio controls: Audio player right controls element by selector "div[class*=LongAudioControlsView_right]" not found',
            playerWrapper
        );

        return;
    }

    // Add download button stub to player control
    audioPlayerRightControlsElement.insertAdjacentHTML("beforeend", audioControlsStub());

    const link = playerWrapper.querySelector("#mb-audio-download-button-stub");

    if (link) {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            showDownloadAudioTooltip(event as MouseEvent);
        });
    } else {
        console.warn(
            'Error injecting download audio stub button: Download stub button element by selector "#mb-audio-download-button-stub" not found',
            playerWrapper
        );
    }
}

/**
 * Inject VK player controls
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @param {boolean} canBeDownloaded Flag can user download video
 */
function injectVideoControls(playerWrapper: HTMLElement, canBeDownloaded: boolean) {
    const controlsElement = playerWrapper.querySelector(".controls .controls-right");

    if (!controlsElement) {
        console.error(
            'Error injecting video player controls: Controls element by selector ".controls .controls-right" not found',
            playerWrapper
        );
        return;
    }

    controlsElement.lastElementChild?.insertAdjacentHTML("beforebegin", videoControls());

    const additionalControls = controlsElement.querySelector("#mb-video-controls") as HTMLElement | null;

    if (!additionalControls) {
        console.error(
            'Error injecting video player controls: Additional controls element by selector "#mb-video-controls" not found',
            controlsElement
        );
        return;
    }

    // Add PiP button (for supported browsers)
    if (document.pictureInPictureEnabled) {
        additionalControls.insertAdjacentHTML("beforeend", pipButton());
        const pipButtonElement = additionalControls.querySelector("#mb-pip");

        if (pipButtonElement) {
            pipButtonElement.addEventListener("click", (event) => preparePip(event as MouseEvent));
        } else {
            console.warn(
                'Error injecting picture-in-picture button: Picture-in-Picture button element by selector "#mb-pip" not found',
                additionalControls
            );
        }
    }

    // Add Download button
    if (canBeDownloaded) {
        additionalControls.insertAdjacentHTML("beforeend", videoDownloadButton());
        const downloadButton = additionalControls.querySelector("#mb-video-download-button");

        if (downloadButton) {
            downloadButton.addEventListener("click", () => prepareVideoDownload(playerWrapper));
        } else {
            console.warn(
                'Error injecting download video button: Download button element by selector "#mb-download" not found',
                additionalControls
            );
        }
    }
}

/**
 * Prepare and open video download modal
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
async function prepareVideoDownload(playerWrapper: HTMLElement) {
    const videoId = getVideoId(playerWrapper);
    console.debug("Video ID", videoId);

    const playerUrls: PlayerUrl[] = contentCache.get(videoId);
    console.debug("Player urls", playerUrls);

    injectVideoDownloadModal(playerUrls);
}

/**
 * Prepare video download modal
 *
 * @param {PlayerUrl[]} playerUrls Player urls
 */
function injectVideoDownloadModal(playerUrls: PlayerUrl[]) {
    // Exit from fullscreen mode
    if (document.fullscreenElement) {
        document
            .exitFullscreen()
            .then(() => console.debug("Document exited from Full screen mode"))
            .catch((error) => console.error("Error exiting from Full screen mode:", error));
    }

    // Close in dialogs
    const closeButton = document.querySelector("button[class*=MediaSwiper_closeButton_]") as HTMLButtonElement | null;
    if (closeButton) {
        closeButton.click();
    }

    const app = document.querySelector("[class^=App_app_]");
    if (!app) {
        console.error('Error injecting video download modal: App element by selector "[class^=App_app_]" not found', document);
        return;
    }

    app.insertAdjacentHTML("beforeend", videoDownloadModal(playerUrls));

    const videoDownloadModalElement = document.querySelector("#mb-video-download-modal");

    if (!videoDownloadModalElement) {
        console.error(
            'Error injecting video download modal: Video download modal element by selector "#mb-video-download-modal" not found',
            document
        );
        return;
    }

    const videoDownloadClose = document.querySelector("#mb-video-download-close");

    if (videoDownloadClose) {
        videoDownloadClose.addEventListener("click", (event) => {
            event.preventDefault();
            videoDownloadModalElement.remove();
        });
    } else {
        console.error('Video download close button element by selector "#mb-video-download-close" not found', document);
    }

    const videoDownloadLinks = videoDownloadModalElement.querySelectorAll("#mb-video-download-link");

    console.debug("Video download links", videoDownloadLinks);

    for (const link of videoDownloadLinks) {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            videoDownloadModalElement.remove();
            downloadContent(event as MouseEvent);
        });
    }
}

/**
 * Download content by generating link and click on it
 *
 * @param {MouseEvent} event Click download content link event
 */
function downloadContent(event: MouseEvent) {
    const element = event.currentTarget as HTMLElement;
    const { url } = element.dataset;

    console.group("Prepare download link");

    if (!url) {
        console.debug("Download link not found in button element");
        console.groupEnd();
        return;
    }

    console.debug(`Download link "${url}"`);

    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.target = "_blank";

    document.body.append(link);
    link.click();

    console.debug("Link clicked", link);
    console.groupEnd();

    setTimeout(() => {
        link.remove();
    }, 1000);
}

/**
 * Show download audio tooltip
 *
 * @param {MouseEvent} event Click download stub button event
 */
function showDownloadAudioTooltip(event: MouseEvent) {
    const audioTooltipElement = document.querySelector("#mb-audio-download-tooltip");

    if (audioTooltipElement) {
        // Element already exists
        return;
    }

    const element = event.currentTarget as HTMLElement;

    const rect = element.getBoundingClientRect();

    document.body.insertAdjacentHTML("afterbegin", audioDownloadTooltip(rect.left + window.scrollX, rect.top + window.scrollY));

    const createdAudioTooltipElement = document.querySelector("#mb-audio-download-tooltip");

    if (!createdAudioTooltipElement) {
        console.error(
            'Error injecting audio download tooltip: Audio download tooltip element by selector "#mb-audio-download-tooltip" not found',
            document
        );
        return;
    }

    const tooltipDownloadClose = document.querySelector("#mb-audio-download-tooltip-close");

    if (tooltipDownloadClose) {
        tooltipDownloadClose.addEventListener("click", (tooltipEvent) => {
            tooltipEvent.preventDefault();
            createdAudioTooltipElement.remove();
        });
    } else {
        console.error('Audio download tooltip close button element by selector "#mb-audio-download-tooltip-close" not found', document);
    }

    setTimeout(() => {
        createdAudioTooltipElement.remove();
    }, 5000);
}

/**
 * Save/retrieve the last timestamp for the video
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
function lastVideoTimestamp(playerWrapper: HTMLElement) {
    const videoElement = playerWrapper.querySelector("video");

    if (!videoElement) {
        console.error(
            'Error save/retrieve the last timestamp for the video: Video player element by selector "video" not found',
            playerWrapper
        );
        return;
    }

    playContentEvent(videoElement, playerWrapper);
}

/**
 * Inject play event for timestamps
 *
 * @param {HTMLAudioElement|HTMLVideoElement} player Audio/video player element
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
function playContentEvent(player: HTMLAudioElement | HTMLVideoElement, playerWrapper: HTMLElement) {
    player.addEventListener("timeupdate", () => startTimestampSaving(player, playerWrapper), { once: true });
}

/**
 * Save the current audio/video timestamp
 *
 * @param {HTMLAudioElement|HTMLVideoElement} player Audio/video player element
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
async function startTimestampSaving(player: HTMLAudioElement | HTMLVideoElement, playerWrapper: HTMLElement) {
    const contentID = getContentID(player);

    if (!contentID) {
        console.warn("Error saving timestamp: Cannot find a content ID for player", player);
        return;
    }

    console.debug("Content duration:", player.duration);
    if (player.duration <= 60) {
        console.debug("Skip saving timestamp for player because the content is too short", player, player.duration);
        return;
    }

    const savedTimestamp = await sendGetTimestampMessage(contentID);
    let previouslySavedTimestamp = 0;

    if (savedTimestamp) {
        player.currentTime = savedTimestamp;
        if (player.tagName === "VIDEO") {
            injectSavedVideoTimestampIndicator(playerWrapper, player.duration, savedTimestamp);
        }

        previouslySavedTimestamp = savedTimestamp;
    }

    player.addEventListener("timeupdate", async () => {
        const currentTimestamp = player.currentTime;

        if (currentTimestamp - previouslySavedTimestamp < 10) {
            // Not 10 seconds have passed until the next save
            return;
        }

        if (
            // First 10 second of the content
            currentTimestamp <= 10 ||
            // Last ten seconds of the content
            player.duration - currentTimestamp <= 10
        ) {
            // Ignore this video
            return;
        }

        console.debug(
            `Update time by timeupdate event: initial saved timestamp: ${savedTimestamp}; previously saved timestamp: ${previouslySavedTimestamp}; timestamp to save: ${currentTimestamp}`,
            player
        );

        previouslySavedTimestamp = currentTimestamp;
        sendSaveTimestampMessage(contentID, currentTimestamp);
    });

    player.addEventListener("pause", async () => {
        const currentTimestamp = player.currentTime;

        console.debug(
            `Update time by pause event: initial saved timestamp: ${savedTimestamp}; previously saved timestamp: ${previouslySavedTimestamp}; timestamp to save: ${currentTimestamp}`,
            player
        );

        previouslySavedTimestamp = currentTimestamp;
        sendSaveTimestampMessage(contentID, currentTimestamp);
    });
}

/**
 * Inject a last timestamp indicator for a video
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @param {number} duration Video duration
 * @param {number} timestamp Timestamp to inject
 */
function injectSavedVideoTimestampIndicator(playerWrapper: HTMLElement, duration: number, timestamp: number) {
    const bars = playerWrapper.querySelector(".bars");

    if (!bars) {
        console.warn('Error inject saved timestamp indicator for video: Bars element by selector ".bars" not found', playerWrapper);
        return;
    }

    const position = (timestamp * 100) / duration;
    const template = videoTimestampIndicator(position);

    console.debug(`Inject saved timestamp indicator with position ${position}% to video player`, bars);

    bars.insertAdjacentHTML("beforeend", template);
}

/**
 * Send a message to background script to retrieve timestamp
 *
 * @param {string} id Timestamp ID
 * @returns {Promise<number|null>} Timestamp
 */
async function sendGetTimestampMessage(id: string): Promise<number | null> {
    const response = await sendMessage<RequestTimestampBackgroundMessage, TimestampInfoContentMessage>({
        target: [MessageTarget.BACKGROUND],
        type: BackgroundMessageType.REQUEST_TIMESTAMP,
        data: { id }
    });

    if (response) {
        return response.data.timestamp;
    }

    return null;
}

/**
 * Send a message to background script to save timestamp
 *
 * @param {string} id Timestamp ID
 * @param {number} timestamp Timestamp to save
 */
function sendSaveTimestampMessage(id: string, timestamp: number) {
    sendMessage<SaveTimestampBackgroundMessage>({
        target: [MessageTarget.BACKGROUND],
        type: BackgroundMessageType.SAVE_TIMESTAMP,
        data: { id, timestamp }
    });
}

/**
 * Retrieves an ID for the audio/video element
 *
 * @param {HTMLAudioElement|HTMLVideoElement} player Audio/video player element
 * @returns {string|null|undefined} Content ID
 */
function getContentID(player: HTMLAudioElement | HTMLVideoElement): string | null | undefined {
    if (player.tagName === "VIDEO") {
        const playerWrapper = player.closest(".player-wrapper") as HTMLElement | null;

        if (!playerWrapper) {
            console.warn('Error retrieving content ID: Player wrapper element by selector ".player-wrapper" not found', player);
            return null;
        }

        return getVideoId(playerWrapper);
    }

    if (player.tagName === "AUDIO") {
        const src = player.getAttribute("src");

        if (!src) {
            console.warn("Error retrieving content ID: Audio element has no src attribute", player);
            return null;
        }

        const contentURL = new URL(src);

        return contentURL.pathname.replace("/audio/", "");
    }

    console.warn("Error retrieving content ID: Player is not an audio/video element", player);
    return null;
}

/**
 * Operate Picture-in-picture
 *
 * @see {@link prepareVideoPlayer} for event conditions
 * @param {MouseEvent} event Picture-in-picture button click event
 */
function preparePip(event: MouseEvent) {
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
        const playerWrapper = (event.currentTarget as HTMLElement).parentElement?.parentElement?.parentElement?.parentElement
            ?.parentElement as HTMLElement;

        if (!playerWrapper) {
            console.error("Error enable picture-in-picture mode: Closest player wrapper element not found", event.currentTarget);
            return;
        }

        const videoElement = playerWrapper.querySelector("video");

        if (!videoElement) {
            console.error('Error enable picture-in-picture mode: Video player element by selector "video" not found', playerWrapper);
            return;
        }
        videoElement.requestPictureInPicture();
    }
}

/**
 * Force video quality
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @param {VideoQualityEnum} videoQuality Video quality
 */
function forceVideoQuality(playerWrapper: HTMLElement, videoQuality: VideoQualityEnum) {
    const itemQuality = playerWrapper.querySelectorAll("li.item-quality") as NodeListOf<HTMLElement>;

    for (const quality of itemQuality) {
        if (quality.dataset.value === videoQuality) {
            quality.click();
            break;
        }

        itemQuality[0].click();
    }
}

/**
 * Return content components
 *
 * @param {ContentMetadata} metadata
 * @returns {(Promise<VideoInfo[]|null>)}
 */
async function sendGetContentComponentsMessage(metadata: ContentMetadata): Promise<VideoInfo[] | null> {
    const accessToken = getAccessToken();
    if (accessToken) {
        const response = await sendMessage<RequestContentDataBackgroundMessage, ContentDataInfoContentMessage>({
            target: [MessageTarget.BACKGROUND],
            type: BackgroundMessageType.REQUEST_CONTENT_DATA,
            data: { metadata, accessToken }
        });

        if (response) {
            return response.data.contentData;
        }

        return null;
    }
    return null;
}

/**
 * Gets an access token from local storage
 *
 * @returns {(string|null)}
 */
function getAccessToken(): string | null {
    const auth = globalThis.localStorage.getItem("auth");
    if (auth) {
        return JSON.parse(auth).accessToken;
    }
    return null;
}

/**
 * Returns the content metadata (post/dialog/etc)
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @returns {ContentMetadataWithUnknown}
 */
function getContentMetadata(playerWrapper: HTMLElement): ContentMetadataWithUnknown {
    const playerRoot = (playerWrapper.getRootNode() as ShadowRoot).host;
    const currentPageUrl = new URL(globalThis.location.href);
    const pathName = currentPageUrl.pathname;

    // Single post page
    if (pathName.includes("/posts/")) {
        return generatePostMetadata(pathName);
    }

    // Message page with dialog selected
    if (pathName.includes("/app/messages") && currentPageUrl.searchParams.has("dialogId")) {
        return {
            type: "dialog",
            id: currentPageUrl.searchParams.get("dialogId") as string
        };
    }

    // Media page
    if (pathName.includes("/media/")) {
        return generateMediaMetadata(pathName);
    }

    // Post on main blog page
    const postContent = playerRoot.closest("div[class*=Post_root_]") as HTMLElement | null;
    if (postContent) {
        const postLinkElement = postContent.querySelector("a[class*=CreatedAt_headerLink_]") as HTMLAnchorElement | null;

        if (postLinkElement) {
            const postLink = postLinkElement.href;

            return generatePostMetadata(postLink);
        }
    }

    // Other cases (maybe author bio or various blocks)
    return {
        type: "unknown"
    };
}

/**
 * Generate generic post metadata from URL/pathname
 *
 * @param {string} url Page URL
 * @returns {BlogContentMetadata} Blog content metadata
 */
function generatePostMetadata(url: string): BlogContentMetadata {
    return {
        type: "post",
        id: url.split("/").reverse()[0],
        blogName: url.split("/").reverse()[2]
    };
}

/**
 * Generate generic media metadata from URL/pathname
 *
 * @param {string} url Page URL
 * @returns {BlogContentMetadata} Blog content metadata
 */
function generateMediaMetadata(url: string): BlogContentMetadata {
    return {
        type: "post",
        id: url.split("/").reverse()[1],
        blogName: url.split("/").reverse()[4]
    };
}

/**
 * Returns the video ID (from dataset or from preview)
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @returns {string|null|undefined} Video ID
 */
function getVideoId(playerWrapper: HTMLElement): string | null | undefined {
    if ("videoId" in playerWrapper.dataset) {
        console.debug("Video ID from dataset", playerWrapper.dataset.videoId);
        return playerWrapper.dataset.videoId;
    }

    const previewContainer = playerWrapper.querySelector(".container[style*=background-image]") as HTMLElement | null;

    if (!previewContainer) {
        console.error(
            'Error getting video ID: Video preview container by selector ".container[style*=background-image]" not found',
            playerWrapper
        );
        return null;
    }

    console.debug("Video preview container", previewContainer);

    const previewAttribute = previewContainer.style.backgroundImage;
    console.debug("Video preview attribute", previewAttribute);

    const regex = /url\("(.*)"\)/gm;
    const previewUrl = regex.exec(previewAttribute)?.[1];

    if (!previewUrl) {
        console.error("Error getting video ID: Video preview URL not found", previewAttribute);
        return null;
    }

    const videoId = parseVideoId(previewUrl);

    if (!videoId) {
        console.error("Error getting video ID: Failed to parse video ID from preview URL", previewUrl);
        return null;
    }

    playerWrapper.dataset.videoId = videoId;
    console.debug("Video ID from preview", videoId);

    return videoId;
}
