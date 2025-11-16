import { VideoQualityEnum } from "../video/enums";

export interface UserOptions {
    fullLayout: boolean;
    fullLayoutWidth: number;
    forceVideoQuality: boolean;
    videoQuality: VideoQualityEnum;
    saveLastTimestamp: boolean;
    theaterMode: boolean;
    sync: boolean;
}
