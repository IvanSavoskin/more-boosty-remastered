import sendMessage from "@coreUtils/messagesUtils";
import { parseVideoId } from "@coreUtils/videoUtils";
import { BlogContentMetadata, ContentMetadata, ContentMetadataWithUnknown } from "@models/boosty/types";
import { BackgroundMessageType, MessageTarget } from "@models/messages/enums";
import {
    ContentDataInfoContentMessage,
    PlaybackRateInfoContentMessage,
    RequestContentDataBackgroundMessage,
    RequestPlaybackRateBackgroundMessage,
    RequestTimestampBackgroundMessage,
    SavePlaybackRateBackgroundMessage,
    SaveTimestampBackgroundMessage,
    TimestampInfoContentMessage
} from "@models/messages/types";
import { UserOptions } from "@models/options/types";
import { VideoQualityEnum } from "@models/video/enums";
import { PlayerUrl, VideoInfo } from "@models/video/types";

import {
    audioControls,
    controls,
    pipButton,
    timestampIndicator,
    videoDownloadButton,
    videoDownloadModal,
    videoSpeedController
} from "./templates";

// Content cache for videos
const contentCache = new Map();

// Previous playback rate for the speed controller
let previousPlaybackRate = 1;

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

    // Get the last recorded playback rate
    const playbackRate = await sendGetPlaybackRateMessage();

    // Inject controls
    injectVideoControls(playerWrapper, contentMetadata.type !== "unknown", playbackRate);

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
 * @param {UserOptions} options Extension options
 */
export async function prepareAudioPlayer(element: HTMLElement, options: UserOptions) {
    // Get the last recorded playback rate
    const playbackRate = await sendGetPlaybackRateMessage();

    // Inject controls
    injectAudioControls(element, playbackRate);

    // Save/retrieve timestamp
    if (options.saveLastTimestamp) {
        lastAudioTimestamp(element);
    }
}

/**
 * Inject audio controls
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @param {number} playbackRate Playback rate
 */
function injectAudioControls(playerWrapper: HTMLElement, playbackRate: number) {
    const audio = playerWrapper.querySelector("audio");
    const audioUrl = audio?.src;
    const audioPlayerTitleElement = playerWrapper.querySelector("div[class*=AudioPlayer_title]");

    if (audioUrl && audioPlayerTitleElement) {
        const audioControlsElement = audioControls(audioUrl, playbackRate);
        // Add speed control and download buttons to player title
        audioPlayerTitleElement.insertAdjacentHTML("afterend", audioControlsElement);

        // Initialize playback speed controller
        playbackSpeedController(playerWrapper, audio, playbackRate);

        const link = playerWrapper.querySelector(".mb-download");

        if (link) {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                downloadContent(event as MouseEvent);
            });
        }
    }
}

/**
 * Inject VK player controls
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @param {boolean} canBeDownloaded Flag can user download video
 * @param {number} playbackRate Playback rate
 */
function injectVideoControls(playerWrapper: HTMLElement, canBeDownloaded: boolean, playbackRate: number) {
    const controlsElement = playerWrapper.querySelector(".controls .controls-right");

    if (!controlsElement) {
        console.error(
            'Error injecting video player controls: Controls element by selector ".controls .controls-right" not found',
            playerWrapper
        );
        return;
    }

    controlsElement.lastElementChild?.insertAdjacentHTML("beforebegin", controls());

    const additionalControls = controlsElement.querySelector(".mb-controls") as HTMLElement | null;

    if (!additionalControls) {
        console.error(
            'Error injecting video player controls: Additional controls element by selector ".mb-controls" not found',
            controlsElement
        );
        return;
    }

    // Add PiP button (for supported browsers)
    if (document.pictureInPictureEnabled) {
        additionalControls.insertAdjacentHTML("beforeend", pipButton());
        const pipButtonElement = additionalControls.querySelector(".mb-pip");

        if (pipButtonElement) {
            pipButtonElement.addEventListener("click", (event) => preparePip(event as MouseEvent));
        } else {
            console.warn(
                'Error injecting picture-in-picture button: Picture-in-Picture button element by selector ".mb-pip" not found',
                additionalControls
            );
        }
    }

    // Add Download button
    if (canBeDownloaded) {
        additionalControls.insertAdjacentHTML("beforeend", videoDownloadButton());
        const downloadButton = additionalControls.querySelector(".mb-download");

        if (downloadButton) {
            downloadButton.addEventListener("click", () => prepareVideoDownload(playerWrapper));
        } else {
            console.warn(
                'Error injecting download button: Download button element by selector "mb-download" not found',
                additionalControls
            );
        }
    }

    // Add and initialize speed controller
    additionalControls.insertAdjacentHTML("beforeend", videoSpeedController(playbackRate));

    const player = playerWrapper.querySelector("video");

    if (player) {
        playbackSpeedController(additionalControls, player, playbackRate);
    } else {
        console.warn('Error injecting playback speed control to video player: Video element by selector "video" not found', playerWrapper);
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

    const videoDownloadModalElement = document.querySelector("#mb-video-download");

    if (!videoDownloadModalElement) {
        console.error(
            'Error injecting video download modal: Video download modal element by selector "#mb-video-download" not found',
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

    const videoDownloadLinks = videoDownloadModalElement.querySelectorAll(".mb-video-download-link");

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

    if (!url) {
        return;
    }

    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.target = "_blank";

    document.body.append(link);

    link.click();

    setTimeout(() => {
        link.remove();
    }, 1000);
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
 * Save/retrieve the last timestamp for the audio
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
function lastAudioTimestamp(playerWrapper: HTMLElement) {
    const audioElement = playerWrapper.querySelector("audio");

    if (!audioElement) {
        console.error(
            'Error save/retrieve the last timestamp for the audio: Audio player element by selector "audio" not found',
            playerWrapper
        );
        return;
    }

    playContentEvent(audioElement, playerWrapper);
}

/**
 * Inject play event for timestamps
 *
 * @param {HTMLAudioElement|HTMLVideoElement} player Audio/video player element
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
function playContentEvent(player: HTMLAudioElement | HTMLVideoElement, playerWrapper: HTMLElement) {
    player.addEventListener("timeupdate", () => saveTimestamp(player, playerWrapper), { once: true });
}

/**
 * Save the current audio/video timestamp
 *
 * @param {HTMLAudioElement|HTMLVideoElement} player Audio/video player element
 * @param {HTMLElement} playerWrapper Player wrapper element
 */
async function saveTimestamp(player: HTMLAudioElement | HTMLVideoElement, playerWrapper: HTMLElement) {
    const contentID = getContentID(player);

    if (!contentID) {
        console.warn("Error saving timestamp: Cannot find a content ID for player", player);
        return;
    }

    console.debug("Content duration:", player.duration);
    if (player.duration <= 60) {
        console.debug("Skip saving timestamp for player because the video is too short", player);
        return;
    }

    const savedTimestamp = await sendGetTimestampMessage(contentID);
    if (savedTimestamp) {
        player.currentTime = savedTimestamp;
        if (player.tagName === "VIDEO") {
            injectSavedTimestampIndicator(playerWrapper, player.duration, savedTimestamp);
        }
    }

    let timeToSave = true;
    let previouslySavedTimestamp = 0;
    player.addEventListener("timeupdate", async () => {
        console.debug("Time update event", timeToSave, player.currentTime);
        if (!timeToSave) {
            return;
        }

        let currentTimestamp = player.currentTime;
        if (
            // First one minute of the content
            currentTimestamp <= 10 ||
            // Last one minute of the content
            player.duration - currentTimestamp <= 10
        ) {
            // Ignore this video
            currentTimestamp = 0;
        }

        // Disable the function call
        timeToSave = false;

        console.debug("Update time", timeToSave, currentTimestamp, savedTimestamp, previouslySavedTimestamp);
        if (
            // Prevents useless caching right after starts playing
            currentTimestamp !== savedTimestamp &&
            // Prevents useless caching when timestamp has not changed (pause, ignored)
            currentTimestamp !== previouslySavedTimestamp
        ) {
            sendSaveTimestampMessage(contentID, currentTimestamp);
            previouslySavedTimestamp = currentTimestamp;
        }

        // Throttle 'timeupdate' event call to once in 10 seconds
        /* eslint-disable no-return-assign */
        setTimeout(() => {
            timeToSave = true;
        }, 10_000);
    });
}

/**
 * Inject a last timestamp indicator for a video
 *
 * @param {HTMLElement} playerWrapper Player wrapper element
 * @param {number} duration Video duration
 * @param {number} timestamp Timestamp to inject
 */
function injectSavedTimestampIndicator(playerWrapper: HTMLElement, duration: number, timestamp: number) {
    const bars = playerWrapper.querySelector(".bars");

    if (!bars) {
        console.warn('Error inject saved timestamp indicator for video: Bars element by selector ".bars" not found', playerWrapper);
        return;
    }

    const position = (timestamp * 100) / duration;
    const template = timestampIndicator(position);

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
 * Send a message to background script to get playback rate
 *
 * @returns {Promise<number>} Playback rate
 */
async function sendGetPlaybackRateMessage(): Promise<number> {
    const response = await sendMessage<RequestPlaybackRateBackgroundMessage, PlaybackRateInfoContentMessage>({
        target: [MessageTarget.BACKGROUND],
        type: BackgroundMessageType.REQUEST_PLAYBACK_RATE
    });

    if (response) {
        return response.data.playbackRate;
    }

    return 1;
}

/**
 * Send a message to background script to save playback rate
 *
 * @param {number} playbackRate Playback rate to save
 */
function sendSavePlaybackRateMessage(playbackRate: number) {
    sendMessage<SavePlaybackRateBackgroundMessage>({
        target: [MessageTarget.BACKGROUND],
        type: BackgroundMessageType.SAVE_PLAYBACK_RATE,
        data: { playbackRate }
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
 * Playback speed controller
 *
 * @param {HTMLElement} controlsWrapper Controls wrapper element
 * @param {(HTMLAudioElement|HTMLVideoElement)} player Player element
 * @param {number} playbackRate Playback rate
 */
function playbackSpeedController(controlsWrapper: HTMLElement, player: HTMLAudioElement | HTMLVideoElement, playbackRate: number) {
    player.playbackRate = playbackRate;

    const decreaseButton = controlsWrapper.querySelector(".mb-speed-decrease");
    const increaseButton = controlsWrapper.querySelector(".mb-speed-increase");
    const playbackRateElement = controlsWrapper.querySelector(".mb-current-playback-rate");

    if (decreaseButton) {
        decreaseButton.addEventListener("click", (event) => {
            event.preventDefault();

            player.playbackRate = player.playbackRate - 0.25 > 0.25 ? player.playbackRate - 0.25 : 0.25;
            console.debug("Playback decreased", player.playbackRate, player);
            changePlaybackRate(player.playbackRate);
        });
    } else {
        console.warn(
            'Error while setting up playback speed decrease button: Decrease button by selector "mb-speed-decrease" not found',
            player
        );
    }

    if (increaseButton) {
        increaseButton.addEventListener("click", (event) => {
            event.preventDefault();

            player.playbackRate = player.playbackRate + 0.25 < 4 ? player.playbackRate + 0.25 : 4;
            console.debug("Playback increased", player.playbackRate, player);
            changePlaybackRate(player.playbackRate);
        });
    } else {
        console.warn(
            'Error while setting up playback speed increase button: Increase button by selector "mb-speed-increase" not found',
            player
        );
    }

    if (playbackRateElement) {
        playbackRateElement.addEventListener("click", (event) => {
            event.preventDefault();
            console.debug("Playback rate reset", player.playbackRate === 1 ? previousPlaybackRate : 1, player);

            if (player.playbackRate === 1) {
                changePlaybackRate(previousPlaybackRate);
            } else {
                previousPlaybackRate = player.playbackRate;
                changePlaybackRate(1);
            }
        });
    } else {
        console.warn(
            'Error while setting up playback speed rate element: Playback rate element by selector "mb-current-playback-rate" not found',
            player
        );
    }
}

/**
 * Change playback rate
 *
 * @param {number} playbackRate Current playback rate
 */
async function changePlaybackRate(playbackRate: number) {
    const playersList = [];
    const displaysList = [];

    // Audio
    const audioPlayers = document.querySelectorAll("audio");
    for (const audio of audioPlayers) {
        if (audio) {
            playersList.push(audio);
        }
    }

    const audioDisplays = document.querySelectorAll(".mb-current-playback-rate span");
    for (const display of audioDisplays) {
        if (display) {
            displaysList.push(display);
        }
    }

    // Video
    const videoPlayers = document.querySelectorAll("vk-video-player .shadow-root-container");
    for (const player of videoPlayers) {
        const video = player.shadowRoot?.querySelector("video");
        if (video) {
            playersList.push(video);
        }

        const display = player.shadowRoot?.querySelector(".mb-current-playback-rate span");
        if (display) {
            displaysList.push(display);
        }
    }

    // Change the playback speed
    for (const player of playersList) {
        player.playbackRate = playbackRate;
    }

    // Change the display
    for (const element of displaysList) {
        element.textContent = `x${playbackRate}`;
    }

    sendSavePlaybackRateMessage(playbackRate);
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
    const auth = window.localStorage.getItem("auth");
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
    const currentPageUrl = new URL(window.location.href);
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

    // Post on main blog page
    const postContent = playerRoot.closest("div[class*=Post_root_]") as HTMLElement | null;
    if (postContent) {
        const postLinkElement = postContent.querySelector("a[class*=CreatedAt_headerLink_]") as HTMLAnchorElement | null;

        if (postLinkElement) {
            const postLink = postLinkElement.href;

            return generatePostMetadata(postLink);
        }
    }

    // Post in Media tab
    const mediaContent = playerRoot.closest("div[class*=MediaViewer_root_]") as HTMLElement | null;
    if (mediaContent) {
        const mediaLinkElement = mediaContent.querySelector("a[class*=GoToPostButton_link_]") as HTMLAnchorElement | null;

        if (mediaLinkElement) {
            const mediaLink = mediaLinkElement.href;

            return generatePostMetadata(mediaLink);
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
