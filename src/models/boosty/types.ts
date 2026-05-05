import { PlayerUrl } from "../video/types";

export interface BaseData {
    type: string;
}

export interface VideoData extends BaseData {
    type: "ok_video";
    id?: string;
    playerUrls: PlayerUrl[];
    preview?: string;
    previewId?: string | null;
    defaultPreview?: string;
    vid?: string;
}

export type Data = VideoData | BaseData;

export interface DialogData {
    data: Data[];
}

export interface BlogResponse {
    data: Data[];
}

export interface DialogResponse {
    data: DialogData[];
}

export interface BlogContentMetadata {
    id: string;
    type: "post";
    blogName: string;
}

export interface DialogContentMetadata {
    id: string;
    type: "dialog";
}

export interface UnknownContentMetadata {
    type: "unknown";
}

export type ContentMetadata = BlogContentMetadata | DialogContentMetadata;
export type ContentMetadataWithUnknown = ContentMetadata | UnknownContentMetadata;
