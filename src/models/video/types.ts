export interface PlayerUrl {
    type: string;
    url: string;
}

export interface VideoInfo {
    duration?: number;
    videoUrls: PlayerUrl[];
    videoId?: string | null;
    videoIds?: string[];
}
