import { ContentMetadata } from "@models/boosty/types";
import { BackgroundMessageType, ContentMessageType, ContentOptionsMessageType, MessageTarget } from "@models/messages/enums";
import { UserOptions } from "@models/options/types";
import ThemeEnum from "@models/theme/enums";
import { VideoInfo } from "@models/video/types";

export interface Message {
    data?: Record<string, boolean | string | number | object | null>;
    target: string[];
    type: string;
}

export interface OpenOptionsPageBackgroundMessage extends Message {
    type: BackgroundMessageType.OPEN_OPTIONS_PAGE;
    target: [MessageTarget.BACKGROUND];
}

export interface RequestTimestampBackgroundMessage extends Message {
    type: BackgroundMessageType.REQUEST_TIMESTAMP;
    target: [MessageTarget.BACKGROUND];
    data: { id: string };
}

export interface SaveTimestampBackgroundMessage extends Message {
    type: BackgroundMessageType.SAVE_TIMESTAMP;
    target: [MessageTarget.BACKGROUND];
    data: { id: string; timestamp: number };
}

export interface RequestContentDataBackgroundMessage extends Message {
    type: BackgroundMessageType.REQUEST_CONTENT_DATA;
    target: [MessageTarget.BACKGROUND];
    data: { metadata: ContentMetadata; accessToken: string };
}

export interface RequestOptionsBackgroundMessage extends Message {
    type: BackgroundMessageType.REQUEST_OPTIONS;
    target: [MessageTarget.BACKGROUND];
}

export interface SaveOptionsBackgroundMessage extends Message {
    type: BackgroundMessageType.SAVE_OPTIONS;
    target: [MessageTarget.BACKGROUND];
    data: { options: UserOptions };
}

export interface SaveSyncOptionBackgroundMessage extends Message {
    type: BackgroundMessageType.SAVE_SYNC_OPTION;
    target: [MessageTarget.BACKGROUND];
    data: { sync: boolean };
}

export interface RequestThemeBackgroundMessage extends Message {
    type: BackgroundMessageType.REQUEST_THEME;
    target: [MessageTarget.BACKGROUND];
}

export interface ToggleThemeBackgroundMessage extends Message {
    type: BackgroundMessageType.TOGGLE_THEME;
    target: [MessageTarget.BACKGROUND];
}

export interface SyncOptionsBackgroundMessage extends Message {
    type: BackgroundMessageType.SYNC_OPTIONS;
    target: [MessageTarget.BACKGROUND];
}

export type BackgroundMessage =
    | OpenOptionsPageBackgroundMessage
    | RequestTimestampBackgroundMessage
    | SaveTimestampBackgroundMessage
    | RequestContentDataBackgroundMessage
    | RequestOptionsBackgroundMessage
    | SaveSyncOptionBackgroundMessage
    | SaveOptionsBackgroundMessage
    | RequestThemeBackgroundMessage
    | ToggleThemeBackgroundMessage
    | SyncOptionsBackgroundMessage;

export interface TimestampInfoContentMessage extends Message {
    type: ContentMessageType.TIMESTAMP_INFO;
    target: [MessageTarget.CONTENT];
    data: { timestamp: number };
}

export interface ContentDataInfoContentMessage extends Message {
    type: ContentMessageType.CONTENT_DATA_INFO;
    target: [MessageTarget.CONTENT];
    data: { contentData: VideoInfo[] | null };
}

export interface ThemeInfoContentMessage extends Message {
    type: ContentMessageType.THEME_INFO;
    target: [MessageTarget.CONTENT];
    data: { theme: ThemeEnum };
}

export interface OptionsInfoMessage extends Message {
    type: ContentOptionsMessageType.OPTIONS_INFO;
    target: [MessageTarget.CONTENT, MessageTarget.OPTIONS];
    data: { options: UserOptions };
}

export type ContentMessage = TimestampInfoContentMessage | ContentDataInfoContentMessage | OptionsInfoMessage;

export type OptionsMessage = OptionsInfoMessage;
