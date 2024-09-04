import { Changelog } from "@models/changelog/types";

const changelog: Changelog = {
    "1.0.0": {
        title: {
            en: "Update 1.0.0",
            ru: "Обновление 1.0.0"
        },
        message: {
            ru: [
                "Поддержка новой версии сайта.",
                "Полностью переписано расширение с использованием более надежных и современных технологий.",
                "Увеличена надежность приложения и улучшена обработка ошибок"
            ],
            en: [
                "New website version support.",
                "The extension has been completely rewritten using more reliable and modern technologies.",
                "Increased application reliability and improved error handling"
            ]
        },
        link: "https://github.com/IvanSavoskin/more-boosty-remaster/releases/tag/v1.0.0"
    },
    "1.0.2": {
        title: {
            en: "Update 1.0.2",
            ru: "Обновление 1.0.2"
        },
        message: {
            ru: ["Исправлена проблема обновления настроек", "Доработаны нотификации о новых версиях"],
            en: ["Fixed the problem with updating settings", "Improved notifications about new versions"]
        },
        link: "https://github.com/IvanSavoskin/more-boosty-remaster/releases/tag/v1.0.2"
    }
};

export default changelog;
