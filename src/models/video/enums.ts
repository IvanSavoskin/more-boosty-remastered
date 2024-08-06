// https://www.npmjs.com/package/@vkontakte/videoplayer-shared?activeTab=code
// vkontakte/videoplayer-shared/types/utils/quality/types.d.ts
export enum VideoQualityEnum {
    Q_2160P = "2160p",
    Q_1440P = "1440p",
    Q_1080P = "1080p",
    Q_720P = "720p",
    Q_480P = "480p",
    Q_360P = "360p",
    Q_240P = "240p",
    Q_144P = "144p"
}

/**
 * List of supported video quality on Boosty
 */
export enum VideoQualityTypeEnum {
    ULTRA_HD = "ultra_hd", // 2160p
    QUAD_HD = "quad_hd", // 1440p
    FULL_HD = "full_hd", // 1080p
    HIGH = "high", // 720p
    MEDIUM = "medium", // 480p
    LOW = "low", // 360p
    LOWEST = "lowest", // 240p
    TINY = "tiny" // 144p
}
