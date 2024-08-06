export interface ChangelogElement {
    title: {
        ru: string;
        en: string;
    };
    message: {
        ru: string[];
        en: string[];
    };
    link: string;
}

export interface Changelog {
    [version: string]: ChangelogElement;
}
