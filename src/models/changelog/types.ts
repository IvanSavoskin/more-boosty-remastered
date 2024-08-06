export interface ChangelogElement {
    ru: string[];
    en: string[];
}

export interface Changelog {
    latest?: ChangelogElement;
    previous?: ChangelogElement;
}
