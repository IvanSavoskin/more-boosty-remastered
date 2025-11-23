import type { GalleryButtonConfig, GalleryFlipDirection, GalleryTransformState } from "@models/gallery/types";

import { flipHorizontal, flipVertical, rotateLeft, rotateRight } from "./templates";

const GALLERY_BUTTON_GROUP_ID = "mb-gallery-button-group";
const TOOLBAR_SELECTOR = ".pswp__top-bar";
const CLOSE_BUTTON_SELECTOR = ".pswp__button--close";
const CURRENT_IMAGE_SELECTOR = ".pswp__item--current img.pswp__img";
const IMAGE_SELECTOR = "img.pswp__img";

const trackedGalleries = new WeakSet<HTMLElement>();
const imageStates = new WeakMap<HTMLImageElement, GalleryTransformState>();
const imageObservers = new WeakMap<HTMLImageElement, MutationObserver>();
const pendingStyleUpdates = new WeakSet<HTMLImageElement>();

const DEFAULT_STATE: GalleryTransformState = Object.freeze({
    rotation: 0,
    flipX: 1,
    flipY: 1
});

const BUTTONS: GalleryButtonConfig[] = [
    {
        icon: rotateLeft,
        title: "Повернуть влево",
        onClick: (image) => rotateImage(image, -90)
    },
    {
        icon: rotateRight,
        title: "Повернуть вправо",
        onClick: (image) => rotateImage(image, 90)
    },
    {
        icon: flipHorizontal,
        title: "Отразить по горизонтали",
        onClick: (image) => flipImage(image, "horizontal")
    },
    {
        icon: flipVertical,
        title: "Отразить по вертикали",
        onClick: (image) => flipImage(image, "vertical")
    }
];

/**
 * Determine whether the provided transform state deviates from the default orientation.
 *
 * @param state Transform configuration for the current image.
 * @returns True when any rotation or flipping is applied.
 */
function hasCustomTransform(state: GalleryTransformState): boolean {
    return state.rotation % 360 !== 0 || state.flipX !== 1 || state.flipY !== 1;
}

/**
 * Normalize a rotation value so it always falls within the 0–359 degree range.
 *
 * @param value Arbitrary rotation value that may be negative or exceed 360 degrees.
 * @returns Normalized positive rotation less than 360 degrees.
 */
function normalizeRotation(value: number): number {
    const normalized = value % 360;

    if (normalized === 0) {
        return 0;
    }

    return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Rebuild the transform style for an image based on the stored base transform and state.
 *
 * @param image Target gallery image element.
 * @param state Rotation/flip configuration to apply.
 */
function applyImageTransform(image: HTMLImageElement, state: GalleryTransformState) {
    const baseTransform = image.dataset.mbBaseTransform ?? image.style.transform ?? "";
    const transforms: string[] = [];

    if (state.rotation % 360 !== 0) {
        transforms.push(`rotate(${state.rotation}deg)`);
    }

    if (state.flipX !== 1) {
        transforms.push(`scaleX(${state.flipX})`);
    }

    if (state.flipY !== 1) {
        transforms.push(`scaleY(${state.flipY})`);
    }

    pendingStyleUpdates.add(image);

    image.style.transform = transforms.length === 0 ? baseTransform.trim() : `${baseTransform} ${transforms.join(" ")}`.trim();
}

/**
 * Ensure a mutation observer keeps PhotoSwipe style rewrites in sync with user transforms.
 *
 * @param image Image element that should be tracked.
 */
function ensureImageObserver(image: HTMLImageElement) {
    if (imageObservers.has(image)) {
        return;
    }

    const observer = new MutationObserver(() => {
        if (pendingStyleUpdates.has(image)) {
            pendingStyleUpdates.delete(image);
            return;
        }

        image.dataset.mbBaseTransform = image.style.transform || "";
        const state = imageStates.get(image);

        if (state && hasCustomTransform(state)) {
            applyImageTransform(image, state);
        }
    });

    observer.observe(image, { attributes: true, attributeFilter: ["style"] });
    imageObservers.set(image, observer);
}

/**
 * Reset an image to its default transform state while capturing the base PhotoSwipe transform.
 *
 * @param image Image element to reset.
 */
function resetImageState(image: HTMLImageElement) {
    imageStates.set(image, { ...DEFAULT_STATE });
    image.dataset.mbBaseTransform = image.style.transform || "";
    pendingStyleUpdates.add(image);
    image.style.transform = image.dataset.mbBaseTransform ?? "";
}

/**
 * Mark an image as gallery-ready by wiring load/reset handlers and mutation observers.
 *
 * @param image Image element to initialize.
 */
function prepareImage(image: HTMLImageElement) {
    if (image.dataset.mbGalleryReady === "true") {
        return;
    }

    image.addEventListener("load", () => {
        resetImageState(image);
    });

    resetImageState(image);
    ensureImageObserver(image);

    image.dataset.mbGalleryReady = "true";
}

/**
 * Update the stored transform state for an image and reapply resulting transforms.
 *
 * @param image Image element with mutable state.
 * @param updater Callback that mutates the draft state object.
 */
function updateImageState(image: HTMLImageElement, updater: (state: GalleryTransformState) => void) {
    const currentState = { ...(imageStates.get(image) ?? DEFAULT_STATE) };

    updater(currentState);

    currentState.rotation = normalizeRotation(currentState.rotation);
    imageStates.set(image, currentState);

    if (!image.dataset.mbBaseTransform) {
        image.dataset.mbBaseTransform = image.style.transform || "";
    }

    applyImageTransform(image, currentState);
}

/**
 * Rotate an image by the specified degree delta.
 *
 * @param image Target gallery image element.
 * @param delta Signed degrees to add to the current rotation.
 */
function rotateImage(image: HTMLImageElement, delta: number) {
    updateImageState(image, (state) => {
        state.rotation += delta;
    });
}

/**
 * Toggle an image flip across the requested axis.
 *
 * @param image Target gallery image element.
 * @param axis Axis direction to mirror (horizontal or vertical).
 */
function flipImage(image: HTMLImageElement, axis: GalleryFlipDirection) {
    updateImageState(image, (state) => {
        if (axis === "horizontal") {
            state.flipX = (state.flipX === 1 ? -1 : 1) as 1 | -1;
            return;
        }

        state.flipY = (state.flipY === 1 ? -1 : 1) as 1 | -1;
    });
}

/**
 * Retrieve the currently active PhotoSwipe image within a gallery overlay.
 *
 * @param gallery Root gallery element.
 * @returns Active image node or null when unavailable.
 */
function getCurrentImage(gallery: HTMLElement): HTMLImageElement | null {
    return gallery.querySelector(CURRENT_IMAGE_SELECTOR) ?? gallery.querySelector(IMAGE_SELECTOR);
}

/**
 * Guarded execution helper that only runs toolbar actions when an image is present.
 *
 * @param gallery Root gallery element.
 * @param handler Action to perform on the current image.
 */
function handleButtonClick(gallery: HTMLElement, handler: (image: HTMLImageElement) => void) {
    const currentImage = getCurrentImage(gallery);

    if (!currentImage) {
        return;
    }

    handler(currentImage);
}

/**
 * Inject rotate/flip buttons into the PhotoSwipe toolbar for a gallery instance.
 *
 * @param gallery Root gallery element whose toolbar should be augmented.
 */
function injectTransformButtons(gallery: HTMLElement) {
    const toolbar = gallery.querySelector<HTMLElement>(TOOLBAR_SELECTOR);

    if (toolbar) {
        const withPlayer = !!gallery.querySelector(".pswp__item[aria-hidden=false] vk-video-player");
        const withImg = !!gallery.querySelector(".pswp__item[aria-hidden=false] img");

        if (!withPlayer && !withImg) {
            return;
        }

        if (toolbar.dataset.mbButtonsReady === "true") {
            const buttonGroup = gallery.querySelector(`#${GALLERY_BUTTON_GROUP_ID}`);

            if (buttonGroup) {
                if (withPlayer) {
                    buttonGroup.ariaHidden = "true";
                    buttonGroup.classList.add("mb-pswp-button-group-hidden");
                } else {
                    buttonGroup.ariaHidden = "false";
                    buttonGroup.classList.remove("mb-pswp-button-group-hidden");
                }
            }
        } else {
            const closeButton = toolbar.querySelector(CLOSE_BUTTON_SELECTOR);
            const group = document.createElement("div");
            group.id = GALLERY_BUTTON_GROUP_ID;
            group.classList.add("mb-pswp-button-group");
            if (withPlayer) {
                group.ariaHidden = "true";
                group.classList.add("mb-pswp-button-group-hidden");
            }

            for (const config of BUTTONS) {
                const button = document.createElement("button");
                button.type = "button";
                button.classList.add("pswp__button", "mb-pswp-button");
                button.title = config.title;
                button.setAttribute("aria-label", config.title);

                button.insertAdjacentHTML("afterbegin", config.icon);

                button.addEventListener("click", (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    handleButtonClick(gallery, config.onClick);
                });

                group.append(button);
            }

            toolbar.insertBefore(group, closeButton ?? null);
            toolbar.dataset.mbButtonsReady = "true";
        }
    }
}

/**
 * Disable the PhotoSwipe context-menu guard that blocks image saving.
 *
 * @param gallery Root gallery element.
 */
function removeImageCopyProtection(gallery: HTMLElement) {
    if (gallery.dataset.mbCopyProtectionRemoved === "true") {
        return;
    }

    gallery.dataset.mbCopyProtectionRemoved = "true";

    gallery.addEventListener(
        "contextmenu",
        (event) => {
            event.stopImmediatePropagation();
        },
        true
    );
}

/**
 * Observe gallery DOM mutations so lazily-loaded images receive initialization.
 *
 * @param gallery Root gallery element containing PhotoSwipe items.
 */
function observeGalleryImages(gallery: HTMLElement) {
    const syncImages = () => {
        injectTransformButtons(gallery);
        const images = gallery.querySelectorAll<HTMLImageElement>(IMAGE_SELECTOR);

        for (const image of images) {
            prepareImage(image);
        }
    };

    const observer = new MutationObserver(syncImages);

    observer.observe(gallery, { childList: true, subtree: true });
    syncImages();
}

/**
 * Enhance a PhotoSwipe gallery by enabling orientation controls and copy access.
 *
 * @param gallery Root gallery element to enhance.
 */
export default function enhanceGallery(gallery: HTMLElement) {
    removeImageCopyProtection(gallery);

    if (trackedGalleries.has(gallery)) {
        return;
    }

    trackedGalleries.add(gallery);
    observeGalleryImages(gallery);
}
