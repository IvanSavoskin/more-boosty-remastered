export interface PlayerUrl {
    type: string;
    url: string;
}

export interface VideoInfo {
    videoUrls: PlayerUrl[];
    videoId?: string | null;
}
