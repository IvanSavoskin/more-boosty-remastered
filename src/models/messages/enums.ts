export enum MessageTarget {
    BACKGROUND = "background",
    CONTENT = "content",
    OPTIONS = "options"
}

export enum BackgroundMessageType {
    OPEN_OPTIONS_PAGE = "openOptionsPage",
    REQUEST_TIMESTAMP = "requestTimestamp",
    SAVE_TIMESTAMP = "saveTimestamp",
    REQUEST_CONTENT_DATA = "requestContentData",
    REQUEST_PLAYBACK_RATE = "requestPlaybackRate",
    SAVE_PLAYBACK_RATE = "savePlaybackRate",
    REQUEST_OPTIONS = "requestOptions",
    SAVE_OPTIONS = "saveOptions",
    SAVE_SYNC_OPTION = "saveSyncOption",
    REQUEST_THEME = "requestTheme",
    TOGGLE_THEME = "toggleTheme",
    SYNC_OPTIONS = "syncOptions"
}

export enum ContentMessageType {
    TIMESTAMP_INFO = "timestampInfo",
    CONTENT_DATA_INFO = "contentDataInfo",
    PLAYBACK_RATE_INFO = "playbackRateInfo",
    THEME_INFO = "themeInfo"
}

export enum ContentOptionsMessageType {
    OPTIONS_INFO = "optionsInfo",
    OPTIONS_UPDATED = "optionsUpdated"
}
