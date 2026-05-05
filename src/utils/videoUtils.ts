import { VideoQualityTypeEnum } from "@models/video/enums";
import { PlayerUrl } from "@models/video/types";

import { $enum } from "ts-enum-util";

/**
 * Returns a sorted filtered list of video URLs (non-empty with type from VideoQualityTypeEnum)
 *
 * @see {@link VideoQualityTypeEnum} for the supported link types
 * @param {PlayerUrl[]} playerUrls List of video URLs with types
 * @returns {PlayerUrl[]} Filtered list with non-empty URLs and type from VideoQualityTypeEnum
 */
export function filterVideoUrls(playerUrls: PlayerUrl[]): PlayerUrl[] {
    return playerUrls
        .filter((playerUrl) => playerUrl.url && $enum(VideoQualityTypeEnum).isValue(playerUrl.type))
        .toSorted(
            ({ type: typeA }, { type: typeB }) =>
                $enum(VideoQualityTypeEnum).indexOfValue($enum(VideoQualityTypeEnum).asValueOrThrow(typeA)) -
                $enum(VideoQualityTypeEnum).indexOfValue($enum(VideoQualityTypeEnum).asValueOrThrow(typeB))
        );
}

/**
 * Returns a video ID from preview link
 *
 * @param {string} previewUrl Video preview URL
 * @returns {(string|null|undefined)} Video ID
 */
export function parseVideoId(previewUrl: string): string | null | undefined {
    let urlObject: URL;

    try {
        urlObject = new URL(previewUrl);
    } catch (error) {
        console.warn("Error parsing video ID: Invalid preview URL", previewUrl, error);
        return undefined;
    }

    if (urlObject.pathname.includes("videoPreview")) {
        return urlObject.searchParams.get("id");
    }

    if (urlObject.hostname.includes("images.boosty.to")) {
        const pathParts = urlObject.pathname.split("/").filter(Boolean);
        return pathParts.toReversed()[0];
    }

    return undefined;
}
