export type GalleryFlipDirection = "horizontal" | "vertical";

export interface GalleryTransformState {
    rotation: number;
    flipX: 1 | -1;
    flipY: 1 | -1;
}

export interface GalleryButtonConfig {
    icon: string;
    title: string;
    onClick: (image: HTMLElement) => void;
}
