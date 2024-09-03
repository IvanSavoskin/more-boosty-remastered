import { VideoQualityEnum } from "../video/enums";

export interface UserOptions {
    fullLayout: boolean;
    forceVideoQuality: boolean;
    videoQuality: VideoQualityEnum;
    saveLastTimestamp: boolean;
    theaterMode: boolean;
    darkTheme: boolean;
    sync: boolean;
}
